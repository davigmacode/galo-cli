import { writeJson, readJson, readImage, pathJoin, exists } from "../helpers/file";
import { pen, task, symbols, isEmpty } from "../helpers/utils";
import { NFTStorage, File } from "nft.storage";
import inquirer from "inquirer";

export default async (basePath: string, opt: any) => {
  const cmdTitle = pen.green('Upload Collection');
  console.log(cmdTitle);
  console.time(cmdTitle);

  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    console.log(pen.green(`Config file not found, init the collection first`));
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
    console.log(pen.green(`Metadata not found, build the collection first`));
    return;
  }

  // read metadata config file
  const metadata = await task({
    processText: 'Loading collection metadata',
    successText: `Collection Metadata: ${metadataPath}`,
    fn: async () => readJson(metadataPath),
  });

  // read metadata config file
  const uploadsPath = pathJoin(basePath, 'uploads.json');
  const uploads = await task({
    processText: 'Loading collection uploads',
    successText: `Collection Uploads: ${uploadsPath}`,
    fn: async () => readJson(uploadsPath),
  });

  let storageKey = config.storage.key;
  while (isEmpty(storageKey)) {
    const inquires = await inquirer.prompt([
      {
        type: 'input',
        name: 'storageKey',
        message: 'Cant find the storage key from the config file, please enter the key:',
      },
    ]).catch((error) => {
      console.log(symbols.error, error);
    });
    storageKey = inquires.storageKey;
  }

  config.storage.key = storageKey;
  await task({
    processText: 'Updating Config File',
    successText: `Collection Config: ${configPath}`,
    fn: async () => writeJson(configPath, config),
  });

  const n = metadata.length;
  const storage = new NFTStorage({ token: config.storage.key });
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

  console.timeEnd(cmdTitle);
}