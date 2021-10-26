import debug from "debug";
import faker from "faker";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";

export {
	isEmpty, isArray, isString,
	get, set, findKey, pick, omit
} from "lodash";

const log = debug("utils");

export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

export const shuffle = (array: any[], round: number = 1) : any[] => {
  log(`shuffle #${round}`);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return round > 1 ? shuffle(array, round-1) : array;
}

export const parseString = (
  template: string,
  variables: object,
  pattern: string = "\{([^\{]+)\}"
) => template.replace(new RegExp(pattern, "g"), (_unused, varName) => variables[varName]);

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const task = async ({ processText, successText, delay = 50, fn }: TaskConfig) : Promise<any> => {
  const spinner = ora(processText).start();
  const result = await fn(spinner);
  await sleep(delay);
  spinner.succeed(successText);
  return result;
}

export const createSpinner = ora;

export const prompt = inquirer.createPromptModule();

export const pen = chalk;

export const randomName = faker.name.findName;

const isUnicodeSupported = () => {
	if (process.platform !== 'win32') {
		return process.env.TERM !== 'linux'; // Linux console (kernel)
	}

	return Boolean(process.env.CI) ||
		Boolean(process.env.WT_SESSION) || // Windows Terminal
		process.env.ConEmuTask === '{cmd::Cmder}' || // ConEmu and cmder
		process.env.TERM_PROGRAM === 'vscode' ||
		process.env.TERM === 'xterm-256color' ||
		process.env.TERM === 'alacritty';
}

const symbolsMain = {
	info: chalk.blue('ℹ'),
	success: chalk.green('✔'),
	warning: chalk.yellow('⚠'),
	error: chalk.red('✖')
};

const symbolsFallback = {
	info: chalk.blue('i'),
	success: chalk.green('√'),
	warning: chalk.yellow('‼'),
	error: chalk.red('×')
};

export const symbols = isUnicodeSupported() ? symbolsMain : symbolsFallback;

export const consoleError = (msg: string) => {
	console.log(pen.redBright(msg));
}

export const consoleWarn = (msg: string) => {
	console.log(pen.yellowBright(msg));
}

export const consoleInfo = (msg: string) => {
	console.log(pen.green(msg));
}