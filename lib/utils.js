import { formatUnits} from 'ethers';
import { RpcProvider, Account, constants } from "starknet";
import { DEFAULT_RPC } from "./avnu.js";
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




export {
  formatAmountInWallet, 
  executeMultiReadCall
}