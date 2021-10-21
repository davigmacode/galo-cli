import { setupDir, writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { pen, task } from "../helpers/utils";
import { LIB_VERSION } from "../constants";
import inquirer from "inquirer";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Init Collection'));

  // check for the config file existence
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (configExists) {
    const inquires = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reInitiating',
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
    if (!inquires.reInitiating) {
      console.log(pen.green(`Initialization canceled`));
      return;
    }
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
      configData.storage.provider = opt.storageProvider;
      configData.storage.key = opt.storageKey;
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

  console.log(pen.green(`Collection initialized at ${basePath}`));
}