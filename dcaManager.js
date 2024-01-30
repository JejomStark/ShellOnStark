import {
    readSwapFile,
    overwriteOrderInfo,
} from './lib/utils.js'
import {
    getSupportedTokens,
} from './lib/wallet.js';

import {
    performSwap
} from './lib/avnu.js'
import config from "./config.js"
import moment from 'moment';

/**
 * Main function to execute Daily, Weekly, and Monthly DCA orders.
 */
async function main() {
    const orders = await readSwapFile(config.files.dca_order);
    if (orders.length !== 0) {
        // Get the current date in the format YYYY-MM-DD
        const currentDate = moment().format('YYYY-MM-DD');

        for (const order of orders) {
            if (!order.executed) {
                order.executed = [];
            }
            // Check if the order has already been executed today
            // const isAlreadyExecuted = order.executed.includes(currentDate);
            const isAlreadyExecuted = order.executed.some(entry => entry.date === currentDate);

            if (!isAlreadyExecuted) {
                // Get the supported tokens
                const tokens = await getSupportedTokens();
                // Create a swap object
                const swap = {
                    from: order.counterAsset,
                    to: order.assetToBuy,
                    amount: order.amountInCounterAsset
                }

                if (order.type === 'dca' && order.periodicity === 'daily') {
                    console.log(`Executing daily DCA order for ${order.assetToBuy}-${order.counterAsset}`);
                    const result = await performSwap(swap, tokens)
                    // Update order with execution date
                    order.executed.push({
                        date: currentDate,
                        tokensBought: result.toAmount// Store the number of tokens bought
                    });
                } else if (order.type === 'dca' && order.periodicity === 'weekly') {
                    const isWeeklyExecutionDay = moment().isoWeekday() === config.dca.weekly; 
                    if (isWeeklyExecutionDay) {
                        console.log(`Executing weekly DCA order for ${order.assetToBuy}-${order.counterAsset}`);
                        const result = await performSwap(swap, tokens)
                        // Update order with execution date
                        order.executed.push({
                            date: currentDate,
                            tokensBought: result.toAmount// Store the number of tokens bought
                        });
                    }
                } else if (order.type === 'dca' && order.periodicity === 'monthly') {
                    const isFirstDayOfMonth = moment().date() === config.dca.montly;
                    if (isFirstDayOfMonth) {
                        console.log(`Executing monthly DCA order for ${order.assetToBuy}-${order.counterAsset}`);
                        const result = await performSwap(swap, tokens)
                        // Update order with execution date
                        order.executed.push({
                            date: currentDate,
                            tokensBought: result.toAmount// Store the number of tokens bought
                        });
                    }
                }
            }
        }
        // Log the executed swap information
        await overwriteOrderInfo(config.files.dca_order, orders);
    }
}

main();
