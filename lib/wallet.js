import { CallData } from "starknet";
import { getSupportedTokens } from "./avnu.js";
import Table from 'cli-table3';
import chalk from "chalk";
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
    const multiCallActions = Object.entries(tokens)
        .map(([tokenName, tokenInfo]) => {
            return {
                token: tokenName.toUpperCase(),
                contractAddress: tokenInfo.contract,
                entrypoint: "balanceOf",
                calldata: CallData.compile([process.env.PUBLIC_KEY])
            }
        });


    const callResult = await executeMultiReadCall(multiCallActions);
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

        const tokens = await getSupportedTokens()

        const multiCallActions = Object.entries(tokens)
            .map(([tokenName, tokenInfo]) => {
                return {
                    token: tokenName.toUpperCase(),
                    contractAddress: tokenInfo.contract,
                    entrypoint: "balanceOf",
                    calldata: CallData.compile([process.env.PUBLIC_KEY])
                }
            });


        const callResult = await executeMultiReadCall(multiCallActions);

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

export {
    displayWalletPortfolio, 
    getWalletPortfolio
}
