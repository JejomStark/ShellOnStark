import inquirer from 'inquirer';
import chalk from 'chalk'
import { fetchQuotes, executeSwap } from '@avnu/avnu-sdk';
import { Account, RpcProvider } from "starknet";
import { parseUnits } from 'ethers';
import { formatStarkscanUrl } from './starkscan.js';
import * as dotenv from "dotenv";
dotenv.config();

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
 *  This function prompts the user to initiate a swap operation.
 */
async function promptSwap() {
    while (true) {
        console.log(chalk.blue("## Avenu Swapper ##"));

        const questions = [
            {
                type: 'list',
                name: 'from',
                message: 'From Token',
                choices: ['ETH', 'USDC', 'WBTC'],
            },
            {
                type: 'list',
                name: 'to',
                message: 'To Token',
                choices: ['ETH', 'USDC', 'WBTC'],
            },
            {
                type: 'input',
                name: 'amount',
                message: 'Swap amount',
                validate: value => {
                    if (isNaN(value) || Number(value) <= 0) {
                        return 'Please enter a valid amount.';
                    }
                    return true;
                }
            }
        ];

        const answers = await inquirer.prompt(questions);
        
        const confirmation = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmSwap',
                message: 'Are you sure you want to proceed with this swap?'
            }
        ]);

        if (confirmation.confirmSwap) {
            console.log(chalk.blue('Performing swap...'));
            await performSwap(answers)                        
        } else {
            console.log(chalk.red('Swap cancelled.\n'));
        }

        const continuePrompt = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continue',
                message: 'Do you want to perform another swap?'
            }
        ]);

        if (!continuePrompt.continue) {
            console.log(chalk.blue('Goodbye!'));
            break;
        }
    }
}

/**
 * Executes a swap operation based on the user's input.
 * @param {object} swapInfo from, to & amount
 */
async function performSwap(swapInfo) {
    // initialize provider
    const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC });
    // initialize existing account
    const privateKey = process.env.PRIVATE_KEY;
    const accountAddress = process.env.PUBLIC_KEY;
    const account = new Account(provider, accountAddress, privateKey);

    const params = {
        sellTokenAddress: TOKENS[swapInfo['from']]['contract'],
        buyTokenAddress: TOKENS[swapInfo['to']]['contract'],
        sellAmount: parseUnits(swapInfo['amount'], TOKENS[swapInfo['from']]['decimal']),
        takerAddress: account.address
    };
    // AVNU options
    const AVNU_OPTIONS = { baseUrl: process.env.AVNU_API };

    // Swap Quotes
    const quotes = await fetchQuotes(params, AVNU_OPTIONS);

    // Swap Execution
    try {
        const res = await executeSwap(account, quotes[0], {}, AVNU_OPTIONS);
        console.log(chalk.blue('####################################################################'));
        console.log(chalk.gray('Success, check your transaction here: ' + formatStarkscanUrl(res.transactionHash)))
        console.log(chalk.blue('####################################################################'));
    } catch (e) {
        console.log(chalk.red('####################################################################'));
        console.log(chalk.red('Error during the swap: ' + e.message))
        console.log(chalk.red('####################################################################'));
    }
}

export {
    promptSwap
}