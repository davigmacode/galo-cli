import { setupDir, writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { task, prompt, print, merge } from "../helpers/utils";
import { LIB_VERSION } from "../constants";
import questions from "../questions/config";

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
    ]).catch((error) => print.error(error));

    // exit the action if not confirmed to re initiating
    if (!qReInitiating) {
      print.warn(`Initialization canceled`);
      return;
    }
  }

  const configAnswers: any = await prompt(questions(basePath)).catch((e) => print.error(e));
  const configDefault = readJson([__dirname, '../config/default.json']);
  const configEngine = { engine: { version: LIB_VERSION } };
  const configData = merge({ ...configDefault, ...configEngine }, configAnswers);

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
    fn: async () => writeJson([basePath, opt.config], configData),
  });

  const traitsPath = pathJoin(basePath, configData.traits.path);
  const traitsExists = exists(traitsPath);
  if (!traitsExists) {
    await task({
      processText: 'Setup traits directory',
      successText: `Created: ${traitsPath}`,
      fn: async () => setupDir(traitsPath),
    });
  }

  print.success(`Collection initialized at ${basePath}`);
}