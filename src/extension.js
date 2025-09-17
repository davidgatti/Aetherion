// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
let vscode = require('vscode');

//
//	Import modular functions
//
let { get_cpu_braille_character } = require('./utility/metrics/live/cpu-monitor.js');
let { calculate_ram_usage_internal, get_ram_braille_character } = require('./utility/metrics/live/ram-monitor.js');
let { calculate_disk_usage_internal, get_disk_braille_character } = require('./utility/metrics/live/disk-monitor.js');
let { calculate_network_usage_internal, get_network_in_braille_character, get_network_out_braille_character } = require('./utility/metrics/live/network-monitor.js');
let { calculate_swap_usage_internal, get_swap_braille_character } = require('./utility/metrics/live/swap-monitor.js');
let { calculate_disk_activity_internal, get_disk_activity_braille_character, get_disk_read_activity_braille_character, get_disk_write_activity_braille_character } = require('./utility/metrics/live/disk-activity-monitor.js');
let update_status_bar_display = require('./ui/status-bar/status-bar-display.js');
let { SystemPanelProvider } = require('./ui/panel-views/system-monitor-view-provider.js');
let { CpuGraphViewProvider } = require('./ui/panel-views/cpu-graph-view-provider.js');
let { RamGraphViewProvider } = require('./ui/panel-views/ram-graph-view-provider.js');
let { SwapGraphViewProvider } = require('./ui/panel-views/swap-graph-view-provider.js');
let open_system_panel = require('./commands/open-system-panel.js');

//
//	Export functions for external access and testing
//
async function getSquareForUsage(usage) {

    //
    //	--> delegate to modular CPU braille function
    //
    return await get_cpu_braille_character(usage);
}

async function getRamBlock(usage) {

    //
    //	--> delegate to modular RAM braille function
    //
    return await get_ram_braille_character(usage);
}

async function calculateRamUsage() {

    //
    //	Get RAM usage information from modular function
    //
    let ram_info = await calculate_ram_usage_internal();

    //
    //	--> return formatted response for compatibility
    //
    return {
        usagePercent: ram_info.usage_percent,
        availableGB: ram_info.available_gb,
        totalGB: ram_info.total_gb
    };
}

async function calculateDiskUsage() {

    //
    //	Get disk usage information from modular function
    //
    let disk_info = await calculate_disk_usage_internal();

    //
    //	--> return formatted response for compatibility
    //
    return {
        usagePercent: disk_info.usage_percent,
        availableGB: disk_info.available_gb,
        totalGB: disk_info.total_gb
    };
}

async function getDiskBlock(usage) {

    //
    //	--> delegate to modular disk braille function
    //
    return await get_disk_braille_character(usage);
}

async function calculateNetworkUsage() {

    //
    //	Get network usage information from modular function
    //
    let network_info = await calculate_network_usage_internal();

    //
    //	--> return formatted response for compatibility
    //
    return {
        networkInPercent: network_info.network_in_percent,
        networkOutPercent: network_info.network_out_percent,
        interfaceName: network_info.interface_name,
        capacityMbps: network_info.capacity_mbps
    };
}

async function getNetworkInBlock(usage) {

    //
    //	--> delegate to modular network in braille function
    //
    return await get_network_in_braille_character(usage);
}

async function getNetworkOutBlock(usage) {

    //
    //	--> delegate to modular network out braille function
    //
    return await get_network_out_braille_character(usage);
}

async function calculateSwapUsage() {

    //
    //	Get swap usage information from modular function
    //
    let swap_info = await calculate_swap_usage_internal();

    //
    //	--> return formatted response for compatibility
    //
    return {
        usagePercent: swap_info.usage_percent,
        usedGB: swap_info.used_gb,
        totalGB: swap_info.total_gb,
        availableGB: swap_info.available_gb,
        swapEnabled: swap_info.swap_enabled
    };
}

async function getSwapBlock(usage) {

    //
    //	--> delegate to modular swap braille function
    //
    return await get_swap_braille_character(usage);
}

async function calculateDiskActivity() {

    //
    //	Get disk activity information from modular function
    //
    let activity_info = await calculate_disk_activity_internal();

    //
    //	--> return formatted response for compatibility
    //
    return {
        activity_level: activity_info.activity_level,
        total_kb_s: activity_info.total_kb_s,
        transfers_per_second: activity_info.transfers_per_second,
        activity_description: activity_info.activity_description,
        mb_per_second: activity_info.mb_per_second,
        // New TPS-based properties
        total_tps: activity_info.total_tps,
        read_tps: activity_info.read_tps,
        write_tps: activity_info.write_tps,
        read_activity_level: activity_info.read_activity_level,
        write_activity_level: activity_info.write_activity_level
    };
}

async function getDiskActivityBlock(activity_level) {

    //
    //	--> delegate to modular disk activity braille function
    //
    return await get_disk_activity_braille_character(activity_level);
}

async function getDiskReadActivityBlock(read_activity_level) {

    //
    //	--> delegate to modular disk read activity braille function
    //
    return await get_disk_read_activity_braille_character(read_activity_level);
}

async function getDiskWriteActivityBlock(write_activity_level) {

    //
    //	--> delegate to modular disk write activity braille function
    //
    return await get_disk_write_activity_braille_character(write_activity_level);
}

//
//	This method is called when your extension is activated
//	Your extension is activated the very first time the command is executed
//
function activate(context) {

    //
    //	Use the console to output diagnostic information (console.log) and errors (console.error)
    //	This line of code will only be executed once when your extension is activated
    //
    console.log('Congratulations, your extension "sysmag" is now active!');

    //
    //	Create a status bar item
    //
    let status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);

    //
    //	Make status bar item clickable - open panel view
    //
    status_bar_item.command = 'sysmag.openSystemPanel';

    status_bar_item.show();

    //
    //	Create CPU graph view provider (needed for status bar updates)
    //
    let cpuGraphProvider = new CpuGraphViewProvider();

    //
    //	Create RAM graph view provider (needed for status bar updates)
    //
    let ramGraphProvider = new RamGraphViewProvider();

    //
    //	Create Swap graph view provider (needed for status bar updates)
    //
    let swapGraphProvider = new SwapGraphViewProvider();

    //
    //	Function to update CPU display using modular approach
    //
    async function update_display() {
        await update_status_bar_display(status_bar_item, false, cpuGraphProvider, ramGraphProvider, swapGraphProvider); // false = don't update tooltip, pass graph providers
    }

    //
    //	Function to update both display and tooltip
    //
    async function update_display_and_tooltip() {
        await update_status_bar_display(status_bar_item, true, cpuGraphProvider, ramGraphProvider, swapGraphProvider); // true = update tooltip, pass graph providers
    }

    //
    //	Update display and tooltip initially
    //
    update_display_and_tooltip();

    //
    //	Set up timer to update display every 200ms (smooth braille animation)
    //
    let update_interval = setInterval(update_display, 200);

    //
    //	Set up timer to update tooltip every 3 seconds (prevent flickering)
    //
    let tooltip_interval = setInterval(update_display_and_tooltip, 3000);

    //
    //	Add the status bar item and intervals to subscriptions so they get disposed when extension is deactivated
    //
    context.subscriptions.push(status_bar_item);
    context.subscriptions.push({ dispose: function() { clearInterval(update_interval); } });
    context.subscriptions.push({ dispose: function() { clearInterval(tooltip_interval); } });

    //
    //	Create and register the panel view provider
    //
    let panelProvider = new SystemPanelProvider();
    vscode.window.registerWebviewViewProvider('systemMonitorView', panelProvider);

    //
    //	Register the CPU graph view provider
    //
    vscode.window.registerWebviewViewProvider('cpuGraphView', cpuGraphProvider);

    //
    //	Register the RAM graph view provider
    //
    vscode.window.registerWebviewViewProvider('ramGraphView', ramGraphProvider);

    //
    //	Register the Swap graph view provider
    //
    vscode.window.registerWebviewViewProvider('swapGraphView', swapGraphProvider);

    //
    //	Register panel open command
    //
    let panelDisposable = vscode.commands.registerCommand('sysmag.openSystemPanel', () => open_system_panel(panelProvider));

    context.subscriptions.push(panelDisposable);
}

//
//	This method is called when your extension is deactivated
//
function deactivate() {}

//
//	Export functions for Node.js module system
//
module.exports = {
    activate: activate,
    deactivate: deactivate,
    getSquareForUsage: getSquareForUsage,
    getRamBlock: getRamBlock,
    calculateRamUsage: calculateRamUsage,
    getDiskBlock: getDiskBlock,
    calculateDiskUsage: calculateDiskUsage,
    getNetworkInBlock: getNetworkInBlock,
    getNetworkOutBlock: getNetworkOutBlock,
    calculateNetworkUsage: calculateNetworkUsage,
    getSwapBlock: getSwapBlock,
    calculateSwapUsage: calculateSwapUsage,
    calculateDiskActivity: calculateDiskActivity,
    getDiskActivityBlock: getDiskActivityBlock,
    getDiskReadActivityBlock: getDiskReadActivityBlock,
    getDiskWriteActivityBlock: getDiskWriteActivityBlock
};
