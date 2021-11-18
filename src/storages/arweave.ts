import { isEmpty, omit, get, set } from "../helpers/utils";
import { task, prompt, print } from "../helpers/ui";
import { writeJson, readJson, readFile, pathJoin, exists, mimeLookup } from "../helpers/file";
import Arweave from "arweave";
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';

export default async ({
  uploadType,
  basePath,
  configPath,
  config,
  cachedPath,
  cached,
  generations,
}: UploadsConfig) => {
  const provider = 'arweave';
  let storage = config.storage[provider];

  if (isEmpty(storage.token)) {
    while (isEmpty(storage.token)) {
      const { qToken } : any = await prompt([
        {
          type: 'input',
          name: 'qToken',
          message: `Cant find ${storage.label} token in the config file, please enter the token:`,
        },
      ]).catch((error) => print.error(error));
      storage.token = qToken;
    }

    storage = omit(storage, 'name');
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  const tokenPath = pathJoin(basePath, storage.token);
  const tokenExists = exists(tokenPath);
  if (!tokenExists) {
    print.warn(`${storage.label} key not found, build the collection first`);
    return;
  }
  const token = await task({
    processText: `Loading ${storage.label} token`,
    successText: `${storage.label} Token: ${tokenPath}`,
    fn: async () => readJson(tokenPath),
  });

  const n = generations.length;
  const typePath = uploadType == 'artwork' ? config.artworks.path : config.metadata.path;
  const typeExt = uploadType == 'artwork' ? config.artworks.ext : '.json';
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  for (let i = 0; i < n; i++) {
    const progress = `[${i+1}/${n}]`;
    const gen = generations[i];
    const edition = gen.edition;
    if (!get(cached, [edition, uploadType])) {
      const { id } = await task({
        processText: `${progress} Uploading ${uploadType} #${edition} to ${storage.label}`,
        successText: `${progress} Uploaded ${uploadType} #${edition} to ${storage.label}`,
        fn: async (spinner) => {
          const fileName = `${edition}${typeExt}`;
          const filePath = pathJoin(basePath, typePath, fileName);
          const fileMime = mimeLookup(filePath) || 'application/octet-stream';
          const fileData = readFile(filePath, typeExt);
          return arweaveUpload(
            arweave,
            fileData,
            fileMime,
            token,
            true,
            spinner
          );
        },
      }).catch((error) => print.error(progress, error));
      const cacheData = { id, uri: `ar://${id}`, url: `https://arweave.net/${id}` };
      set(cached, [edition, uploadType], cacheData);
      writeJson(cachedPath, cached);
    } else {
      print.success(progress, `Cached ${uploadType} #${edition}`);
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