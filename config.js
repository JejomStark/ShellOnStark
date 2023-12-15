import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const config = {
    files: { 
        tokens_list: path.join(__dirname, 'files', 'personal_tokens.json')
    },
    swap: {
        slippage: 0.01 //1%
    }
};

export default config;