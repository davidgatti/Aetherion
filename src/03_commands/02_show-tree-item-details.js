let vscode = require('vscode');

//
//	Show details when tree items are clicked
//
async function show_tree_item_details(treeItem) {

    //
    //	Handle different tree item types
    //
    switch (treeItem.contextValue) {
        case 'cpu-overall':
        case 'cpu-core':
            //
            //	Show CPU details
            //
            vscode.window.showInformationMessage(
                `CPU Details: ${treeItem.label}\n\nClick 'Monitor' to track this core in real-time.`,
                'Monitor',
                'Copy Value'
            ).then(selection => {
                if (selection === 'Monitor') {
                    vscode.window.showInformationMessage('Would start monitoring this CPU core... 📊');
                } else if (selection === 'Copy Value') {
                    vscode.env.clipboard.writeText(treeItem.label);
                    vscode.window.showInformationMessage('CPU value copied! 📋');
                }
            });
            break;

        case 'memory-usage':
        case 'memory-used':
        case 'memory-available':
        case 'memory-total':
            //
            //	Show memory details
            //
            vscode.window.showInformationMessage(
                `Memory Details: ${treeItem.label}\n\nClick 'Analyze' to see memory breakdown.`,
                'Analyze',
                'Copy Value'
            ).then(selection => {
                if (selection === 'Analyze') {
                    vscode.window.showInformationMessage('Would show detailed memory analysis... 🔍');
                } else if (selection === 'Copy Value') {
                    vscode.env.clipboard.writeText(treeItem.label);
                    vscode.window.showInformationMessage('Memory value copied! 📋');
                }
            });
            break;

        default:
            //
            //	Generic info display
            //
            vscode.window.showInformationMessage(`Info: ${treeItem.label}`);
            break;
    }
}

module.exports = show_tree_item_details;
