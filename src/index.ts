import { Command } from "commander";
import { LIB_NAME, LIB_VERSION } from "./constants";
import { cwd } from "./helpers/file";

import initAction from "./actions/init";
import buildAction from "./actions/build";
import uploadAction from "./actions/upload";

const program = new Command();

program
  .name(LIB_NAME)
  .version(LIB_VERSION)
  .showHelpAfterError();

program
  .command('init')
  .description('create a new generative artworks project')
  .argument(
    '[dir]',
    'directory to init the artworks project',
    (val) => cwd(val),
    process.cwd()
  )
  .option('-c, --config <path>', 'set config path', './config.json')
  .option('-tc, --traits-config <path>', 'set traits config', './traits.json')
  .option('-mc, --metadata-config <path>', 'set metadata config', './metadata.json')
  .option('-tp, --traits-path <path>', 'set traits path', './traits')
  .option('-mp, --metadata-path <path>', 'set generated metadata path', './metadata')
  .option('-ap, --artworks-path <path>', 'set generated artworks path', './artworks')
  .option('-sp, --storage-provider <name>', 'set storage provider name', 'NFTStorage')
  .option('-sk, --storage-key <token>', 'set storage key token')
  .option('-p, --preview <path>', 'set generated collage preview path', './collage.png')
  .action(initAction);

program
  .command('build')
  .description('generate the artworks, metadata, rarity, and collage')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(buildAction);

program
  .command('upload')
  .description('upload the generated artworks to decentralized storage')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(uploadAction);

program.parse(process.argv);