import { readJson, pathJoin, exists } from "../helpers/file";
import { buildCollage } from "../helpers/collage";
import { task, print } from "../helpers/ui";
import { loadConfig } from "../helpers/config";

export default async (basePath: string, opt: any) => {
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

  // create a collection preview collage
  const collagePath = pathJoin(basePath, config.collage.name);
  await task({
    processText: 'Creating a collection preview collage',
    successText: `Collection Collage: ${collagePath}`,
    fn: async () => buildCollage({
      basePath: basePath,
      generation: generation,
      artworks: config.artworks,
      collage: config.collage
    }),
  });
}