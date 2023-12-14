import inquirer from 'inquirer';
import chalk from 'chalk'
import { fetchQuotes, executeSwap, fetchTokens, BASE_URL, STAGING_BASE_URL } from '@avnu/avnu-sdk';
import { Account, RpcProvider, constants } from "starknet";
import { parseUnits } from 'ethers';
import { formatStarkscanUrl } from './starkscan.js';
import { getWalletPortfolio, getSupportedTokens } from './wallet.js';
import { formatAmountInWallet, createCryptoArray } from './utils.js';
import config from "./../config.js"
import * as dotenv from "dotenv";
dotenv.config();

// @TODO to check when sepolia migration will be put online
const AVNU_OPTIONS = { baseUrl: (process.env.SWAP_ENV === 'mainnet') ? BASE_URL : STAGING_BASE_URL };
const DEFAULT_RPC = (process.env.SWAP_ENV === 'mainnet') ? 'RPC_MAINNET_NODES' : 'RPC_GOERLI_NODES'

// Global object to cache tokens
let cachedTokens = null;

// AVNU Logo
const logo = chalk.black(`
................................................................................
........${bl("$$X")}........${bl("b$]")}............${bl("'o@>")}..${bl("|$@|")}...........${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
.......${bl("^#B#$+")}......${bl(">@#^")}...........${bl("c$u")}...${bl("|$@$z'")}.........${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
.......${bl("Y$j")}_${bl("$a'")}......${bl("v$X")}..........${bl("<@a'")}...${bl("|$jO$m^")}........${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
......${bl("_$b")}'.${bl("U$u")}......${bl("'o$+")}........${bl("'h$+")}....${bl("|$|.v$ol")}.......${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
.....${bl("'o@>")}..${bl("^#@>")}......${bl("_$a'")}.......${bl("r$X")}.....${bl("|$|")}..${bl(")B&?")}......${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
.....${bl("v$u")}....${bl("]$b")}'......${bl("Y$u")}......${bl("!B#^")}.....${bl("|$|")}...${bl("+W@/")}.....${bl("f$1")}....${bl("0$i")}............${bl("o@'")}
....${bl("<@a'")}.....${bl("L$j")}......${bl("^M@>")}....${bl("'q$]")}......${bl("|$|")}....${bl(";k$Y'")}...${bl("f$1")}....${bl("Q$i")}............${bl("o@'")}
...${bl("'k$+")}......,${bl("WBl")}......${bl("[$d'")}...${bl("/$L")}.......${bl("|$|")}.....${bl("'0$w'")}..${bl("f$1")}....${bl("J$-")}............${bl("&&.")}
...${bl("r$X")}........${bl("1$w")}.......${bl("Q$f")}..${bl(";8W")},.......${bl("|$|")}.......${bl("u$o!")}.${bl("f$1")}....${bl("t$u.")}..........${bl(">$q.")}
..${bl("!B#^")}.........${bl("Z$|")}......${bl(":&%I.Z$1")}........${bl("|$|")}........${bl("1B8?f$1")}....${bl(",%&:")}..........${bl("O$)")}.
.${bl("'p$?")}..........${bl(";88:")}......${bl(")$w1$Z")}.........${bl("|$|")}.........${bl("<M@d$1")}.....${bl("|$ai")}.......${bl("^C$m'")}.
.${bl("/$C")}............${bl("/$O")}.......${bl("m$B8;")}.........${bl("|$|")}..........${bl(":b$$1")}......${bl("/B@O|")}_${bl("'<~{X&$0'")}.
${bl("^wq")},.............${bl("Lb~")}......${bl("Ia*|")}..........${bl("1*1")}...........${bl("'C*[")}.......${bl(";co$$$$$&Q-")}....
................................................................................
`)

/**
 * Applies a color styling to the provided text using chalk.
 *
 * @param {string} text - The text to be styled.
 * @returns {string} The styled text with white color.
 */
function bl(text) {
    return chalk.white(text)
}

/**
 * Displays the main menu for the AVNU swapping application and handles user choices.
 * 
 * Features:
 *    - 'Make a swap': function to initiate a single swap.
 *    - 'Make a batch of swaps': function to initiate multiple swaps.
 */
async function avnuMenu() {
    console.log(logo)
    const answer = await inquirer.prompt([
        {
            type: 'list',
            name: 'priceChoice',
            message: 'AVNU Options:',
            choices: [
                'Make a swap',
                'Make a batch of swaps',
                'Back'
            ]
        },
    ]);

    switch (answer.priceChoice) {
        case 'Make a swap':
            await promptSwap();
            break;
        case 'Make a batch of swaps':
            await promptForSwaps()
            break;
        case 'Back':
            return;
        default:
            break;
    }

    await avnuMenu()
}


/**
 * Retrieves a list of supported tokens and caches it for future use.
 * 
 * @returns {Object} An object where each key is a token symbol in uppercase and each value 
 *                   is an object containing the token's details (contract address and decimals).
 * @throws {Error} If an error occurs during the fetch operation, logs the error message.
 */
async function getAvnuSupportedTokens() {
    try {
        if (cachedTokens) return cachedTokens;
        const tokens = await fetchTokens({}, AVNU_OPTIONS)
        cachedTokens = createCryptoArray(tokens.content)
        return cachedTokens
    } catch (e) {
        console.log('Error detected on getSupportedTokens', e.message)
    }

}

/**
 * Initiates a single token swap process based on user input.
 *  
 * Features:
 * - Displays the user's wallet portfolio.
 * - Allows users to input a swap
 * @throws {Error} If an error occurs during the swap process, it logs the error message.
 */
async function promptSwap() {

    // Fetch tokens
    const tokens = await getSupportedTokens();

    while (true) {
        try {
            let localWallet = await getWalletPortfolio();
            console.log(logo)
            console.log(chalk.blue("## Avenu Swapper ##"));
            console.log(chalk.blue('Portfolio reminder :\n'), localWallet)

            // Add `exit` to allow exit process
            const fromAnswer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'from',
                    message: 'From Token',
                    choices: [...Object.keys(tokens), 'exit']
                }
            ]);


            if (fromAnswer.from.toLowerCase() === 'exit') {
                return;
            }

            const questions = [
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

            const toAndAmountAnswers = await inquirer.prompt(questions);
            const answers = { ...fromAnswer, ...toAndAmountAnswers };
            // Fetch quotes
            await getInfoSwapQuote(answers, tokens, localWallet);


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
        } catch (e) {
            console.log(chalk.red('Something went wrong:', e.message))
        }
    }
}

/**
 * Handles the process for executing multiple swaps in a sequence. 
 * 
 * The function prompts the user to enter a swap sequence in a specific format (e.g., "eth:80%->usdc, usdc:90%->eth").
 * It allows the user to execute a series of token swaps based on their portfolio, supporting percentage-based swap amounts.
 * 
 * Features:
 * - Displays the user's current portfolio as a reminder.
 * - Allows users to input their desired swap sequence or type "exit" to leave the process.
 * @throws {Error} If an error occurs during the swap sequence validation or execution. 
 */
async function promptForSwaps() {
    // Fetch tokens
    const tokens = await getSupportedTokens();
    while (true) {
        try {
            let localWallet = await getWalletPortfolio();
            console.log(chalk.blue('Portfolio reminder :\n'), localWallet)
            console.log(chalk.grey('You can swap all these tokens: \n', Object.keys(tokens).join(', ')));

            const answers = await inquirer.prompt([
                {
                    name: 'swaps',
                    type: 'input',
                    message: 'Enter your swap sequence (e.g., eth:80%->usdc, usdc:90%->eth) - or type "exit" to leave:'
                }
            ]);

            if (answers.swaps.toLowerCase() === 'exit') {
                return;
            }

            const swapSequence = answers.swaps.split(', ').map(s => {
                const [fromTo, to] = s.split('->');
                const [from, fromPercentTxt] = fromTo.split(':');
                const fromPercent = parseFloat(fromPercentTxt) / 100

                const fromToken = from.toUpperCase()
                const toToken = to.toUpperCase()
                // check from and to in localWallet
                if (
                    !localWallet.find(walletItem => walletItem.token === fromToken) ||
                    !localWallet.find(walletItem => walletItem.token === toToken)
                ) {
                    throw new Error(`Unknown currency in swap sequence: ${from} or ${to}`);
                }

                // check fromPercent between 0 et 1 (équivalent à 0% à 100%)
                if (fromPercent < 0 || fromPercent > 1) {
                    throw new Error(`Invalid percentage for currency ${from}: ${fromPercentTxt}`);
                }
                return {
                    from: fromToken,
                    fromPercent,
                    to: toToken
                };
            });

            const swapSequenceFormated = []
            for (const swap of swapSequence) {

                const amountFrom = await getSwapAmountFromLocalWallet(swap, localWallet);
                localWallet = await updateWalletToken(localWallet, swap.from, amountFrom, true);

                // Prepare swapInfo for quote fetching
                const swapInfo = { from: swap.from, to: swap.to, amount: amountFrom };

                // Fetch quotes
                const quotes = await getInfoSwapQuote(swapInfo, tokens, localWallet);
                localWallet = await updateWalletToken(localWallet, swapInfo.to, quotes.toAmount, false);

                swapSequenceFormated.push(swapInfo)
            }
            // Prompt de confirmation
            const confirm = await inquirer.prompt([
                {
                    name: 'confirm',
                    type: 'confirm',
                    message: 'Do you want to execute these swaps?'
                }
            ]);

            if (confirm.confirm) {
                for (const swap of swapSequenceFormated) {
                    await performSwap(swap, tokens);
                }
            } else {
                console.log(chalk.red("Swap execution cancelled."));
            }

            const continuePrompt = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'continue',
                    message: 'Do you want to perform another serie of swap?'
                }
            ]);

            if (!continuePrompt.continue) {
                break;
            }
        } catch (e) {
            console.log(chalk.red('Something went wrong:', e.message))
        }
    }

}

/**
 * Updates the balance of a specified token in the local wallet.
 *
 * @param {Array} localWallet - Array of token objects in the user's local wallet.
 * @param {string} tokenSymbol - The symbol of the token to be updated (e.g., 'ETH').
 * @param {number|string} amount - The amount by which the token's balance should be updated.
 * @param {boolean} isFromToken - A boolean indicating if the token is the source ('from') in a swap. 
 *                                True if the token is being sent out (balance decreases), 
 *                                false if the token is being received (balance increases).
 * @returns {Array} The updated local wallet array with the modified token balances.
 */
async function updateWalletToken(localWallet, tokenSymbol, amount, isFromToken) {
    const token = localWallet.find(token => token.token === tokenSymbol.toUpperCase());
    const amountNumber = parseFloat(amount);

    if (token) {
        if (isFromToken) {
            // Decrease the balance for the 'from' token
            token.value = (parseFloat(token.value) - amountNumber).toFixed(6);
        } else {
            // Increase the balance for the 'to' token
            token.value = (parseFloat(token.value) + amountNumber).toFixed(6);
        }
    } else if (!isFromToken) {
        // Add the 'to' token to the wallet if it doesn't exist
        localWallet.push({ token: tokenSymbol.toUpperCase(), value: amountNumber.toFixed(6) });
    } else {
        // Error handling if the 'from' token does not exist in the wallet
        console.error(`Token ${tokenSymbol} not found in local wallet for a 'from' operation`);
    }

    return localWallet;
}

/**
 * Retrieves and displays swap quote information for a given swap operation.
 *
 * @param {Object} swapInfo - An object containing information about the swap.
 *                            This includes 'from' (source token), 'to' (destination token), 
 *                            and 'amount' (amount to swap).
 * @param {Object} tokens - An object containing token information, where each token symbol 
 *                          maps to an object with contract address and decimal places.
 * @param {Array} localWallet - Array of token objects in the user's local wallet.
 * @returns {Object} An object containing updated 'from' and 'to' token information, 
 *                   including the amounts for the swap operation.
 */
async function getInfoSwapQuote(swapInfo, tokens, localWallet) {
    const params = await _prepareParams(swapInfo, [process.env.PUBLIC_KEY], tokens, localWallet)
    // Swap Quotes
    const quotes = await fetchQuotes(params, AVNU_OPTIONS);
    console.log(chalk.blue(`\nInitializing a swap of :`))
    console.log(`\nFrom: ${swapInfo.amount} ${swapInfo.from.toUpperCase()}`)
    console.log(`To: ${formatAmountInWallet(quotes[0].buyAmount, tokens[swapInfo.to.toUpperCase()].decimal)} ${swapInfo.to.toUpperCase()}`)
    console.log(`Best quote on: ${quotes[0].routes[0].name}`)
    console.log(`Estimated Gas fees: $ ${quotes[0].gasFeesInUsd}`)
    console.log(`Estimated Avnu fees: $ ${quotes[0].avnuFeesInUsd}`)
    return {
        from: swapInfo.from.toUpperCase(),
        fromAmount: swapInfo.amount,
        to: swapInfo.to.toUpperCase(),
        toAmount: formatAmountInWallet(quotes[0].buyAmount, tokens[swapInfo.to.toUpperCase()].decimal)
    }
}

/**
 * Calculates the swap amount from the local wallet based on the provided swap information.
 *
 * @param {Object} swap - An object containing details about the swap. 
 *                        It includes 'from' (source token symbol), 'fromPercent' (percentage of the token to swap), 
 *                        and optionally 'amount' (fixed amount to swap if percentage is not used).
 * @param {Array} localWallet - An array of token objects in the user's local wallet. 
 *                              Each object contains 'token' (token symbol) and 'value' (token balance).
 * @returns {string} The calculated amount of the token to swap.
 * @throws {Error} If the source token is not found in the local wallet.
 */
async function getSwapAmountFromLocalWallet(swap, localWallet) {
    const sourceToken = localWallet.find(token => token.token === swap.from.toUpperCase());
    if (!sourceToken) {
        throw new Error(`Token ${swap.from} not found in local wallet`);
    }
    if (swap.fromPercent) {
        const tokenValue = parseFloat(sourceToken.value);
        const fromAmount = (tokenValue * swap.fromPercent).toFixed(6);
        return fromAmount.toString();
    } else {
        return swap.amount;
    }
}

/**
 * Executes a swap operation based on the given swap information and token details.
 *
 * @param {Object} swapInfo - An object containing details about the swap.
 *                            This includes 'from' (source token), 'to' (destination token), 
 *                            and 'amount' (amount to swap).
 * @param {Object} tokens - An object containing details of all supported tokens, 
 *                          where each token symbol maps to an object with contract address 
 *                          and decimal places.
 * @throws {Error} If an error occurs during the swap process, it logs the error message.
 */
async function performSwap(swapInfo, tokens) {
    try {
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

        const params = await _prepareParams(swapInfo, account, tokens, null, true)
        // Swap Quotes
        const quotes = await fetchQuotes(params, AVNU_OPTIONS);

        // Swap Execution
        const res = await executeSwap(account, quotes[0], {slippage: config.swap.slippage}, AVNU_OPTIONS);
        console.log(chalk.blue("Swap in progress : "));
        console.log(chalk.blue("Provider: "), chalk.white(provider.nodeUrl));
        console.log(chalk.blue("Informations: "), chalk.white(JSON.stringify(swapInfo)));
        await provider.waitForTransaction(res.transactionHash)
        console.log(chalk.blue('\n####################################################################'));
        console.log(chalk.gray('Success, check your transaction here: '), chalk.white(formatStarkscanUrl(res.transactionHash)));
        console.log(chalk.blue('####################################################################'));
    } catch (e) {
        console.log(chalk.red('####################################################################'));
        console.log(chalk.red('Error during the swap: '), chalk.white(e.message));
        console.log(chalk.red('####################################################################'));
        throw Error('Swap error')
    }
}

/**
 * Prepares the parameters required for fetching swap quotes or executing a swap.
 *
 * @param {Object} swapInfo - An object containing details about the swap.
 *                            Includes 'from' (source token symbol), 'to' (destination token symbol), 
 *                            and 'amount' (amount to swap).
 * @param {Object} account - The user's blockchain account object, containing address and other details.
 * @param {Object} tokens - An object containing details of all supported tokens, 
 *                          where each token symbol maps to an object with contract address 
 *                          and decimal places.
 * @param {Array} [localWallet=null] - An optional array of token objects in the user's local wallet. 
 *                                     Used to calculate swap amounts if not in 'isSwap' mode.
 * @param {boolean} [isSwap=false] - Flag indicating whether the function is being called 
 *                                   for a swap operation (true) or just to fetch quotes (false).
 * @returns {Object} An object containing the prepared parameters for the swap.
 */
async function _prepareParams(swapInfo, account, tokens, localWallet = null, isSwap = false) {
    const amount = (isSwap) ? swapInfo.amount : await getSwapAmountFromLocalWallet(swapInfo, localWallet)
    return {
        sellTokenAddress: tokens[swapInfo['from'].toUpperCase()]['contract'],
        buyTokenAddress: tokens[swapInfo['to'].toUpperCase()]['contract'],
        sellAmount: parseUnits(amount, tokens[swapInfo['from'].toUpperCase()]['decimal']),
        takerAddress: account.address
    };
}

export {
    avnuMenu,
    getAvnuSupportedTokens,
    performSwap,
    DEFAULT_RPC
}