import { readJson, pathJoin, exists } from "../helpers/file";
import { buildCollage } from "../helpers/collage";
import { pen, task } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Build Collection Collage'));

  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    console.log(pen.green(`Generations not found, build the collection first`));
    return;
  }

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
      previewPath: config.collage.name,
      thumbWidth: config.collage.width,
      thumbPerRow: config.collage.perRow,
      imageRatio: config.artworks.width / config.artworks.height,
      generations: generations,
    }),
  });
}