import { readJson, pathJoin, exists } from "../helpers/file";
import { task, prompt, print } from "../helpers/utils";
import ipfs from "../storages/ipfs";

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

  const metadataPath = pathJoin(basePath, config.metadata.config);
  const metadataExists = exists(metadataPath);
  if (!metadataExists) {
    print.warn(`Metadata not found, build the collection first`);
    return;
  }

  // read metadata config file
  const metadata = await task({
    processText: 'Loading collection metadata',
    successText: `Collection Metadata: ${metadataPath}`,
    fn: async () => readJson(metadataPath),
  });

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

  switch (qProvider) {
    case 'ipfs':
      await ipfs({
        basePath,
        configPath,
        config,
        metadata,
        provider: qProvider
      });
      break;

    default:
      print.warn(`${config.storage[qProvider].label} Storage is under development`);
      break;
  }
}