let vscode = require('vscode');

//
//  RAM Graph view provider for live RAM usage visualization
//
class RamGraphViewProvider {

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
    //  Update RAM graph with data from status bar (shared calculation)
    //
    updateRamData(ram_usage_percent) {
        if (this._view && this._view.visible) {
            //
            //  Send RAM data to webview
            //
            this._view.webview.postMessage({
                command: 'updateRamData',
                data: {
                    timestamp: Date.now(),
                    ram_usage: ram_usage_percent
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
            <title>RAM Live Graph</title>
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

                .ram-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px 10px;
                    width: 100%;
                    height: calc(100vh - 40px);
                    align-content: start;
                    box-sizing: border-box;
                }

                .ram-chart {
                    background-color: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    position: relative;
                    height: 200px;
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
            <div class="ram-grid" id="ramGrid">
                <!-- RAM chart will be dynamically generated here -->
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                //
                //  Chart.js configuration and setup
                //
                let ramChart = null; // Single RAM chart
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
                //  Initialize RAM chart
                //
                function initChart() {
                    let ramGrid = document.getElementById('ramGrid');
                    ramGrid.innerHTML = ''; // Clear existing chart

                    // Get VS Code theme colors
                    let computedStyles = getComputedStyle(document.body);
                    let textColor = computedStyles.getPropertyValue('--vscode-descriptionForeground') ||
                                   computedStyles.getPropertyValue('--vscode-editor-foreground') || '#cccccc';
                    let gridColor = 'rgba(128, 128, 128, 0.2)';
                    let fontFamily = computedStyles.getPropertyValue('--vscode-editor-font-family') || 'monospace';
                    let mainColor = getMainChartColor();

                    // Create RAM container
                    let ramDiv = document.createElement('div');
                    ramDiv.className = 'ram-chart';

                    // Create chart container
                    let chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';

                    // Create canvas
                    let canvas = document.createElement('canvas');
                    canvas.id = 'ram-chart';

                    // Assemble structure
                    chartContainer.appendChild(canvas);
                    ramDiv.appendChild(chartContainer);
                    ramGrid.appendChild(ramDiv);

                    // Create Chart.js instance for RAM
                    let ctx = canvas.getContext('2d');
                    ramChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timeLabels,
                            datasets: [{
                                label: 'RAM Usage',
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
                //  Clear RAM chart
                //
                function clearGraph() {
                    if (ramChart) {
                        ramChart.data.labels = [];
                        ramChart.data.datasets[0].data = [];
                        ramChart.update();
                    }
                    timeLabels = [];
                }

                //
                //  Update RAM chart with new data
                //
                function updateChart(ramData) {
                    if (!ramChart) {
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

                    // Update RAM chart
                    if (ramChart) {
                        let dataset = ramChart.data.datasets[0];

                        // Add new data point
                        dataset.data.push(ramData.ram_usage);

                        // Remove old data points
                        if (dataset.data.length > maxDataPoints) {
                            dataset.data.shift();
                        }

                        // Update labels and chart
                        ramChart.data.labels = timeLabels;
                        ramChart.update();
                    }
                }

                //
                //  Handle messages from extension
                //
                window.addEventListener('message', event => {
                    let message = event.data;

                    switch (message.command) {
                        case 'updateRamData':
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

module.exports = { RamGraphViewProvider };
