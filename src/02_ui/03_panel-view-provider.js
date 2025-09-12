let vscode = require('vscode');
let { StaticSystemInfo } = require('../utility/static-system-info.js');

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
        //  Set initial HTML content synchronously
        //
        webviewView.webview.html = this._getLoadingHtml();

        //
        //  Load actual content asynchronously without blocking
        //
        this._loadContentAsync(webviewView);

        //
        //  Handle messages from the webview
        //
        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    case 'refresh':
                        //
                        //  Refresh the webview content asynchronously
                        //
                        this._loadContentAsync(webviewView);
                        vscode.window.showInformationMessage('System information refreshed! 🔄');
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    //
    //  Load content asynchronously without blocking main thread
    //
    async _loadContentAsync(webviewView) {
        try {
            let html = await this._getHtmlForWebview();
            webviewView.webview.html = html;
        } catch (error) {
            console.error('Error loading panel content:', error);
            webviewView.webview.html = this._getErrorHtml(error);
        }
    }

    //
    //  Get loading HTML (shown immediately)
    //
    _getLoadingHtml() {
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
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 200px;
                }

                .loading {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                }

                .spinner {
                    border: 2px solid var(--vscode-input-border);
                    border-top: 2px solid var(--vscode-textLink-foreground);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="loading">
                <div class="spinner"></div>
                Loading system information...
            </div>
        </body>
        </html>`;
    }

    //
    //  Get error HTML
    //
    _getErrorHtml(error) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Monitor Panel - Error</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Error Loading System Information</h1>
            <p>Error: ${error.message}</p>
            <button onclick="location.reload()">Retry</button>
        </body>
        </html>`;
    }

    //
    //  Generate HTML content for the webview
    //
    async _getHtmlForWebview() {

        //
        //  Get OS information using separate utility
        //
        let osInfo = await StaticSystemInfo.getSystemInformation();

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

                .info-card {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .info-label {
                    font-weight: bold;
                    color: var(--vscode-descriptionForeground);
                    min-width: 120px;
                }

                .info-value {
                    color: var(--vscode-editor-foreground);
                    text-align: right;
                    font-family: var(--vscode-editor-font-family, 'SF Mono', 'Monaco', 'Consolas', monospace);
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
                    margin-top: 15px;
                }

                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>System Information</h1>

                <div class="info-card">
                    <div class="info-row">
                        <span class="info-label">Operating System:</span>
                        <span class="info-value">${osInfo.platform}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">OS Version:</span>
                        <span class="info-value">${osInfo.osVersion || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">OS Release:</span>
                        <span class="info-value">${osInfo.release}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Architecture:</span>
                        <span class="info-value">${osInfo.architecture}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Hostname:</span>
                        <span class="info-value">${osInfo.hostname}</span>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-row">
                        <span class="info-label">CPU Model:</span>
                        <span class="info-value">${osInfo.cpuModel}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">CPU Cores:</span>
                        <span class="info-value">${osInfo.cpuCores}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">CPU Speed:</span>
                        <span class="info-value">${osInfo.cpuSpeed}</span>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-row">
                        <span class="info-label">Total Memory:</span>
                        <span class="info-value">${osInfo.totalMemory}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Free Memory:</span>
                        <span class="info-value">${osInfo.freeMemory}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Uptime:</span>
                        <span class="info-value">${osInfo.uptime}</span>
                    </div>
                </div>

                <button class="button" onclick="refreshInfo()">Refresh Information</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function refreshInfo() {
                    vscode.postMessage({
                        command: 'refresh',
                        text: 'Refreshing system information...'
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
