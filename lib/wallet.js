import { CallData } from "starknet";
import { getAvnuSupportedTokens } from "./avnu.js";
import Table from 'cli-table3';
import chalk from "chalk";
import config from "./../config.js";
import { promises as fs, existsSync } from 'fs';

import {
    formatAmountInWallet,
    executeMultiReadCall
} from "./utils.js";
import inquirer from 'inquirer';


/**
 * Retrieves the wallet portfolio, including token balances.
 * @returns {<Array>} - An array of token balance results.
 */
async function getWalletPortfolio() {
    const tokens = await getSupportedTokens()
    const callResult = await fetchTokenBalances()
    return await formatResult(callResult, tokens)
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
        const callResult = await fetchTokenBalances()
        const walletTokens = await formatResult(callResult, tokens)

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
 * Fetches the balances of supported tokens in the wallet 
 * @returns {Promise<Array>} - An array of token balance results.
 */
async function fetchTokenBalances() {
    const tokens = await getSupportedTokens();
    const multiCallActions = Object.entries(tokens).map(([tokenName, tokenInfo]) => ({
        token: tokenName.toUpperCase(),
        contractAddress: tokenInfo.contract,
        entrypoint: "balanceOf",
        calldata: CallData.compile([process.env.PUBLIC_KEY])
    }));

    return await executeMultiReadCall(multiCallActions);
}

/**
 * Process the results of the wallet balance.
 * @param {Object} result - The result object from multi-read call.
 * @param {Object} tokens - The supported tokens object.
 * @returns {Object} - An object containing token and value.
 */
async function formatResult(callResult, tokens) {
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
    .filter(result => typeof result === 'object')
    .sort((a, b)=> b.value - a.value);//desc
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
        head: [colorize('Token'), colorize('Valeur')]
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
        if (existsSync(config.files.tokens_list)) {
            const data = await fs.readFile(config.files.tokens_list, 'utf8');
            return JSON.parse(data);
        } else {
            return {};
        }
    } catch (error) {
        console.error("Error in readPersonalTokens function:", error);
        return {};
    }
}

export {
    displayWalletPortfolio,
    getWalletPortfolio,
    getSupportedTokens
}
