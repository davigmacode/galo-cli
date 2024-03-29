import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import Table from "cli-table";

export const createSpinner = ora;

export const createTable = Table;

export const prompt = inquirer.createPromptModule();

export const pen = chalk;

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const task = async ({ processText, successText, delay = 50, fn }: TaskConfig) : Promise<any> => {
  const spinner = ora(processText).start();
	let result: any;
	try {
		await sleep(delay);
		result = await fn(spinner);
		spinner.succeed(successText);
		return result;
	} catch (err) {
		spinner.fail(err.message);
	}
}

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

export const print = {
	error: (...msg: string[]) => console.log(symbols.error, chalk.red(...msg)),
	warn: (...msg: string[]) => console.log(symbols.warning, chalk.yellow(...msg)),
	success: (...msg: string[]) => console.log(symbols.success, chalk.green(...msg)),
	info: (...msg: string[]) => console.log(symbols.info, chalk.blue(...msg)),
	log: (...msg: string[]) => console.log(...msg),
}