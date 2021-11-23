import { isEmpty, omit, get, set } from "../helpers/utils";
import { task, prompt, print } from "../helpers/ui";
import { writeJson, readFile, pathJoin, readJson, exists, mimeLookup } from "../helpers/file";
import { NFTStorage, File } from "nft.storage";

export default async ({
  uploadType,
  basePath,
  configPath,
  config,
  cachedPath,
  cached,
  generation,
}: UploadsConfig) => {
  const provider = 'ipfs'
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
  const { token } = await task({
    processText: `Loading ${storage.label} token`,
    successText: `${storage.label} Token: ${tokenPath}`,
    fn: async () => readJson(tokenPath),
  });

  const n = generation.length;
  const typePath = uploadType == 'artwork' ? config.artworks.path : config.metadata.path;
  const typeExt = uploadType == 'artwork' ? config.artworks.ext : '.json';
  const ipfs = new NFTStorage({ token });
  for (let i = 0; i < n; i++) {
    const progress = `[${i+1}/${n}]`;
    const gen = generation[i];
    const id = gen.id;
    if (!get(cached, [id, uploadType])) {
      const fileName = `${id}${typeExt}`;
      const filePath = pathJoin(basePath, typePath, fileName);
      const fileMime = mimeLookup(filePath) || 'application/octet-stream';
      const fileData = readFile(filePath, typeExt);
      const fileBlob = new File([fileData], fileName, { type: fileMime });
      const txId = await task({
        processText: `${progress} Uploading ${uploadType} #${id} to ${storage.label}`,
        successText: `${progress} Uploaded ${uploadType} #${id} to ${storage.label}`,
        fn: async () => ipfs.storeBlob(fileBlob),
      }).catch((error) => print.error(progress, error));
      const cacheData = {
        id: txId,
        uri: `ipfs://${txId}`,
        url: `https://ipfs.io/ipfs/${txId}`,
        type: fileMime
      };
      set(cached, [id, uploadType], cacheData);
      writeJson(cachedPath, cached);
    } else {
      print.success(progress, `Cached ${uploadType} #${id}`);
    }
  }
}