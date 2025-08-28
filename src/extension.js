// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
let vscode = require('vscode');

//
//	Import modular functions
//
let get_cpu_braille_character = require('./02_get_cpu_braille_character.js');
let calculate_ram_usage_internal = require('./03_calculate_ram_usage.js');
let get_ram_braille_character = require('./04_get_ram_braille_character.js');
let update_status_bar_display = require('./05_update_status_bar_display.js');
let show_system_info_command = require('./06_show_system_info_command.js');

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
    status_bar_item.show();

    //
    //	Function to update CPU display using modular approach
    //
    async function update_display() {
        await update_status_bar_display(status_bar_item);
    }

    //
    //	Update display initially
    //
    update_display();

    //
    //	Set up timer to update every 200ms
    //
    let update_interval = setInterval(update_display, 200);

    //
    //	Add the status bar item and interval to subscriptions so they get disposed when extension is deactivated
    //
    context.subscriptions.push(status_bar_item);
    context.subscriptions.push({ dispose: function() { clearInterval(update_interval); } });

    //
    //	The command has been defined in the package.json file
    //	Now provide the implementation of the command with registerCommand
    //	The commandId parameter must match the command field in package.json
    //
    let disposable = vscode.commands.registerCommand('sysmag.helloWorld', show_system_info_command);

    context.subscriptions.push(disposable);
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
    calculateRamUsage: calculateRamUsage
};
