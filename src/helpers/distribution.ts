import { writeJson, pathJoin, setupDir, pathRelative } from "../helpers/file";
import { isString } from "../helpers/utils";

export const createDestination = ({
  basePath,
  destPath,
  configData,
  configName,
  generation
}) => {
  const traitsPath = pathJoin(basePath, configData.traits.path);
  const distPath = configData.distribution.path;

  const absoluteDestPath = pathJoin(basePath, distPath, destPath);
  setupDir(absoluteDestPath);

  // write down the config file
  let destConfig: any = {
    engine: configData.engine,
    base: { config: pathJoin(pathRelative(absoluteDestPath, basePath), configName) },
    traits: { path: pathRelative(absoluteDestPath, traitsPath) }
  };
  const metaTemplate = configData.metadata.template
  if (isString(metaTemplate)) {
    destConfig.metadata = {
      template: pathJoin(pathRelative(absoluteDestPath, basePath), metaTemplate)
    }
  }
  writeJson([absoluteDestPath, configName], destConfig);

  // write down the picked generation
  writeJson([absoluteDestPath, configData.generation.summary], generation);
}