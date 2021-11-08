import { task, prompt, isEmpty, omit, print, get, set } from "../helpers/utils";
import { writeJson, readFile, pathJoin } from "../helpers/file";
import { NFTStorage, File } from "nft.storage";
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

    config.storage[provider] = omit(storage, 'name');
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  const n = generations.length;
  const generationsPath = pathJoin(basePath, 'generations.json');
  const typePath = typeName == 'artwork' ? config.artworks.path : config.metadata.path;
  const typeExt = typeName == 'artwork' ? config.artworks.ext : '.json';
  const ipfs = new NFTStorage({ token: storage.token });
  for (let i = 0; i < n; i++) {
    const c = `[${i+1}/${n}]`;
    const gen = generations[i];
    if (!get(gen, [typeName, 'ipfs'])) {
      const uploaded = await task({
        processText: `${c} Uploading ${typeName} #${gen.edition}`,
        successText: `${c} Uploaded ${typeName} #${gen.edition}`,
        fn: async () => {
          const fileName = `${gen.edition}${typeExt}`;
          const filePath = pathJoin(basePath, typePath, fileName);
          const fileMime = mime.lookup(filePath) || 'application/octet-stream';
          const fileData = readFile(filePath, typeExt);
          const fileBlob = new File([fileData], fileName, { type: fileMime });
          return ipfs.storeBlob(fileBlob);
        },
      }).catch((error) => print.error(c, error));
      set(gen, [typeName, 'ipfs'], uploaded);
      writeJson(generationsPath, generations);
    } else {
      print.success(c, `Cached ${typeName} #${gen.edition}`);
    }
  }
}