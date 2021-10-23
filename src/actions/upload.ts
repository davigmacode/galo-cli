import { writeJson, readJson, readImage, pathJoin, exists } from "../helpers/file";
import { task, symbols, isEmpty, consoleWarn } from "../helpers/utils";
import { NFTStorage, File } from "nft.storage";
import inquirer from "inquirer";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    consoleWarn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const metadataPath = pathJoin(basePath, config.metadata.config);
  const metadataExists = exists(metadataPath);
  if (!metadataExists) {
    consoleWarn(`Metadata not found, build the collection first`);
    return;
  }

  // read metadata config file
  const metadata = await task({
    processText: 'Loading collection metadata',
    successText: `Collection Metadata: ${metadataPath}`,
    fn: async () => readJson(metadataPath),
  });

  const { qStorageProvider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'qStorageProvider',
      message: 'Where do you want to upload?',
      choices: Object
        .keys(config.storage)
        .map((value) => ({ ...config.storage[value], value })),
    },
  ]).catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });

  const storageProvider = config.storage[qStorageProvider];
  if (isEmpty(storageProvider.token)) {
    while (isEmpty(storageProvider.token)) {
      const { qStorageToken } = await inquirer.prompt([
        {
          type: 'input',
          name: 'qStorageToken',
          message: `Cant find ${storageProvider.name} token in the config file, please enter the token:`,
        },
      ]).catch((error) => {
        console.log(symbols.error, error);
      });
      storageProvider.token = qStorageToken;
    }

    config.storage[qStorageProvider] = storageProvider;
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  // read metadata config file
  const uploadsPath = pathJoin(basePath, 'uploads.json');
  const uploads = await task({
    processText: 'Loading cached uploads',
    successText: `Cached Uploads: ${uploadsPath}`,
    fn: async () => readJson(uploadsPath),
  });

  const n = metadata.length;
  const storage = new NFTStorage({ token: storageProvider.token });
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
          return storage.store(meta);
        },
      }).catch((error) => {
        console.log(symbols.success, c, error);
      });
      uploads[meta.edition] = uploaded;
      writeJson(uploadsPath, uploads);
    } else {
      console.log(symbols.success, c, `Cached artworks and metadata #${meta.edition}`);
    }
  }
}