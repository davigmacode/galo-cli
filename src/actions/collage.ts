import { readJson, pathJoin, exists } from "../helpers/file";
import { buildCollage } from "../helpers/collage";
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

  // create a collection preview collage
  const collagePath = pathJoin(basePath, config.collage.name);
  await task({
    processText: 'Creating a collection preview collage',
    successText: `Collection Collage: ${collagePath}`,
    fn: async () => buildCollage({
      basePath: basePath,
      artworksPath: config.artworks.path,
      artworksExt: config.artworks.ext,
      previewPath: config.collage.name,
      thumbWidth: config.collage.thumbWidth,
      thumbPerRow: config.collage.thumbPerRow,
      editions: config.collage.editions,
      imageRatio: config.artworks.width / config.artworks.height,
      generations: generations,
    }),
  });
}