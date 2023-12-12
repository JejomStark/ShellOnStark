import inquirer from 'inquirer';
import chalk from 'chalk'
import { fetchQuotes, executeSwap, fetchTokens, BASE_URL, STAGING_BASE_URL } from '@avnu/avnu-sdk';
import { Account, RpcProvider, constants } from "starknet";
import { parseUnits } from 'ethers';
import { formatStarkscanUrl } from './starkscan.js';
import { createCryptoArray } from './utils.js';
import * as dotenv from "dotenv";
dotenv.config();

// @TODO to check when sepolia migration will be put online
const AVNU_OPTIONS = { baseUrl: (process.env.SWAP_ENV === 'mainnet')? BASE_URL: STAGING_BASE_URL };
const DEFAULT_RPC = (process.env.SWAP_ENV === 'mainnet')? 'RPC_MAINNET_NODES': 'RPC_GOERLI_NODES'
    
/**
 * function to retrieve the list of supported tokens
 * @returns 
 */
async function getAvnuSupportedTokens() {
    try {
        const tokens = await fetchTokens({}, AVNU_OPTIONS)  
        return createCryptoArray(tokens.content)
    } catch(e) {
        console.log('Erreur detected on getAvnuSupportedTokens', e.message)
    }
    
}

/** 
 *  This function prompts the user to initiate a swap operation.
 */
async function promptSwap() {
    // Fetch tokens
    const tokens = await getAvnuSupportedTokens();
    
    while (true) {
        console.log(chalk.blue("## Avenu Swapper ##"));

        const questions = [
            {
                type: 'list',
                name: 'from',
                message: 'From Token',
                choices: Object.keys(tokens),
            },
            {
                type: 'list',
                name: 'to',
                message: 'To Token',
                choices: Object.keys(tokens),
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
            await performSwap(answers, tokens)                        
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
            break;
        }
    }
}

/**
 * Executes a swap operation based on the user's input.
 * @param {object} swapInfo from, to & amount
 */
async function performSwap(swapInfo, tokens) {
    // initialize provider    
    const provider = new RpcProvider({ 
        nodeUrl: ((process.env.STARKNET_RPC)
            ? process.env.STARKNET_RPC 
            : constants[DEFAULT_RPC][0]
        )
    });
    
    // initialize existing account
    const privateKey = process.env.PRIVATE_KEY;
    const accountAddress = process.env.PUBLIC_KEY;
    const account = new Account(provider, accountAddress, privateKey, "1");

    const params = {
        sellTokenAddress: tokens[swapInfo['from']]['contract'],
        buyTokenAddress: tokens[swapInfo['to']]['contract'],
        sellAmount: parseUnits(swapInfo['amount'], tokens[swapInfo['from']]['decimal']),
        takerAddress: account.address
    };
    // Swap Quotes
    const quotes = await fetchQuotes(params, AVNU_OPTIONS);

    // Swap Execution
    try {
        const res = await executeSwap(account, quotes[0], {}, AVNU_OPTIONS);
        console.log(chalk.blue("Swap in progress on provider :", provider.nodeUrl))
        await provider.waitForTransaction(res.transactionHash)
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
    promptSwap, 
    DEFAULT_RPC,
    getAvnuSupportedTokens
}