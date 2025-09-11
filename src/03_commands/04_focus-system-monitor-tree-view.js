let vscode = require('vscode');

//
//	Focus the system monitor tree view when status bar is clicked
//
async function focus_system_monitor_tree_view() {

    try {
        //
        //	Focus the system monitor tree view in the explorer sidebar
        //
        await vscode.commands.executeCommand('systemMonitorView.focus');

        //
        //	Also refresh the tree view to ensure latest data
        //
        await vscode.commands.executeCommand('sysmag.refreshSystemMonitor');

    } catch (error) {
        //
        //	If focus fails, just refresh the tree view
        //
        console.log('Could not focus tree view, refreshing instead:', error.message);
        await vscode.commands.executeCommand('sysmag.refreshSystemMonitor');
    }
}

module.exports = focus_system_monitor_tree_view;
