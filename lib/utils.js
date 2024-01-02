import { formatUnits } from 'ethers';
import { RpcProvider, Account, constants } from "starknet";
import { DEFAULT_RPC } from "./avnu.js";
import { promises as fs } from 'fs';
import cronParser from 'cron-parser';
import ecosystem from './../ecosystem.config.cjs';
/**
 * Function to format an amount in hexadecimal to decimal
 * @param {*} amount 
 * @param {*} decimal 
 */
function formatAmountInWallet(amount, decimal) {
  console.log(amount, decimal)
  return parseFloat(formatUnits(amount, decimal)).toFixed(5)
}

/**
 * Function to execute multi call contrat in parallel
 * @param {*} actions 
 * @returns 
 */
async function executeMultiReadCall(actions) {

  // initialize provider    
  const provider = new RpcProvider({
    nodeUrl: ((process.env.STARKNET_RPC)
      ? process.env.STARKNET_RPC
      : constants[DEFAULT_RPC][0]
    )
  });
  const privateKey = process.env.PRIVATE_KEY;
  const accountAddress = process.env.PUBLIC_KEY;
  // initialize account   
  const account = new Account(provider, accountAddress, privateKey, "1");

  // Aggregate all call contract
  const readPromises = actions.map(action =>
    account.callContract({
      contractAddress: action.contractAddress,
      entrypoint: action.entrypoint,
      calldata: action.calldata
    }).then(response => ({
      token: action.token,
      result: response.result
    })).catch(error => ({
      token: action.token,
      error: error.message
    }))
  );

  // Execute parallel call and return the result
  return await Promise.allSettled(readPromises);
}

/**
 *
 * This function takes an array of cryptocurrency objects and transforms it into an object
 * where each key is the uppercase symbol of the cryptocurrency, and the value is an object.
 *
 * @param {Array} cryptos - An array of objects, each representing a cryptocurrency. 
 * @returns {Object} An object where each key is a cryptocurrency symbol in uppercase, 
 *                   and each value is an object containing the cryptocurrency's contract 
 *                   address and decimal count.
 */
function createCryptoArray(cryptos) {
  let cryptoArray = {};
  cryptos.forEach(crypto => {
    cryptoArray[crypto.symbol.toUpperCase()] = {
      contract: crypto.address,
      decimal: crypto.decimals
    };
  });
  return cryptoArray;
}

/**
 * Writes new swap information to a specified file.
 * @param {string} files - The file path where the swap data is to be written.
 * @param {object} swapInfo - The swap information object to be added to the file.
 */
async function writeSwapInfo(files, swapInfo) {
  const data = await readSwapFile(files, swapInfo)
  data.push(swapInfo)
  const swapData = JSON.stringify(data, null, 2);
  await fs.writeFile(files, swapData);
}

/**
 * Deletes specific swap information from a file.
 * @param {string} files - The file path where the swap data is stored.
 * @param {Array} swapsList - An array of current swap information.
 * @param {object} swapToDelete - The specific swap information to be removed.
 */
async function deleteSwapInfo(files, swapsList, swapToDelete) {
  swapsList.splice(swapsList.indexOf(swapToDelete), 1);
  const swapData = JSON.stringify(swapsList, null, 2);
  await fs.writeFile(files, swapData);
}

/**
 * Reads swap information from a file, or initializes an empty array if the file does not exist.
 * @param {string} files - The file path from which to read the swap data.
 * @returns {Promise<Array>} A promise that resolves to an array of swap information.
 */
async function readSwapFile(files) {
  let swapArray;
  try {
      const fileContent = await fs.readFile(files, 'utf8');
      swapArray = JSON.parse(fileContent);
  } catch (err) {
      if (err.code === 'ENOENT') {
          swapArray = []; // File does not exist, initialize an empty array
      } else {
          throw err; // Other types of errors
      }
  } finally {
    return swapArray
  }
}

/**
 * Determines if a task should be executed based on the CRON schedule defined in ecosystem.config.js.
 * @returns {boolean} True if the current time matches the CRON schedule, false otherwise.
 */
function shouldExecuteTask(name) {
    
    // Get the CRON expression for the given application
    const cronExpression = getCronExpressionByName(name);

    try {        
        // Parse the CRON expression
        const interval = cronParser.parseExpression(cronExpression);
        // Get the current time and the next scheduled time
        const now = new Date();
        // Get the next and previous scheduled times
        const next = interval.next().toDate();
        const previous = interval.prev().toDate();
        // Compare if the current time is within the same time interval as the scheduled time
        return now >= previous && now < next && now.getSeconds() === previous.getSeconds();
        
    } catch (err) {
        console.error('Error while parsing the CRON expression:', err);
        return false;
    }
}

/**
 * Retrieves the cron expression for a given application name from the ecosystem configuration.
 * @param {string} appName - The name of the application to find the cron expression for.
 * @returns {string|null} The cron expression if found, or null if no matching application is found.
 */
function getCronExpressionByName(appName) {
  // Find the application object by its name in the ecosystem.apps array.
  const app = ecosystem.apps.find(app => app.name === appName);
  return app ? app.cron_restart : null;
}

export {
  formatAmountInWallet,
  executeMultiReadCall,
  createCryptoArray,
  writeSwapInfo,
  deleteSwapInfo,
  readSwapFile,
  shouldExecuteTask
}