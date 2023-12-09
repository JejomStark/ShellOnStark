/**
 * Formats a StarkScan URL for a given transaction hash.
 * 
 * @param {string} tx The transaction hash to format.
 * @returns {string} The formatted StarkScan URL.
 */
function formatStarkscanUrl(tx) {
    return process.env.STARKSCAN_API + tx
}

export {
    formatStarkscanUrl
}