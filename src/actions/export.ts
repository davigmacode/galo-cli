import { readJson, pathJoin, exists, writeFile, pathNormalize } from "../helpers/file";
import { task, print, prompt } from "../helpers/ui";
import { isNil } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const outputPath = pathNormalize([basePath, opt.output]);
  const outputExists = exists(outputPath);
  if (outputExists) {
    if (isNil(opt.force)) {
      const { qOverwrite } : any = await prompt([
        {
          type: 'confirm',
          name: 'qOverwrite',
          message: `${outputPath} exists, would you like to overwrite it?`,
          default: false,
        },
      ]).catch((error) => print.error(error));
      opt.force = qOverwrite;
    }

    // exit the action if not confirmed to overwrite
    if (!opt.force) {
      print.warn(`Export metadata canceled`);
      return;
    }
  }

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

  await task({
    processText: 'Writing metaplex compatible data',
    successText: `Metaplex data: ${outputPath}`,
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
      writeFile(outputPath, JSON.stringify(cache));
    },
  });
}