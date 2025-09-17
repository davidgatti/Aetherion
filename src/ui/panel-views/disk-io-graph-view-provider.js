let vscode = require('vscode');

//
//  Disk I/O Mirror Graph view provider for live disk read/write visualization
//  Shows reads as positive values (going up) and writes as negative values (going down)
//
class DiskIOGraphViewProvider {

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
    //  Update disk I/O graph with data from status bar (shared calculation)
    //
    updateDiskIOData(read_tps, write_tps) {
        if (this._view && this._view.visible) {
            //
            //  Send disk I/O data to webview
            //
            this._view.webview.postMessage({
                command: 'updateDiskIOData',
                data: {
                    timestamp: Date.now(),
                    read_tps: read_tps,
                    write_tps: write_tps
                }
            });
        }
    }

    //
    //  Start live disk I/O data updates (now just waits for status bar data)
    //
    _startLiveUpdates() {
        this._isActive = true;
        // Disk I/O data now comes from status bar - no separate calculation needed
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
            <title>Disk I/O Mirror Graph</title>
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

                .disk-io-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px 10px;
                    width: 100%;
                    height: calc(100vh - 40px);
                    align-content: start;
                    box-sizing: border-box;
                }

                .disk-io-chart {
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

                .center-line {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background-color: var(--vscode-input-border);
                    opacity: 0.5;
                    pointer-events: none;
                    z-index: 1;
                }
            </style>
        </head>
        <body>
            <div class="disk-io-grid" id="diskIOGrid">
                <!-- Disk I/O mirror chart will be dynamically generated here -->
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                //
                //  Chart.js configuration and setup
                //
                let diskIOChart = null; // Single disk I/O mirror chart
                let maxDataPoints = 120; // Keep 2 minutes of data at 1-second intervals
                // Always use VS Code's main chart foreground color
                function getMainChartColor() {
                    let computedStyles = getComputedStyle(document.body);
                    let color = computedStyles.getPropertyValue('--vscode-charts-foreground').trim();
                    if (!color) color = '#cccccc';
                    return color;
                }
                // Use VS Code theme colors for reads and writes (both same gray)
                function getReadColor() {
                    return getMainChartColor(); // Use default theme color
                }
                function getWriteColor() {
                    return getMainChartColor(); // Use default theme color
                }
                let timeLabels = [];

                //
                //  Initialize disk I/O mirror chart
                //
                function initChart() {
                    let diskIOGrid = document.getElementById('diskIOGrid');
                    diskIOGrid.innerHTML = ''; // Clear existing chart

                    // Get VS Code theme colors
                    let computedStyles = getComputedStyle(document.body);
                    let readColor = getReadColor();
                    let writeColor = getWriteColor();

                    // Create disk I/O container
                    let diskIODiv = document.createElement('div');
                    diskIODiv.className = 'disk-io-chart';

                    // Create chart container
                    let chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';

                    // Create center line for zero reference
                    let centerLine = document.createElement('div');
                    centerLine.className = 'center-line';

                    // Create canvas
                    let canvas = document.createElement('canvas');
                    canvas.id = 'disk-io-chart';

                    // Assemble structure
                    chartContainer.appendChild(centerLine);
                    chartContainer.appendChild(canvas);
                    diskIODiv.appendChild(chartContainer);
                    diskIOGrid.appendChild(diskIODiv);

                    // Create Chart.js instance for disk I/O mirror
                    let ctx = canvas.getContext('2d');
                    diskIOChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timeLabels,
                            datasets: [{
                                label: 'Disk Reads',
                                data: [],
                                borderColor: readColor,
                                backgroundColor: readColor + '20',
                                fill: 'origin', // Fill to zero line
                                tension: 0.1,
                                borderWidth: 1.5,
                                pointRadius: 0,
                                pointHoverRadius: 0
                            }, {
                                label: 'Disk Writes',
                                data: [],
                                borderColor: writeColor,
                                backgroundColor: writeColor + '20',
                                fill: 'origin', // Fill to zero line
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
                                    display: false, // Hide X-axis
                                    grid: {
                                        display: false
                                    }
                                },
                                y: {
                                    display: false, // Hide Y-axis
                                    type: 'linear',
                                    position: 'left',
                                    min: -100, // Allow negative values for writes
                                    max: 100,  // Positive values for reads
                                    grid: {
                                        display: false,
                                        // Show zero line
                                        drawOnChartArea: true,
                                        color: function(context) {
                                            if (context.tick.value === 0) {
                                                return 'rgba(128, 128, 128, 0.3)';
                                            }
                                            return 'transparent';
                                        }
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
                //  Clear disk I/O chart
                //
                function clearGraph() {
                    if (diskIOChart) {
                        diskIOChart.data.labels = [];
                        diskIOChart.data.datasets[0].data = [];
                        diskIOChart.data.datasets[1].data = [];
                        diskIOChart.update();
                    }
                    timeLabels = [];
                }

                //
                //  Update disk I/O chart with new data
                //
                function updateChart(diskIOData) {
                    if (!diskIOChart) {
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

                    // Update disk I/O chart
                    if (diskIOChart) {
                        let readDataset = diskIOChart.data.datasets[0];
                        let writeDataset = diskIOChart.data.datasets[1];

                        // Scale TPS values to fit in 0-100 range for visualization
                        // Typical max TPS is around 1000, so scale by 0.1
                        let scaledReadTPS = Math.min(100, diskIOData.read_tps * 0.1);
                        let scaledWriteTPS = Math.min(100, diskIOData.write_tps * 0.1);

                        // Add new data points (reads positive, writes negative)
                        readDataset.data.push(scaledReadTPS);
                        writeDataset.data.push(-scaledWriteTPS); // Negative for mirror effect

                        // Remove old data points
                        if (readDataset.data.length > maxDataPoints) {
                            readDataset.data.shift();
                        }
                        if (writeDataset.data.length > maxDataPoints) {
                            writeDataset.data.shift();
                        }

                        // Update labels and chart
                        diskIOChart.data.labels = timeLabels;
                        diskIOChart.update();
                    }
                }

                //
                //  Handle messages from extension
                //
                window.addEventListener('message', event => {
                    let message = event.data;

                    switch (message.command) {
                        case 'updateDiskIOData':
                            updateChart(message.data);
                            break;
                    }
                });

                //
                //  Initialize chart when DOM is ready (chart created on first data)
                //
                document.addEventListener('DOMContentLoaded', function() {
                    // Chart will be initialized when first disk I/O data arrives
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

module.exports = { DiskIOGraphViewProvider };
