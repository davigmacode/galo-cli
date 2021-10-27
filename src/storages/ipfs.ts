import { task, prompt, isEmpty, omit, print } from "../helpers/utils";
import { writeJson, readJson, readImage, pathJoin } from "../helpers/file";
import { NFTStorage, File } from "nft.storage";

export default async ({ basePath, configPath, config, provider, metadata }: UploadsConfig) => {
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

  // read uploads cache file
  const uploadsPath = pathJoin(basePath, storage.cache);
  const uploads = await task({
    processText: 'Loading cached uploads',
    successText: `Cached Uploads: ${uploadsPath}`,
    fn: async () => readJson(uploadsPath),
  });

  const n = metadata.length;
  const ipfs = new NFTStorage({ token: storage.token });
  for (let i = 0; i < n; i++) {
    const c = `[${i+1}/${n}]`;
    const meta = metadata[i];
    if (!uploads[meta.edition]) {
      const uploaded = await task({
        processText: `${c} Uploading artworks and metadata #${meta.edition}`,
        successText: `${c} Uploaded artworks and metadata #${meta.edition}`,
        fn: async () => {
          const file = readImage([basePath, config.artworks.path, meta.image]);
          meta.image = new File([file], meta.image, { type: 'image/png' });
          return ipfs.store(meta);
        },
      }).catch((error) => print.error(c, error));
      uploads[meta.edition] = uploaded;
      writeJson(uploadsPath, uploads);
    } else {
      print.success(c, `Cached artworks and metadata #${meta.edition}`);
    }
  }
}