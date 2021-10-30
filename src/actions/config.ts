import { readJson, writeJson, pathJoin, exists } from "../helpers/file";
import { task, print, pen, get, set, isUndefined } from "../helpers/utils";
import questions from "../questions/config";

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

  if (opt.key) {
    if (isUndefined(get(config, opt.key))) {
      print.error(`Can't find any configuration with key ${opt.key}`);
      return;
    }

    if (opt.value) {
      // update the config by key
      set(config, opt.key, opt.value);
      await task({
        processText: 'Updating configuration',
        successText: `Updated ${pen.green(opt.key)} to ${pen.green(opt.value)}`,
        fn: async () => writeJson([basePath, opt.config], config),
      });
    } else {
      // display the config by key
      print.log(opt.key, '=', get(config, opt.key));
    }
    return;
  }

  questions(basePath).forEach(e => {
    print.log(e.name, '=', get(config, e.name))
  });
}