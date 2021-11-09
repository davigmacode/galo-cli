import { setupDir, writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { merge, isNil } from "../helpers/utils";
import { LIB_VERSION } from "../constants";
import questions from "../questions/config";

export default async (basePath: string, opt: any) => {
  // check for the config file existence
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (configExists) {
    if (isNil(opt.force)) {
      const { qOverwrite } : any = await prompt([
        {
          type: 'confirm',
          name: 'qOverwrite',
          message: 'Config file found, would you like to overwrite it to default value?',
          default: false,
        },
      ]).catch((error) => print.error(error));
      opt.force = qOverwrite;
    }

    // exit the action if not confirmed to re initiating
    if (!opt.force) {
      print.warn(`Initialization canceled`);
      return;
    }
  }

  const configAnswers: any = await prompt(questions(basePath)).catch((e) => print.error(e));
  const configDefault = readJson([__dirname, '../config/default.json']);
  const configEngine = { engine: { version: LIB_VERSION } };
  const configData = merge(merge(configDefault, configEngine), configAnswers);

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