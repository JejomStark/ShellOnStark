
import {
    readSwapFile,
    writeSwapInfo,
    deleteSwapInfo,
    shouldExecuteTask
} from './lib/utils.js';

import config from "./config.js"
import {
    getSupportedTokens,
    getWalletPortfolio
} from './lib/wallet.js';

import {
    getInfoSwapQuote,
    performSwap
} from './lib/avnu.js'
import chalk from 'chalk';

/**
 * Main function to process scheduled orders.
 * It reads orders from a file, checks if conditions for each order are met,
 * and performs the swap if conditions are satisfactory.
 * After successful execution, logs the swap info and updates the order files.
 */
async function main() {
    try {

        // Double check execution time to ensure it's the right time to execute tasks
        if (shouldExecuteTask('order-manager')) {
            // Reading scheduled orders from file
            const orders = await readSwapFile(config.files.scheduled_limit_order);
            console.log(`${orders.length} order(s) found.`)
            if (orders.length !== 0) {
                // Fetch supported tokens and local wallet information
                const tokens = await getSupportedTokens();
                const localWallet = await getWalletPortfolio();
                const ordersCopy = [...orders];

                for (const order of ordersCopy) {
                    // Prepare swap information for one token
                    const swapInfo = {
                        from: order.assetToTrade,
                        amount: "1",
                        to: order.counterAsset
                    }
                    // Get swap quotes based on the swap information                    
                    const { quotes } = await getInfoSwapQuote(swapInfo, tokens, localWallet);
                    
                    // Decide if a swap should be performed based on the order and market quotes
                    if (shouldExecuteSwap(order, quotes)) {

                        // Perform the swap and store the result
                        const swapResult = await performSwap(order, tokens);

                        // Log the executed swap information with execution time
                        await writeSwapInfo(config.files.executed_limit_order, {
                            ...swapResult,
                            executionTime: new Date().toISOString()
                        });

                        // Update the scheduled order file by removing the executed order
                        await deleteSwapInfo(
                            config.files.scheduled_limit_order,
                            orders,
                            order
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

/**
 * Determines whether a swap should be executed based on the order criteria and market information.
 * 
 * @param {Object} order - The order containing the criteria for the swap.
 * @param {Object} quotes - The market information returned by getInfoSwapQuote.
 * @returns {boolean} - Returns true if the conditions to execute the swap are met, otherwise false.
 */
function shouldExecuteSwap(order, quotes) {
    let currentPrice;
    const assetToTrade = order.assetToTrade;
    const counterAsset = order.counterAsset;

    // Choose the correct price value based on the order type
    if (order.type === "buy_limit" || order.type === "buy_stop") {
        currentPrice = quotes[0].buyAmountInUsd; // Price for buy orders
    } else {
        currentPrice = quotes[0].sellAmountInUsd; // Price for sell orders
    }

    const currentPriceInString = `(Current price: ${currentPrice})`;

    // Determine 'from' and 'to' based on the order type    
    if (order.type === "buy_limit" || order.type === "buy_stop") {
        // For buy orders, the counterAsset is the 'from' asset
        order.from = counterAsset;
        order.to = assetToTrade;
    } else {
        // For sell orders, the assetToTrade is the 'from' asset
        order.from = assetToTrade;
        order.to = counterAsset;
    }
    
    // Check thresholds for buy limit orders
    if (order.type === "buy_limit" && order.price != null) {
        // Execute if the current selling price is equal to or less than the specified buy limit price
        if (currentPrice <= order.price) {
            console.log(chalk.yellow(`Executing a buy limit order: buying ${assetToTrade} at or below ${order.price} ${currentPriceInString}`));
            return true;
        } else {
            console.log(chalk.redBright(`Buy limit order not executed: ${assetToTrade} price is above the limit of ${order.price} ${currentPriceInString}`));
        }
    }

    // Check thresholds for sell limit orders
    if (order.type === "sell_limit" && order.price != null) {
        // Execute if the current selling price is equal to or greater than the specified sell limit price
        if (currentPrice >= order.price) {
            console.log(chalk.yellow(`Executing a sell limit order: selling ${assetToTrade} at or above ${order.price}  ${currentPriceInString}`));
            return true;
        } else {
            console.log(chalk.redBright(`Sell limit order not executed: ${assetToTrade} price is below the limit of ${order.price} ${currentPriceInString}`));
        }
    }

    // Check thresholds for buy stop orders
    if (order.type === "buy_stop" && order.price != null) {
        // Execute if the current selling price reaches or surpasses the specified buy stop price
        if (currentPrice >= order.price) {
            console.log(chalk.yellow(`Executing a buy stop order: buying ${assetToTrade} when the price reaches ${order.price}  ${currentPriceInString}`));
            return true;
        } else {
            console.log(chalk.redBright(`Buy stop order not executed: ${assetToTrade} price has not reached the stop price of ${order.price} ${currentPriceInString}`));
        }
    }

    // Check thresholds for sell stop orders
    if (order.type === "sell_stop" && order.price != null) {
        // Execute if the current selling price falls to or below the specified sell stop price
        if (currentPrice <= order.price) {
            console.log(chalk.yellow(`Executing a sell stop order: selling ${assetToTrade} when the price falls to ${order.price} ${currentPriceInString}`));
            return true;
        } else {
            console.log(chalk.redBright(`Sell stop order not executed: ${assetToTrade} price has not fallen to the stop price of ${order.price} ${currentPriceInString}`));
        }
    }

    // Return false if none of the above conditions are met
    return false;
}

main();