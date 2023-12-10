/**
 * Formats a StarkScan URL for a given transaction hash.
 * 
 * @param {string} tx The transaction hash to format.
 * @returns {string} The formatted StarkScan URL.
 */
function formatStarkscanUrl(tx) {    
    return `https://${(process.env.SWAP_ENV === 'testnet')? 'testnet.' : ''}starkscan.co/tx/${tx}`
}

export {
    formatStarkscanUrl
}