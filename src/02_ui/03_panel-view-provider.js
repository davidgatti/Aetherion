let vscode = require('vscode');

//
//  Panel view provider for system monitoring
//
class SystemPanelProvider {

    constructor() {
        this._view = undefined;
    }

    //
    //  Resolve webview view
    //
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;

        //
        //  Configure webview
        //
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                context.extensionUri
            ]
        };

        //
        //  Set HTML content
        //
        webviewView.webview.html = this._getHtmlForWebview();

        //
        //  Handle messages from the webview
        //
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    //
    //  Generate HTML content for the webview
    //
    _getHtmlForWebview() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Monitor Panel</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                
                h1 {
                    color: var(--vscode-titleBar-activeForeground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                
                .welcome-card {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: var(--vscode-font-size);
                    font-family: var(--vscode-font-family);
                }
                
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>System Monitor Panel</h1>
                
                <div class="welcome-card">
                    <h2>Hello World! 🌍</h2>
                    <p>This is your new Panel Area view for the System Monitor extension.</p>
                    <p>This panel appears in the same area as Terminal, Problems, and other VS Code panels.</p>
                    
                    <button class="button" onclick="sendMessage()">Test Communication</button>
                </div>
                
                <div class="welcome-card">
                    <h3>What's possible here?</h3>
                    <ul>
                        <li>Real-time system monitoring charts</li>
                        <li>Interactive process management</li>
                        <li>System logs and alerts</li>
                        <li>Quick actions and controls</li>
                        <li>Integration with VS Code themes</li>
                    </ul>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function sendMessage() {
                    vscode.postMessage({
                        command: 'alert',
                        text: 'Hello from the System Monitor Panel! 🚀'
                    });
                }
            </script>
        </body>
        </html>`;
    }

    //
    //  Show the panel view
    //
    show() {
        if (this._view) {
            this._view.show(true);
        }
    }
}

module.exports = { SystemPanelProvider };