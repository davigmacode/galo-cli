import { readJson, pathJoin, exists, write, pathNormalize } from "../helpers/file";
import { task, print } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationsPath = pathJoin(basePath, 'generations.json');
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

  const exportPath = pathNormalize([basePath, '.cache', `${opt.env}-${opt.name}`]);
  await task({
    processText: 'Writing metaplex compatible data',
    successText: `Metaplex data: ${exportPath}`,
    fn: async () => {
      let cache = { items: {} }
      for (const gen of generations) {
        const meta = readJson([basePath, config.metadata.path, gen.edition.toString()]);
        cache.items[gen.edition] = {
          link: gen.metadata[opt.storage].url,
          name: meta.name,
          onChain: false,
        }
      }
      write(exportPath, JSON.stringify(cache));
    },
  });
}