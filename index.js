import inquirer from 'inquirer';
import chalk from 'chalk'
import { avnuMenu } from './lib/avnu.js';
import { displayWalletPortfolio } from './lib/wallet.js';
import * as dotenv from "dotenv";
import { existsSync, promises as fs } from 'fs';
dotenv.config();

const space = '                     '
const logo = chalk.grey(`
${space}$$$$$$$$$$$$$$$ffffrvXUJCCJUXvrffff$$$$$$$$$$$$$$$
${space}$$$$$$$$$$$fff${chalk.blue("uC(whW888888888888WhwCu")}fff$$$$$$$$$$
${space}$$$$$$$$fff${chalk.blue("Xw#8888888888888888888888#w")}Xfff$$$$$$$$
${space}$$$$$$ff${chalk.blue("xO#8888888888888888888888888888#O")}xff$$$$$$
${space}$$$$$fr${chalk.blue("Z&88888888888888888888888888888888&Z")}rf$$$$$
${space}$$$ff${chalk.blue("X#888888#888888888888888WpLXvvXQb&8888#X")}ff$$$
${space}$$ff${chalk.blue("O8888888W")}${chalk.white("#")}${chalk.blue("Y88888888888pr~")}${chalk.white("@@@@@@@@@@")}${chalk.blue("]YM888Of")}f$$
${space}$ff${chalk.blue("Z88888&X(")}${chalk.white("###")}}${chalk.blue("rb888888J<")}${chalk.white("@@@@@@@@@@@@@@@")}${chalk.blue("v,u&88Z")}f$
${space}$f${chalk.blue("J88888888aX")}${chalk.white("#")}${chalk.blue("dpW88888w<")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("},Il!l")}${chalk.blue("I:?M88J")}$
${space}fr${chalk.blue("W8888888888uo88888Wt")}${chalk.white("@@@@@@@@@@@@/")}${chalk.red("/fffff")}${chalk.blue("vm*888Wr")}f
${space}f${chalk.blue("L88888888888888888w!")}${chalk.white("@@@@@@@@@@@/")}${chalk.red("ffffff")}${chalk.blue("vb8888888L")}f
${space}f${chalk.blue("p888888888888888#/")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("(fffffj")}${chalk.blue("Z&88888888p")}f
${space}f${chalk.blue("h8888888888888#u:")}${chalk.white("@@@@@@@@@@@")}${chalk.red("l/fffffv")}${chalk.blue("o8888888888h")}f
${space}f${chalk.blue("p88hqo&88&amc]^")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("-ffffffQ")}${chalk.blue("&88888888888p")}f
${space}f${chalk.blue("L88#<")}${chalk.white("@@@@@@@@@@@@@@@@@@@@!")}${chalk.red("|fffffx")}${chalk.blue("b8888888888888L")}f
${space}f${chalk.blue("rW88M(")}${chalk.white("@@@@@@@@@@@@@@@@@i")})${chalk.red("ffffffL")}${chalk.blue("W8888888888888Wr")}f
${space}$f${chalk.blue("J8888m]:")}${chalk.white("@@@@@@@@@@@l")}${chalk.red("?/fffffjJ")}${chalk.blue("*888Mq0Za8888888J")}f$
${space}$f${chalk.blue("fZ8888&qu}")}${chalk.red("_~>><+])fffffffvZ")}${chalk.blue("M8888Mxf")}${chalk.white("@")}${chalk.blue("ffq88888Zf")}f$
${space}$$ff${chalk.blue("O888888#q")}${chalk.red("CvjffffffrcCq#")}${chalk.blue("8888888&cfffrk8888Of")}f$$
${space}$$$ff${chalk.blue("X#888888888W")}${chalk.red("*oo#W")}${chalk.blue("88888888888888odk&888#Xf")}f$$$
${space}$$$$$f${chalk.blue("rZ&88888888888888888888888888888888&Zr")}f$$$$$
${space}$$$$$$ff${chalk.blue("xO#8888888888888888888888888888#Ox")}ff$$$$$$
${space}$$$$$$$$ff${chalk.blue("fXw#8888888888888888888888#wX")}fff$$$$$$$$
${space}$$$$$$$$$$$fff${chalk.blue("uCwhW888888888888WhwCu")}fff$$$$$$$$$$$
${space}$$$$$$$$$$$$$$$ffffrvXUJCCJUXvrffff$$$$$$$$$$$$$$$
   
`);

const shellLogo = `
███████╗██╗  ██╗███████╗██╗    ██╗    ██████╗ ███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗  ██╗
██╔════╝██║  ██║██╔════╝██║    ██║    ██║ ██║ ██╔██╗ ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝
███████╗███████║█████╗  ██║    ██║    ██║ ██║ ██║╚██╗██║███████╗   ██║   ███████║██████╔╝█████╔╝ 
╚════██║██╔══██║██╔══╝  ██║    ██║    ██║ ██║ ██║ ╚████║╚════██║   ██║   ██╔══██║██╔══██╗██╔═██╗ 
███████║██║  ██║███████╗██████╗██████ ██████║ ██║  ╚███║███████║   ██║   ██║  ██║██║  ██║██║  ██╗
╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝╚════╝ ╚═════╝ ╚═╝   ╚══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`

/**
 * Function to display the Bot prompt
 * @returns 
 */
async function promptBot() {
    // check is .env file is present.
    const packageFile = await fs.readFile('./package.json', 'utf8')
    const packageJson = JSON.parse(packageFile)
    if (!existsSync('./.env')) {
        console.log(chalk.red("The .env file is missing. Please create it."))
    } else {
        while (true) {

            console.log(chalk.blue(shellLogo));
            console.log(chalk.blue(logo));
            console.log(`Welcome to ShellOnStark :`, chalk.blue(`v${packageJson.version}`))
            console.log(`Currently on : ${chalk.blue(process.env.SWAP_ENV)} \n`)
            const mainMenuQuestion = [
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        'Avnu',
                        'Portfolio visualization',
                        'Exit'
                    ],
                },
            ];

            const mainMenuAnswer = await inquirer.prompt(mainMenuQuestion);

            switch (mainMenuAnswer.action) {
                case 'Avnu':
                    await avnuMenu();
                    break;
                case 'Portfolio visualization':
                    await displayWalletPortfolio();
                    break;
                case 'Exit':
                    console.log(chalk.blue('Goodbye!'));
                    return;
                default:
                    break;
            }

            const continuePrompt = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'continue',
                    message: 'Do you want to perform another action?'
                }
            ]);

            if (!continuePrompt.continue) {
                console.log(chalk.blue('Goodbye!'));
                break;
            }
        }
    }
}

promptBot()


