import { CallData } from "starknet";
import { getAvnuSupportedTokens } from "./avnu.js";
import Table from 'cli-table3';
import chalk from "chalk";
import config from "./../config.js"
import { promises as fs } from 'fs';

import {
    formatAmountInWallet,
    executeMultiReadCall
} from "./utils.js";
import inquirer from 'inquirer';



/**
 * Function to get the wallet content
 * Note: This feature only supports supported AVNU tokens
 */
async function getWalletPortfolio() {
    const tokens = await getSupportedTokens()

    const multiCallActions = Object.entries(tokens)
        .map(([tokenName, tokenInfo]) => {
            return {
                token: tokenName,
                contractAddress: tokenInfo.contract,
                entrypoint: "balanceOf",
                calldata: CallData.compile([process.env.PUBLIC_KEY])
            }
        });


    const callResult = await executeMultiReadCall(multiCallActions);

    return callResult.map(result => {
        if (result.status === 'fulfilled') {
            // only token with >0 value   
            if (result.value.result && result.value.result[0] !== '0x0') {
                return {
                    "token": result.value.token,
                    "value": formatAmountInWallet(result.value.result[0], tokens[result.value.token].decimal)
                }
            } else {
                return {
                    "token": result.value.token,
                    "value": 0
                }
            }
        }
    })
        .filter(result => typeof result === 'object');
}


/**
 * Function to display a minimalist wallet content
 * Note: This feature only supports supported AVNU tokens
 */
async function displayWalletPortfolio() {
    while (true) {
        console.log(chalk.blue("\n################################################################"))
        console.log(chalk.blue("######################"), chalk.white("Your Wallet"), chalk.blue("#############################"))
        console.log(chalk.blue("################################################################\n"))
        console.log(chalk.grey("Note: Only AVNU supported tokens + personal list will be displayed."))
        const tokens = await getSupportedTokens()

        const multiCallActions = Object.entries(tokens)
            .map(([tokenName, tokenInfo]) => {
                return {
                    token: tokenName,
                    contractAddress: tokenInfo.contract,
                    entrypoint: "balanceOf",
                    calldata: CallData.compile([process.env.PUBLIC_KEY])
                }
            });


        const callResult = await executeMultiReadCall(multiCallActions);

        const walletTokens = callResult.map(result => {
            if (result.status === 'fulfilled') {
                // only token with >0 value   
                if (result.value.result && result.value.result[0] !== '0x0') {
                    return {
                        "token": result.value.token,
                        "value": formatAmountInWallet(result.value.result[0], tokens[result.value.token].decimal)
                    }
                } 
            }
        })
            .filter(result => typeof result === 'object');

        const table = new Table({
            ...renderHeaderAndBorder('blue'),
            colWidths: [30, 30]
        });

        // Add tokens in table
        walletTokens.forEach(token => {
            table.push([token.token, token.value]);
        });
        // Wallet displayed
        console.log(table.toString())

        const continuePrompt = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continue',
                message: 'Do you want to exit?'
            }
        ]);

        if (continuePrompt.continue) {
            break;
        }
    }

}

/**
 * Function to nicely display the table
 * @param {*} color 
 * @returns 
 */
function renderHeaderAndBorder(color) {
    const colorize = text => chalk[color] ? chalk[color](text) : text;
    return {
        chars: {
            'top': colorize('='),
            'top-mid': colorize('╤'),
            'top-left': colorize('╔'),
            'top-right': colorize('╗'),
            'bottom': colorize('═'),
            'bottom-mid': colorize('╧'),
            'bottom-left': colorize('╚'),
            'bottom-right': colorize('╝'),
            'left': colorize('║'),
            'left-mid': colorize('╟'),
            'mid': colorize('─'),
            'mid-mid': colorize('┼'),
            'right': colorize('║'),
            'right-mid': colorize('╢'),
            'middle': colorize('│')
        },
        head: [colorize('Token'), colorize('Values')]
    }
}

/**
 * function to retrieve all supported tokens from Avnu + personnal list 
 * @returns 
 */
async function getSupportedTokens() {
    // Retrieve the AVNU supported tokens 
    const supportedTokens = await getAvnuSupportedTokens();

    // Read personal tokens from the JSON file
    const personalTokens = await readPersonalTokens();

    return { ...supportedTokens, ...personalTokens };
}


/**
 * Function to read the JSON file
 * @returns 
 */
async function readPersonalTokens() {
    try {
        const data = await fs.readFile(config.files.tokens_list, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading the personal_tokens.json file:", error);
        return {};
    }
}


export {
    displayWalletPortfolio,
    getWalletPortfolio
}
