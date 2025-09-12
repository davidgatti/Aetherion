let vscode = require('vscode');

//
//  Command to open the system monitor panel
//
async function open_system_panel(panelProvider) {

    try {

        //
        //  Show the panel view
        //
        if (panelProvider) {
            panelProvider.show();
        }

        //
        //  Focus the panel area to ensure visibility
        //
        await vscode.commands.executeCommand('systemMonitorView.focus');

    } catch (error) {

        //
        //  Log error for debugging
        //
        console.error('Error opening system panel:', error);
        vscode.window.showErrorMessage('Failed to open System Monitor panel');
    }
}

module.exports = open_system_panel;
