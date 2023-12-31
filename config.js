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
    },
    swap: {
        slippage: 0.01, //1%
        max_gas_fees_in_usd: 1 //1$
    }
};

export default config;