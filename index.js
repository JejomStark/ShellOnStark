import inquirer from 'inquirer';
import chalk from 'chalk'
import { promptSwap } from './lib/avnu.js';
import * as dotenv from "dotenv";
dotenv.config();

const logo = chalk.grey(`
    $$$$$$$$$$$$$$$ffffrvXUJCCJUXvrffff$$$$$$$$$$$$$$$
    $$$$$$$$$$$fff${chalk.blue("uC(whW888888888888WhwCu")}fff$$$$$$$$$$
    $$$$$$$$fff${chalk.blue("Xw#8888888888888888888888#w")}Xfff$$$$$$$$
    $$$$$$ff${chalk.blue("xO#8888888888888888888888888888#O")}xff$$$$$$
    $$$$$fr${chalk.blue("Z&88888888888888888888888888888888&Z")}rf$$$$$
    $$$ff${chalk.blue("X#888888#888888888888888WpLXvvXQb&8888#X")}ff$$$
    $$ff${chalk.blue("O8888888W")}${chalk.white("#")}${chalk.blue("Y88888888888pr~")}${chalk.white("@@@@@@@@@@")}${chalk.blue("]YM888Of")}f$$
    $ff${chalk.blue("Z88888&X(")}${chalk.white("###")}}${chalk.blue("rb888888J<")}${chalk.white("@@@@@@@@@@@@@@@")}${chalk.blue("v,u&88Z")}f$
    $f${chalk.blue("J88888888aX")}${chalk.white("#")}${chalk.blue("dpW88888w<")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("},Il!l")}${chalk.blue("I:?M88J")}$
    fr${chalk.blue("W8888888888uo88888Wt")}${chalk.white("@@@@@@@@@@@@/")}${chalk.red("/fffff")}${chalk.blue("vm*888Wr")}f
    f${chalk.blue("L88888888888888888w!")}${chalk.white("@@@@@@@@@@@/")}${chalk.red("ffffff")}${chalk.blue("vb8888888L")}f
    f${chalk.blue("p888888888888888#/")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("(fffffj")}${chalk.blue("Z&88888888p")}f
    f${chalk.blue("h8888888888888#u:")}${chalk.white("@@@@@@@@@@@")}${chalk.red("l/fffffv")}${chalk.blue("o8888888888h")}f
    f${chalk.blue("p88hqo&88&amc]^")}${chalk.white("@@@@@@@@@@@@")}${chalk.red("-ffffffQ")}${chalk.blue("&88888888888p")}f
    f${chalk.blue("L88#<")}${chalk.white("@@@@@@@@@@@@@@@@@@@@!")}${chalk.red("|fffffx")}${chalk.blue("b8888888888888L")}f
    f${chalk.blue("rW88M(")}${chalk.white("@@@@@@@@@@@@@@@@@i")})${chalk.red("ffffffL")}${chalk.blue("W8888888888888Wr")}f
    $f${chalk.blue("J8888m]:")}${chalk.white("@@@@@@@@@@@l")}${chalk.red("?/fffffjJ")}${chalk.blue("*888Mq0Za8888888J")}f$
    $f${chalk.blue("fZ8888&qu}")}${chalk.red("_~>><+])fffffffvZ")}${chalk.blue("M8888Mxf")}${chalk.white("@")}${chalk.blue("ffq88888Zf")}f$
    $$ff${chalk.blue("O888888#q")}${chalk.red("CvjffffffrcCq#")}${chalk.blue("8888888&cfffrk8888Of")}f$$
    $$$ff${chalk.blue("X#888888888W")}${chalk.red("*oo#W")}${chalk.blue("88888888888888odk&888#Xf")}f$$$
    $$$$$f${chalk.blue("rZ&88888888888888888888888888888888&Zr")}f$$$$$
    $$$$$$ff${chalk.blue("xO#8888888888888888888888888888#Ox")}ff$$$$$$
    $$$$$$$$ff${chalk.blue("fXw#8888888888888888888888#wX")}fff$$$$$$$$
    $$$$$$$$$$$fff${chalk.blue("uCwhW888888888888WhwCu")}fff$$$$$$$$$$$
    $$$$$$$$$$$$$$$ffffrvXUJCCJUXvrffff$$$$$$$$$$$$$$$
    $$$$$$$$$$$$$$$                    $$$$$$$$$$$$$$$
    $$$$$$$$$$$$$$$    ${chalk.white('ShellOnStark')}    $$$$$$$$$$$$$$$
    $$$$$$$$$$$$$$$                    $$$$$$$$$$$$$$$
    $$$$$$$$$$$$$$$ffffrvXUJCCJUXvrffff$$$$$$$$$$$$$$$
`);

const TOKENS = {
    USDC: {
        contract: "0x5a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426",
        decimal: 6
    },
    WBTC: {
        contract: "0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56",
        decimal: 8
    },
    ETH: {
        contract: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        decimal: 18
    }
}
/**
 * Function to display the Bot prompt
 * @returns 
 */
async function promptBot() {
    while (true) {
        console.log(chalk.blue(logo));

        const mainMenuQuestion = [
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: ['Perform a swap on Avnu', 'Other options WIP', 'Exit'],
            },
        ];

        const mainMenuAnswer = await inquirer.prompt(mainMenuQuestion);

        switch (mainMenuAnswer.action) {
            case 'Perform a swap on Avnu':
                await promptSwap(); 
                break;
            case 'Other options WIP':
                console.log('## Work in progress ##')
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

promptBot()


