import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const config = {
    files: { 
        tokens_list: path.join(__dirname, 'files', 'personal_tokens.json'),
        scheduled_swap: path.join(__dirname, 'files', 'scheduled_swap.json'),
        executed_swap: path.join(__dirname, 'files', 'executed_swap.json')
    },
    swap: {
        slippage: 0.01, //1%
        max_gas_fees: 2 //2$
    }
};

export default config;