module.exports = {
    apps: [
        {
            name: 'gas-optimizer',
            script: './gasOptimizer.js',
            cron_restart: '0 */15 01-05 * * *', // Cron expression for every 15min between 1 AM and 5 AM UTC
            autorestart: false, // Prevents automatic restart outside the cron schedule
            out_file: './logs/gas_optimizer_out.json',
            error_file: './logs/gas_optimizer_error.json',
            merge_logs: true, // Merge standard output and error logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        },
        {
            name: 'order-manager',
            script: './orderManager.js',
            cron_restart: '0 */5 * * * *', // Cron expression for every 30min
            autorestart: false, // Prevents automatic restart outside the cron schedule
            out_file: './logs/order_manager_out.json',
            error_file: './logs/order_manager_error.json',
            merge_logs: true, // Merge standard output and error logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        }
    ]
}
