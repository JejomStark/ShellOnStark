import {
    readSwapFile,
    writeSwapInfo,
    deleteSwapInfo,
    shouldExecuteTask

} from './lib/utils.js'
import {
    getSupportedTokens,
    getWalletPortfolio
} from './lib/wallet.js';

import {
    getInfoSwapQuote,
    performSwap
} from './lib/avnu.js'
import config from "./config.js"
import chalk from 'chalk'

/**
 * The main function to handle scheduled swaps. 
 * It reads the swaps from a file, checks the gas fees for each swap,
 * and performs the swap if the gas fee is within acceptable limits. 
 * After a successful swap, it logs the swap info and updates the swap files.
 */
async function main() {
    try {
        // Double check execution time to ensure it's the right time to execute tasks
        if (shouldExecuteTask()) {
            // Reading scheduled swaps from file
            const swaps = await readSwapFile(config.files.scheduled_swap);
            if (swaps.length !== 0) {
                const swapsCopy = [...swaps];
                const tokens = await getSupportedTokens();
                const localWallet = await getWalletPortfolio();
                console.log('Swaps found: ', swaps.length);

                for (const swap of swapsCopy) {
                    // Get swap information including gas fees
                    const { quotes } = await getInfoSwapQuote(swap, tokens, localWallet);

                    // Compare gas fees and decide whether to execute the swap
                    if (quotes[0].gasFeesInUsd <= config.swap.max_gas_fees_in_usd) {
                        // Perform the swap
                        const swapResult = await performSwap(swap, tokens);

                        // Log the executed swap information
                        await writeSwapInfo(config.files.executed_swap, {
                            ...swapResult,
                            executionTime: new Date().toISOString()
                        });

                        // Update the scheduled swap file by removing the executed swap
                        await deleteSwapInfo(
                            config.files.scheduled_swap,
                            swaps,
                            swap
                        );
                    } else {
                        // Log if the gas fee is too high for the swap
                        console.log('Gas too high', quotes[0].gasFeesInUsd, 'for swap:', chalk.blue(JSON.stringify(swap)));
                    }
                }
            } else {
                // Log if no swaps are found
                console.log('No Swap found');
            }
        } 
    } catch (error) {
        // Log any errors that occur during the main execution
        console.error('Error in main execution:', error);
    }
}


main();
