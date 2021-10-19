import { Command } from 'commander';
const program = new Command();

program
  .name("galo")
  .version('0.0.2')
  .showHelpAfterError();

program
  .command('init')
  .description('create a new generative artworks project')
  .argument(
    '[dir]',
    'directory to init the artworks project',
    process.cwd()
  )
  .option('-c, --config <path>', 'set config path', './config.json')
  .action((dir) => {
    console.log(dir);
  });

program
  .command('build')
  .description('generate the artworks, metadata, rarity, and collage')
  .option('-c, --config <path>', 'set config path', './config.json');

program
  .command('upload')
  .description('upload the generated artworks to decentralized storage')
  .option('-c, --config <path>', 'set config path', './config.json');

program.parse(process.argv);