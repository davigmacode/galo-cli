import { isEmpty, omit, get, set } from "../helpers/utils";
import { task, prompt, print } from "../helpers/ui";
import { writeJson, readJson, readFile, pathJoin, exists, mimeLookup } from "../helpers/file";
import Arweave from "arweave";

export default async ({
  uploadType,
  basePath,
  configPath,
  config,
  cachedPath,
  cached,
  generation,
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

  const n = generation.length;
  const typePath = uploadType == 'artwork' ? config.artworks.path : config.metadata.path;
  const typeExt = uploadType == 'artwork' ? config.artworks.ext : '.json';
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  for (let i = 0; i < n; i++) {
    const progress = `[${i+1}/${n}]`;
    const gen = generation[i];
    const id = gen.id;
    if (!get(cached, [id, uploadType])) {
      const fileName = `${id}${typeExt}`;
      const filePath = pathJoin(basePath, typePath, fileName);
      const fileMime = mimeLookup(filePath) || 'application/octet-stream';
      const fileData = readFile(filePath, typeExt);
      const tx = await task({
        processText: `${progress} Uploading ${uploadType} #${id} to ${storage.label}`,
        successText: `${progress} Uploaded ${uploadType} #${id} to ${storage.label}`,
        fn: async (spinner) => {
          const tx = await arweave.createTransaction({ data: fileData }, token);
          tx.addTag('Content-Type', fileMime);
          await arweave.transactions.sign(tx, token);
          const uploader = await arweave.transactions.getUploader(tx);
          const text = spinner.text;
          while (!uploader.isComplete) {
            await uploader.uploadChunk();
            spinner.text = `${text} - ${uploader.pctComplete}% complete`;
          }
          await arweave.transactions.post(tx);
          return tx;
        },
      }).catch((error) => print.error(progress, error));
      const cacheData = {
        id: tx.id,
        uri: `ar://${tx.id}`,
        url: `https://arweave.net/${tx.id}`,
        type: fileMime
      };
      set(cached, [id, uploadType], cacheData);
      writeJson(cachedPath, cached);
    } else {
      print.success(progress, `Cached ${uploadType} #${id}`);
    }
  }
}