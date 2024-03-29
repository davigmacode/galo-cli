import { readJson, pathJoin, exists, writeFile, pathNormalize } from "../helpers/file";
import { task, print, prompt } from "../helpers/ui";
import { isNil } from "../helpers/utils";
import { loadConfig } from "../helpers/config";

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
  const config: GaloConfig = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => loadConfig(basePath, opt.config),
  });

  // read the cached data from file
  const provider = opt.storage;
  const storage = config.storage[provider];
  if (!storage) {
    print.warn(`"${provider}" is not a supported storage provider`);
    return;
  }

  const generationPath = pathJoin(basePath, config.generation.summary);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the generation from file
  const generation: Gen[] = await task({
    processText: 'Loading generation from file',
    successText: `Collection generation: ${generationPath}`,
    fn: async () => readJson(generationPath),
  });

  const cachedPath = pathJoin(basePath, storage.cache);
  const cached = await task({
    processText: 'Loading cached data from file',
    successText: `Cached storage: ${cachedPath}`,
    fn: async () => readJson(cachedPath),
  });

  await task({
    processText: 'Writing metaplex compatible data',
    successText: `Metaplex data: ${outputPath}`,
    fn: async () => {
      let output = { items: {} }
      for (const gen of generation) {
        const id = gen.id.toString();
        const meta = readJson([basePath, config.metadata.path, id]);
        output.items[id] = {
          link: cached[id].metadata.url,
          name: meta.name,
          onChain: false,
        }
      }
      writeFile(outputPath, JSON.stringify(output));
    },
  });
}