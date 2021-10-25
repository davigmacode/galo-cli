import { setupDir, writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { consoleInfo, consoleWarn, task, prompt } from "../helpers/utils";
import { LIB_VERSION } from "../constants";

export default async (basePath: string, opt: any) => {
  // check for the config file existence
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (configExists) {
    const { qReInitiating } : any = await prompt([
      {
        type: 'confirm',
        name: 'qReInitiating',
        message: 'Config file found, would you like to overwrite it to default value?',
        default: false,
      },
    ]).catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        // Something else went wrong
      }
    });

    // exit the action if not confirmed to re initiating
    if (!qReInitiating) {
      consoleWarn(`Initialization canceled`);
      return;
    }
  }

  const basePathExists = exists(basePath);
  if (!basePathExists) {
    await task({
      processText: 'Setup collection directory',
      successText: `Created: ${basePath}`,
      fn: async () => setupDir(basePath),
    });
  }

  await task({
    processText: 'Writing configuration',
    successText: `Created: ${configPath}`,
    fn: async () => {
      const configData = readJson([__dirname, '../config/default.json']);
      configData.engine.version = LIB_VERSION;
      configData.traits.path = opt.traitsPath;
      configData.artworks.path = opt.artworksPath;
      configData.metadata.path = opt.metadataPath;
      configData.collage.path = opt.previewPath;
      writeJson([basePath, opt.config], configData);
    },
  });

  const traitsPath = pathJoin(basePath, opt.traitsPath);
  const traitsExists = exists(traitsPath);
  if (!traitsExists) {
    await task({
      processText: 'Setup traits directory',
      successText: `Created: ${traitsPath}`,
      fn: async () => setupDir(traitsPath),
    });
  }

  consoleInfo(`Collection initialized at ${basePath}`);
}