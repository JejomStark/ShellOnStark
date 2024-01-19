import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global configuration file.
 */
const config = {
    files: { 
        tokens_list: path.join(__dirname, 'files', 'personal_tokens.json'),
        scheduled_swap: path.join(__dirname, 'files', 'scheduled_swap.json'),
        executed_swap: path.join(__dirname, 'files', 'executed_swap.json'),
        scheduled_limit_order: path.join(__dirname, 'files', 'scheduled_limit_order.json'),
        executed_limit_order: path.join(__dirname, 'files', 'executed_limit_order.json'),
        dca_order: path.join(__dirname, 'files', 'dca_order.json')
    },
    swap: {
        slippage: 0.01, //1%
        max_gas_fees_in_usd: 1 //1$
    },
    dca: {        
        weekly: 1, // weekly dca executed : monday:1, thursday:2...sunday:7,
        montly: 1 // montly dca executed first day of month
    }
};

export default config;