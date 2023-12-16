import { formatUnits } from 'ethers';
import { RpcProvider, Account, constants } from "starknet";
import { DEFAULT_RPC } from "./avnu.js";
import config from "./../config.js";
import { promises as fs } from 'fs';

/**
 * Function to format an amount in hexadecimal to decimal
 * @param {*} amount 
 * @param {*} decimal 
 */
function formatAmountInWallet(amount, decimal) {
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
 * Lit les swaps planifiés dans un fichier JSON et exécute ceux dont les frais de gaz sont inférieurs au seuil.
 * Après exécution, met à jour les fichiers JSON.
 */
async function processScheduledSwaps(fetchQuotesFunction) {

  // Lire les swaps planifiés
  let scheduledSwaps = JSON.parse(await fs.readFile(config.files.scheduled_swap, 'utf8'));
  let executedSwaps = JSON.parse(await fs.readFile(config.files.executed_swap, 'utf8'));

  for (let swap of scheduledSwaps) {
    let quote = await fetchQuotesFunction();
    const currentGasFee = quote[0].max_gas_fees;

    if (currentGasFee <= maxGasFee) {
      // Exécuter le swap ici
      // ...

      // Ajouter à executed_swaps.json
      executedSwaps.push(swap);

      // Retirer de scheduled_swap.json
      scheduledSwaps = scheduledSwaps.filter(s => s !== swap);
    }
  }

  // Enregistrer les fichiers JSON mis à jour
  await fs.writeFile(config.files.scheduled_swap, JSON.stringify(scheduledSwaps, null, 2));
  await fs.writeFile(config.files.executed_swap, JSON.stringify(executedSwaps, null, 2));
}


async function writeSwapInfo(files, swapInfo) {
  const data = await readSwapFile(files, swapInfo)
  data.push(swapInfo)
  const swapData = JSON.stringify(data, null, 2);
  await fs.writeFile(files, swapData);
}

async function readSwapFile(files) {
  // Lire le fichier existant ou initialiser un tableau vide
  let swapArray;
  try {
      const fileContent = await fs.readFile(files, 'utf8');
      swapArray = JSON.parse(fileContent);
  } catch (err) {
      if (err.code === 'ENOENT') {
          swapArray = []; // Le fichier n'existe pas, initialiser un tableau vide
      } else {
          throw err; // Autre type d'erreur
      }
  } finally {
    console.log('finaly')
    return swapArray
  }
}

export {
  formatAmountInWallet,
  executeMultiReadCall,
  createCryptoArray,
  writeSwapInfo
}