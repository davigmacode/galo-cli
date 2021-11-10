import { readJson, pathJoin, exists } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { isNil } from "../helpers/utils";
import ipfs from "../storages/ipfs";
import arweave from "../storages/arweave";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationsPath = pathJoin(basePath, config.generations.config);
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    print.warn(`Generations not found, build the collection first`);
    return;
  }

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
  });

  if (isNil(opt.storage)) {
    const { qProvider } : any = await prompt([
      {
        type: 'list',
        name: 'qProvider',
        message: 'Where do you want to upload?',
        choices: Object
          .keys(config.storage)
          .map((key) => ({
            name: config.storage[key].label,
            value: key
          })),
      },
    ]).catch((error) => print.error(error));
    opt.storage = qProvider;
  }

  // read the cached data from file
  const provider = opt.storage;
  const storage = config.storage[provider];
  if (!storage) {
    print.warn(`"${provider}" is not a supported storage provider`);
    return;
  }

  const cachedPath = pathJoin(basePath, storage.cache);
  const cached = await task({
    processText: 'Loading cached data from file',
    successText: `Cached storage: ${cachedPath}`,
    fn: async () => readJson(cachedPath),
  });

  const uploadType = opt.metadata ? 'metadata' : 'artwork';
  switch (provider) {
    case 'ipfs':
      await ipfs({
        uploadType,
        basePath,
        configPath,
        config,
        cachedPath,
        cached,
        generations,
      });
      break;
    case 'arweave':
      await arweave({
        uploadType,
        basePath,
        configPath,
        config,
        cachedPath,
        cached,
        generations,
      });
      break;
    default:
      print.warn(`${storage.label} Storage is under development`);
      break;
  }
}