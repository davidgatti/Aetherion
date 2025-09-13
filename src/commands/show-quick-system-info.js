let vscode = require('vscode');
let os = require('os');
let { calculate_cpu_usage } = require('../utility/metrics/live/cpu-monitor.js');
let { calculate_ram_usage_internal } = require('../utility/metrics/live/ram-monitor.js');

//
//	Show quick system info when status bar is clicked
//
async function show_quick_system_info() {

    try {
        //
        //	Get current system information
        //
        let cpu_usage_percentages = await calculate_cpu_usage();
        let ram_usage_info = await calculate_ram_usage_internal();
        let cpu_count = os.cpus().length;

        //
        //	Calculate average CPU usage
        //
        let total_usage = cpu_usage_percentages.reduce((sum, usage) => sum + usage, 0);
        let avg_cpu = total_usage / cpu_usage_percentages.length;

        //
        //	Build quick info message
        //
        let message = `System Status

CPU: ${avg_cpu.toFixed(1)}% average (${cpu_count} cores)
RAM: ${ram_usage_info.usage_percent.toFixed(1)}% used
Available: ${ram_usage_info.available_gb.toFixed(1)}GB of ${ram_usage_info.total_gb.toFixed(1)}GB`;

        //
        //	Show information dialog with useful actions
        //
        let selection = await vscode.window.showInformationMessage(
            message,
            'Copy Stats',
            'Detailed View'
        );

        //
        //	Handle user selection
        //
        switch (selection) {
            case 'Copy Stats':
                //
                //	Copy stats to clipboard
                //
                let stats_text = `CPU: ${avg_cpu.toFixed(1)}%, RAM: ${ram_usage_info.usage_percent.toFixed(1)}% (${ram_usage_info.available_gb.toFixed(1)}GB/${ram_usage_info.total_gb.toFixed(1)}GB)`;
                await vscode.env.clipboard.writeText(stats_text);
                vscode.window.showInformationMessage('System stats copied to clipboard! 📋');
                break;

            case 'Detailed View':
                //
                //	Show detailed per-core information
                //
                let detailed_info = `Detailed System Information

CPU Cores (${cpu_count} total):
${cpu_usage_percentages.map((usage, index) => `  Core ${index + 1}: ${usage.toFixed(1)}%`).join('\n')}
Average: ${avg_cpu.toFixed(1)}%

Memory:
  Used: ${(ram_usage_info.total_gb - ram_usage_info.available_gb).toFixed(1)}GB
  Available: ${ram_usage_info.available_gb.toFixed(1)}GB
  Total: ${ram_usage_info.total_gb.toFixed(1)}GB
  Usage: ${ram_usage_info.usage_percent.toFixed(1)}%

System:
  Platform: ${os.platform()}
  Architecture: ${os.arch()}
  Uptime: ${formatUptime(os.uptime())}`;

                vscode.window.showInformationMessage(detailed_info, 'Copy All')
                    .then(action => {
                        if (action === 'Copy All') {
                            vscode.env.clipboard.writeText(detailed_info);
                            vscode.window.showInformationMessage('Detailed info copied! 📋');
                        }
                    });
                break;

            default:
                //
                //	User dismissed dialog - no action needed
                //
                break;
        }

    } catch (error) {
        //
        //	Handle errors gracefully
        //
        console.error('Error showing quick system info:', error);
        vscode.window.showErrorMessage('Failed to get system information');
    }
}

//
//	Format uptime in human-readable format
//
function formatUptime(seconds) {
    let days = Math.floor(seconds / 86400);
    let hours = Math.floor((seconds % 86400) / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

module.exports = show_quick_system_info;
