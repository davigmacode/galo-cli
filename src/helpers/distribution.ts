import { writeJson, pathJoin, setupDir, pathRelative } from "../helpers/file";
import { isString } from "../helpers/utils";

export const createDestination = ({
  basePath,
  outputPath,
  configData,
  configName,
  generation
}) => {
  const traitsPath = pathJoin(basePath, configData.traits.path);
  const distPath = configData.distribution.path;

  const outPath = pathJoin(basePath, distPath, outputPath);
  setupDir(outPath);

  // write down the config file
  let destConfig: any = {
    engine: configData.engine,
    base: { config: pathJoin(pathRelative(outPath, basePath), configName) },
    traits: { path: pathRelative(outPath, traitsPath) }
  };
  const metaTemplate = configData.metadata.template
  if (isString(metaTemplate)) {
    destConfig.metadata = {
      template: pathJoin(pathRelative(outPath, basePath), metaTemplate)
    }
  }
  writeJson([outPath, configName], destConfig);

  // write down the picked generation
  writeJson([outPath, configData.generation.summary], generation);
}