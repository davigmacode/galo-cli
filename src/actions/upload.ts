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

  const typeName = opt.metadata ? 'metadata' : 'artwork';
  switch (opt.storage) {
    case 'ipfs':
      await ipfs({
        basePath,
        configPath,
        config,
        generations,
        typeName,
      });
      break;
    case 'arweave':
      await arweave({
        basePath,
        configPath,
        config,
        generations,
        typeName,
      });
      break;
    default:
      print.warn(`${config.storage[opt.storage].label} Storage is under development`);
      break;
  }
}