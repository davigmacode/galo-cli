#!/usr/bin/env node

import { Command } from "commander";
import { LIB_NAME, LIB_VERSION } from "./constants";
import { cwd } from "./helpers/file";

import initAction from "./actions/init";
import buildAction from "./actions/build";
import metadataAction from "./actions/metadata";
import collageAction from "./actions/collage";
import rarityAction from "./actions/rarity";
import uploadAction from "./actions/upload";
import cleanAction from "./actions/clean";

import chalk from "chalk";
import * as header from "./header";

const banner = chalk.green(header.logo) + ' ' + chalk.bgBlue(header.author);
const program = new Command();

program
  .name(LIB_NAME)
  .version(LIB_VERSION)
  .addHelpText("beforeAll", banner)
  .showHelpAfterError()
  .hook("preAction", (_, act) => {
    console.log('');
    console.log(act.description().toUpperCase());
    console.log('===========');
    console.log(`${LIB_NAME} v${LIB_VERSION}`);
    console.log('');
    console.time(act.name());
  })
  .hook("postAction", (_, act) => {
    console.timeEnd(act.name());
  });

program
  .command('init')
  .description('initialize a new generative artworks collection')
  .argument(
    '[dir]',
    'directory to init the artworks collection',
    (val) => cwd(val),
    process.cwd()
  )
  .option('-c, --config <path>', 'set config path', './config.json')
  .option('-tc, --traits-config <path>', 'set traits config', './traits.json')
  .option('-mc, --metadata-config <path>', 'set metadata config', './metadata.json')
  .option('-tp, --traits-path <path>', 'set traits path', './traits')
  .option('-mp, --metadata-path <path>', 'set generated metadata path', './metadata')
  .option('-ap, --artworks-path <path>', 'set generated artworks path', './artworks')
  .option('-p, --preview-path <path>', 'set generated collage preview path', './collage.png')
  .action(initAction);

program
  .command('build')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('build the artworks, metadata, rarity, and collage')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(buildAction);

program
  .command('metadata')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection metadata without regenerating the artworks')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(metadataAction);

program
  .command('collage')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection collage without regenerating the artworks')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(collageAction);

program
  .command('rarity')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection rarity without regenerating the artworks')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(rarityAction);

program
  .command('upload')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('upload the artworks and metadata to decentralized storage')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(uploadAction);

program
  .command('clean')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('clean the collection directory')
  .option('-c, --config <path>', 'set config path', './config.json')
  .action(cleanAction);

program.parse(process.argv);