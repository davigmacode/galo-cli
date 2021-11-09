import { task, prompt, isEmpty, omit, print, get, set } from "../helpers/utils";
import { writeJson, readJson, readFile, pathJoin } from "../helpers/file";
import Arweave from "arweave";
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
import mime from "mime-types";

export default async ({
  basePath,
  configPath,
  config,
  provider,
  generations,
  typeName,
}: UploadsConfig) => {
  const storage = config.storage[provider];

  if (isEmpty(storage.keyfile)) {
    while (isEmpty(storage.keyfile)) {
      const { qKeyfile } : any = await prompt([
        {
          type: 'input',
          name: 'qKeyfile',
          message: `Cant find ${storage.label} keyfile in the config file, please enter the keyfile:`,
        },
      ]).catch((error) => print.error(error));
      storage.keyfile = qKeyfile;
    }

    config.storage[provider] = omit(storage, 'name');
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  const keyfilePath = pathJoin(basePath, storage.keyfile);
  const keyfile = await task({
    processText: 'Loading arweave keyfile',
    successText: `Arweave Keyfile: ${keyfilePath}`,
    fn: async () => readJson(keyfilePath),
  });

  const n = generations.length;
  const generationsPath = pathJoin(basePath, 'generations.json');
  const typePath = typeName == 'artwork' ? config.artworks.path : config.metadata.path;
  const typeExt = typeName == 'artwork' ? config.artworks.ext : '.json';
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  for (let i = 0; i < n; i++) {
    const c = `[${i+1}/${n}]`;
    const gen = generations[i];
    if (!get(gen, [typeName, 'arweave'])) {
      const { id } = await task({
        processText: `${c} Uploading ${typeName} #${gen.edition}`,
        successText: `${c} Uploaded ${typeName} #${gen.edition}`,
        fn: async (spinner) => {
          const fileName = `${gen.edition}${typeExt}`;
          const filePath = pathJoin(basePath, typePath, fileName);
          const fileMime = mime.lookup(filePath) || 'application/octet-stream';
          const fileData = readFile(filePath, typeExt);
          return arweaveUpload(
            arweave,
            fileData,
            fileMime,
            keyfile,
            true,
            spinner
          );
        },
      }).catch((error) => print.error(c, error));
      set(gen, [typeName, 'arweave'], { id, url: `https://arweave.net/${id}` });
      writeJson(generationsPath, generations);
    } else {
      print.success(c, `Cached ${typeName} #${gen.edition}`);
    }
  }
}

export const arweaveUpload = async (
  arweave: Arweave,
  data: Buffer | string,
  fileType: string,
  jwk: JWKInterface,
  isUploadByChunk = false,
  spinner: any,
): Promise<Transaction> => {
  const tx = await arweave.createTransaction({ data: data }, jwk);
  tx.addTag('Content-Type', fileType);
  await arweave.transactions.sign(tx, jwk);
  if (isUploadByChunk) {
    const uploader = await arweave.transactions.getUploader(tx);
    const text = spinner.text;
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      spinner.text = `${text} - ${uploader.pctComplete}% complete`;
    }
  }
  await arweave.transactions.post(tx);
  return tx;
};