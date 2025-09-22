let vscode = require('vscode');

//
//  Command to open a new webview tab with Hello World content
//
async function open_full_tab() {

    try {

        //
        //  Create a webview panel (custom app-like tab)
        //
        let panel = vscode.window.createWebviewPanel(
            'helloWorldView', // View type identifier
            'Hello World App', // Title shown in tab
            vscode.ViewColumn.One, // Open in first column
            {
                enableScripts: true, // Allow JavaScript
                retainContextWhenHidden: true // Keep content when tab is hidden
            }
        );

        //
        //  Set the webview HTML content
        //
        panel.webview.html = getWebviewContent();

    } catch (error) {

        //
        //  Log error for debugging
        //
        console.error('Error opening full tab:', error);
        vscode.window.showErrorMessage('Failed to open full tab');
    }
}

//
//  Generate HTML content for the webview (app-like interface)
//
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hello World App</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                box-sizing: border-box;
            }
            
            .container {
                text-align: center;
                background-color: var(--vscode-sideBar-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 8px;
                padding: 60px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            h1 {
                color: var(--vscode-textLink-foreground);
                font-size: 2.5em;
                margin-bottom: 20px;
            }
            
            p {
                color: var(--vscode-descriptionForeground);
                font-size: 1.2em;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello World</h1>
            <p>This is a custom webview tab that looks like an app!</p>
        </div>
    </body>
    </html>`;
}

module.exports = { open_full_tab };