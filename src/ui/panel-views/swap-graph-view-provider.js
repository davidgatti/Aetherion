let vscode = require('vscode');

//
//  Swap Graph view provider for live swap usage visualization
//
class SwapGraphViewProvider {

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
    //  Update swap graph with data from status bar (shared calculation)
    //
    updateSwapData(swap_usage_percent, swap_enabled) {
        if (this._view && this._view.visible) {
            //
            //  Send swap data to webview
            //
            this._view.webview.postMessage({
                command: 'updateSwapData',
                data: {
                    timestamp: Date.now(),
                    swap_usage: swap_usage_percent,
                    swap_enabled: swap_enabled
                }
            });
        }
    }

    //
    //  Start live swap data updates (now just waits for status bar data)
    //
    _startLiveUpdates() {
        this._isActive = true;
        // Swap data now comes from status bar - no separate calculation needed
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
            <title>Swap Live Graph</title>
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

                .swap-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px 10px;
                    width: 100%;
                    height: calc(100vh - 40px);
                    align-content: stretch;
                    box-sizing: border-box;
                }

                .swap-chart {
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

                .swap-disabled {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                }

                canvas {
                    background-color: transparent !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                }
            </style>
        </head>
        <body>
            <div class="swap-grid" id="swapGrid">
                <!-- Swap chart will be dynamically generated here -->
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                //
                //  Chart.js configuration and setup
                //
                let swapChart = null; // Single swap chart
                let maxDataPoints = 120; // Keep 2 minutes of data at 1-second intervals
                let isSwapEnabled = false;
                // Always use VS Code's main chart foreground color
                function getMainChartColor() {
                    let computedStyles = getComputedStyle(document.body);
                    let color = computedStyles.getPropertyValue('--vscode-charts-foreground').trim();
                    if (!color) color = '#cccccc';
                    return color;
                }
                let timeLabels = [];

                //
                //  Initialize swap chart
                //
                function initChart() {
                    let swapGrid = document.getElementById('swapGrid');
                    swapGrid.innerHTML = ''; // Clear existing chart

                    if (!isSwapEnabled) {
                        // Show disabled message
                        let swapDiv = document.createElement('div');
                        swapDiv.className = 'swap-chart';

                        let disabledDiv = document.createElement('div');
                        disabledDiv.className = 'swap-disabled';
                        disabledDiv.textContent = 'Swap not configured or available';

                        swapDiv.appendChild(disabledDiv);
                        swapGrid.appendChild(swapDiv);
                        return;
                    }

                    // Get VS Code theme colors
                    let computedStyles = getComputedStyle(document.body);
                    let textColor = computedStyles.getPropertyValue('--vscode-descriptionForeground') ||
                                   computedStyles.getPropertyValue('--vscode-editor-foreground') || '#cccccc';
                    let gridColor = 'rgba(128, 128, 128, 0.2)';
                    let fontFamily = computedStyles.getPropertyValue('--vscode-editor-font-family') || 'monospace';
                    let mainColor = getMainChartColor();

                    // Create swap container
                    let swapDiv = document.createElement('div');
                    swapDiv.className = 'swap-chart';

                    // Create chart container
                    let chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';

                    // Create canvas
                    let canvas = document.createElement('canvas');
                    canvas.id = 'swap-chart';

                    // Assemble structure
                    chartContainer.appendChild(canvas);
                    swapDiv.appendChild(chartContainer);
                    swapGrid.appendChild(swapDiv);

                    // Create Chart.js instance for swap
                    let ctx = canvas.getContext('2d');
                    swapChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timeLabels,
                            datasets: [{
                                label: 'Swap Usage',
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
                //  Clear swap chart
                //
                function clearGraph() {
                    if (swapChart) {
                        swapChart.data.labels = [];
                        swapChart.data.datasets[0].data = [];
                        swapChart.update();
                    }
                    timeLabels = [];
                }

                //
                //  Update swap chart with new data
                //
                function updateChart(swapData) {
                    // Update swap enabled status
                    if (isSwapEnabled !== swapData.swap_enabled) {
                        isSwapEnabled = swapData.swap_enabled;
                        // Reinitialize chart if swap status changed
                        initChart();
                        if (!isSwapEnabled) {
                            return; // Don't process data if swap is disabled
                        }
                    }

                    if (!isSwapEnabled) {
                        return; // Don't process data if swap is disabled
                    }

                    if (!swapChart) {
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

                    // Update swap chart
                    if (swapChart) {
                        let dataset = swapChart.data.datasets[0];

                        // Add new data point
                        dataset.data.push(swapData.swap_usage);

                        // Remove old data points
                        if (dataset.data.length > maxDataPoints) {
                            dataset.data.shift();
                        }

                        // Update labels and chart
                        swapChart.data.labels = timeLabels;
                        swapChart.update();
                    }
                }

                //
                //  Handle messages from extension
                //
                window.addEventListener('message', event => {
                    let message = event.data;

                    switch (message.command) {
                        case 'updateSwapData':
                            updateChart(message.data);
                            break;
                    }
                });

                //
                //  Initialize chart when DOM is ready (chart created on first data)
                //
                document.addEventListener('DOMContentLoaded', function() {
                    // Chart will be initialized when first swap data arrives
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

module.exports = { SwapGraphViewProvider };
