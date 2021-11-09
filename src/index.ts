#!/usr/bin/env node

import { Command } from "commander";
import { LIB_NAME, LIB_VERSION } from "./constants";
import { cwd } from "./helpers/file";

import initAction from "./actions/init";
import configAction from "./actions/config";
import buildAction from "./actions/build";
import traitsAction from "./actions/traits";
import artworksAction from "./actions/artworks";
import metadataAction from "./actions/metadata";
import collageAction from "./actions/collage";
import rarityAction from "./actions/rarity";
import uploadAction from "./actions/upload";
import exportAction from "./actions/export";
import destroyAction from "./actions/destroy";

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
  .alias('i')
  .description('initialize a new generative artworks collection')
  .argument(
    '[dir]',
    'directory to init the artworks collection',
    (val) => cwd(val),
    process.cwd()
  )
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(initAction);

program
  .command('config')
  .alias('c')
  .description('display or update the configuration data')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .option('-c, --config <path>', 'set config path', './galo.json')
  .option('-k, --key <path>', 'the configuration key to display or update')
  .option('-v, --value <path>', 'the configuration value to update')
  .action(configAction);

program
  .command('build')
  .alias('b')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('build the generations of artworks, metadata, rarity, and collage')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .option('-g, --generations', 'with build new generations')
  .option('-a, --artworks', 'with build the artworks', true)
  .option('-ng, --no-generations', 'without build new generations')
  .option('-na, --no-artworks', 'without build the artworks')
  .action(buildAction);

program
  .command('traits')
  .alias('t')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('populate collection traits without building the generations')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(traitsAction);

program
  .command('artworks')
  .alias('a')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection artworks without rebuilding the generations')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(artworksAction);

program
  .command('metadata')
  .alias('m')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection metadata without rebuilding the generations')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(metadataAction);

program
  .command('preview')
  .alias('p')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection preview without rebuilding the generations')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(collageAction);

program
  .command('rarity')
  .alias('r')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('create collection rarity without rebuilding the generations')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .action(rarityAction);

program
  .command('upload')
  .alias('u')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('upload the artworks and metadata to decentralized storage')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .option('-m, --metadata', 'upload metadata instead of artworks', false)
  .action(uploadAction);

program
  .command('export')
  .alias('e')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('export to metaplex compatible data')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .option('-s, --storage <provider>', 'set storage provider', 'ipfs')
  .option('-o, --output <path>', 'set output path', './.cache/devnet-galo')
  .action(exportAction);

program
  .command('destroy')
  .alias('d')
  .argument(
    '[dir]',
    'collection directory, use current dir if not supplied',
    (val) => cwd(val),
    process.cwd()
  )
  .description('destroy the generated files and directories')
  .option('-c, --config <path>', 'set config path', './galo.json')
  .option('-rc, --remove-config', 'remove the config file')
  .option('-nrc, --no-remove-config', 'without remove the config file')
  .action(destroyAction);

program.parse(process.argv);