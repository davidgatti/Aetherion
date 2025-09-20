let vscode = require('vscode');

//
//  Process Graph view provider for live process count visualization
//
class ProcessGraphViewProvider {

    constructor() {
        this._view = undefined;
        this._updateInterval = undefined;
        this._isActive = false;
    }

    //
    //  Resolve webview view
    //
    resolveWebviewView(webviewView, context) {
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
        //  Set initial HTML content
        //
        webviewView.webview.html = this._getHtmlForWebview();

        //
        //  Handle view becoming visible/hidden
        //
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._startLiveUpdates();
            } else {
                this._stopLiveUpdates();
            }
        });

        //
        //  Handle view disposal
        //
        webviewView.onDidDispose(() => {
            this._stopLiveUpdates();
        });

        //
        //  Handle messages from the webview
        //
        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'ready':
                        //
                        //  Start updates when webview is ready
                        //
                        this._startLiveUpdates();
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    //
    //  Update Process graph with data from status bar (shared calculation)
    //
    updateProcessData(process_usage_percent) {
        if (this._view && this._view.visible) {
            //
            //  Send Process data to webview
            //
            this._view.webview.postMessage({
                command: 'updateProcessData',
                data: {
                    timestamp: Date.now(),
                    process_usage: process_usage_percent
                }
            });
        }
    }

    //
    //  Start live RAM data updates (now just waits for status bar data)
    //
    _startLiveUpdates() {
        this._isActive = true;
        // RAM data now comes from status bar - no separate calculation needed
    }

    //
    //  Stop live updates
    //
    _stopLiveUpdates() {
        this._isActive = false;
        // No interval to clear - data comes from status bar
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
            <title>Process Live Graph</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-sideBar-background);
                    margin: 0;
                    padding: 20px;
                    overflow: hidden;
                    height: 100vh;
                    box-sizing: border-box;
                }

                .process-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px 10px;
                    width: 100%;
                    height: calc(100vh - 40px);
                    align-content: stretch;
                    box-sizing: border-box;
                }

                .process-chart {
                    background-color: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    position: relative;
                    height: 100%;
                    min-height: 200px;
                    box-sizing: border-box;
                    max-width: 100%;
                }

                .chart-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    box-sizing: border-box;
                }

                canvas {
                    background-color: transparent !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                }
            </style>
        </head>
        <body>
            <div class="process-grid" id="processGrid">
                <!-- Process chart will be dynamically generated here -->
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                //
                //  Chart.js configuration and setup
                //
                let processChart = null; // Single Process chart
                let maxDataPoints = 120; // Keep 2 minutes of data at 1-second intervals
                // Always use VS Code's main chart foreground color
                function getMainChartColor() {
                    let computedStyles = getComputedStyle(document.body);
                    let color = computedStyles.getPropertyValue('--vscode-charts-foreground').trim();
                    if (!color) color = '#cccccc';
                    return color;
                }
                let timeLabels = [];

                //
                //  Initialize Process chart
                //
                function initChart() {
                    let processGrid = document.getElementById('processGrid');
                    processGrid.innerHTML = ''; // Clear existing chart

                    // Get VS Code theme colors
                    let computedStyles = getComputedStyle(document.body);
                    let textColor = computedStyles.getPropertyValue('--vscode-descriptionForeground') ||
                                   computedStyles.getPropertyValue('--vscode-editor-foreground') || '#cccccc';
                    let gridColor = 'rgba(128, 128, 128, 0.2)';
                    let fontFamily = computedStyles.getPropertyValue('--vscode-editor-font-family') || 'monospace';
                    let mainColor = getMainChartColor();

                    // Create Process container
                    let processDiv = document.createElement('div');
                    processDiv.className = 'process-chart';

                    // Create chart container
                    let chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';

                    // Create canvas
                    let canvas = document.createElement('canvas');
                    canvas.id = 'process-chart';

                    // Assemble structure
                    chartContainer.appendChild(canvas);
                    processDiv.appendChild(chartContainer);
                    processGrid.appendChild(processDiv);

                    // Create Chart.js instance for Process
                    let ctx = canvas.getContext('2d');
                    processChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timeLabels,
                            datasets: [{
                                label: 'Process Usage',
                                data: [],
                                borderColor: mainColor,
                                backgroundColor: mainColor + '20',
                                fill: true,
                                tension: 0.1,
                                borderWidth: 1.5,
                                pointRadius: 0,
                                pointHoverRadius: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            resizeDelay: 0,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    enabled: false // Disable tooltips for minimal design
                                }
                            },
                            scales: {
                                x: {
                                    display: false, // Completely hide X-axis
                                    grid: {
                                        display: false
                                    }
                                },
                                y: {
                                    display: false, // Completely hide Y-axis
                                    beginAtZero: true,
                                    max: 100,
                                    grid: {
                                        display: false // Remove grid lines
                                    }
                                }
                            },
                            layout: {
                                padding: {
                                    left: 2,
                                    right: 2,
                                    top: 2,
                                    bottom: 2
                                }
                            },
                            animation: {
                                duration: 0
                            }
                        }
                    });
                }

                //
                //  Clear Process chart
                //
                function clearGraph() {
                    if (processChart) {
                        processChart.data.labels = [];
                        processChart.data.datasets[0].data = [];
                        processChart.update();
                    }
                    timeLabels = [];
                }

                //
                //  Update Process chart with new data
                //
                function updateChart(processData) {
                    if (!processChart) {
                        // Initialize chart if not done yet
                        initChart();
                    }

                    // Create concise time label (HH:MM:SS format)
                    let now = new Date();
                    let timestamp = now.getHours().toString().padStart(2, '0') + ':' +
                                   now.getMinutes().toString().padStart(2, '0') + ':' +
                                   now.getSeconds().toString().padStart(2, '0');

                    // Add new time label
                    timeLabels.push(timestamp);
                    if (timeLabels.length > maxDataPoints) {
                        timeLabels.shift();
                    }

                    // Update Process chart
                    if (processChart) {
                        let dataset = processChart.data.datasets[0];

                        // Add new data point
                        dataset.data.push(processData.process_usage);

                        // Remove old data points
                        if (dataset.data.length > maxDataPoints) {
                            dataset.data.shift();
                        }

                        // Update labels and chart
                        processChart.data.labels = timeLabels;
                        processChart.update();
                    }
                }

                //
                //  Handle messages from extension
                //
                window.addEventListener('message', event => {
                    let message = event.data;

                    switch (message.command) {
                        case 'updateProcessData':
                            updateChart(message.data);
                            break;
                    }
                });

                //
                //  Initialize chart when DOM is ready (chart created on first data)
                //
                document.addEventListener('DOMContentLoaded', function() {
                    // Chart will be initialized when first RAM data arrives
                });

                //
                //  Tell extension we're ready
                //
                vscode.postMessage({
                    command: 'ready'
                });
            </script>
        </body>
        </html>`;
    }

    //
    //  Show the view
    //
    show() {
        if (this._view) {
            this._view.show(true);
        }
    }
}

module.exports = { ProcessGraphViewProvider };
