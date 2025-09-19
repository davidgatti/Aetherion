let vscode = require('vscode');

//
//  CPU Graph view provider for live CPU usage visualization
//
class CpuGraphViewProvider {

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
    //  Update CPU graph with data from status bar (shared calculation)
    //
    updateCpuData(cpu_usage_percentages) {
        if (this._view && this._view.visible) {
            //
            //  Send CPU data to webview
            //
            this._view.webview.postMessage({
                command: 'updateCpuData',
                data: {
                    timestamp: Date.now(),
                    cpu_cores: cpu_usage_percentages
                }
            });
        }
    }

    //
    //  Start live CPU data updates (now just waits for status bar data)
    //
    _startLiveUpdates() {
        this._isActive = true;
        // CPU data now comes from status bar - no separate calculation needed
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
            <title>CPU Live Graph</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-sideBar-background);
                    margin: 0;
                    padding: 20px 20px 0 20px;
                    overflow: hidden;
                    height: 100vh;
                    box-sizing: border-box;
                }

                .cores-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
                    gap: 20px 10px;
                    width: 100%;
                    align-content: start;
                }

                .core-chart {
                    background-color: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    position: relative;
                    height: 63px;
                }

                .chart-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                canvas {
                    background-color: transparent !important;
                }
            </style>
        </head>
        <body>
            <div class="cores-grid" id="coresGrid">
                <!-- Core charts will be dynamically generated here -->
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                //
                //  Chart.js configuration and setup
                //
                let coreCharts = []; // Array to hold individual core charts
                let maxDataPoints = 120; // Keep 2 minutes of data at 1-second intervals
                // Always use VS Code's main chart foreground color for all cores
                function getMainChartColor() {
                    let computedStyles = getComputedStyle(document.body);
                    let color = computedStyles.getPropertyValue('--vscode-charts-foreground').trim();
                    if (!color) color = '#cccccc';
                    return color;
                }
                let timeLabels = [];

                //
                //  Initialize individual charts for each CPU core
                //
                function initCharts(coreCount) {
                    let coresGrid = document.getElementById('coresGrid');
                    coresGrid.innerHTML = ''; // Clear existing charts
                    coreCharts = []; // Reset charts array


                    // Get VS Code theme colors
                    let computedStyles = getComputedStyle(document.body);
                    let textColor = computedStyles.getPropertyValue('--vscode-descriptionForeground') ||
                                   computedStyles.getPropertyValue('--vscode-editor-foreground') || '#cccccc';
                    let gridColor = 'rgba(128, 128, 128, 0.2)';
                    let fontFamily = computedStyles.getPropertyValue('--vscode-editor-font-family') || 'monospace';
                    let mainColor = getMainChartColor();

                    // Create a chart for each CPU core
                    for (let coreIndex = 0; coreIndex < coreCount; coreIndex++) {
                        // Create core container
                        let coreDiv = document.createElement('div');
                        coreDiv.className = 'core-chart';

                        // Create chart container
                        let chartContainer = document.createElement('div');
                        chartContainer.className = 'chart-container';

                        // Create canvas
                        let canvas = document.createElement('canvas');
                        canvas.id = 'core-chart-' + coreIndex;

                        // Assemble structure
                        chartContainer.appendChild(canvas);
                        coreDiv.appendChild(chartContainer);
                        coresGrid.appendChild(coreDiv);

                        // Create Chart.js instance for this core
                        let ctx = canvas.getContext('2d');
                        let chart = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: timeLabels,
                                datasets: [{
                                    label: 'Core ' + (coreIndex + 1),
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
                                    padding: 2 // Minimal padding
                                },
                                animation: {
                                    duration: 0
                                }
                            }
                        });
                        coreCharts.push(chart);
                    }
                }

                //
                //  Clear all core charts
                //
                function clearGraph() {
                    coreCharts.forEach(chart => {
                        if (chart) {
                            chart.data.labels = [];
                            chart.data.datasets[0].data = [];
                            chart.update();
                        }
                    });
                    timeLabels = [];
                }

                //
                //  Update all core charts with new CPU data
                //
                function updateChart(cpuData) {
                    if (coreCharts.length === 0) {
                        // Initialize charts if not done yet
                        initCharts(cpuData.cpu_cores.length);
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

                    // Update each core chart
                    cpuData.cpu_cores.forEach((coreUsage, coreIndex) => {
                        if (coreCharts[coreIndex]) {
                            let chart = coreCharts[coreIndex];
                            let dataset = chart.data.datasets[0];

                            // Add new data point
                            dataset.data.push(coreUsage);

                            // Remove old data points
                            if (dataset.data.length > maxDataPoints) {
                                dataset.data.shift();
                            }

                            // Update labels and chart
                            chart.data.labels = timeLabels;
                            chart.update();
                        }
                    });
                }

                //
                //  Handle messages from extension
                //
                window.addEventListener('message', event => {
                    let message = event.data;

                    switch (message.command) {
                        case 'updateCpuData':
                            updateChart(message.data);
                            break;
                    }
                });

                //
                //  Initialize charts when DOM is ready (charts created on first data)
                //
                document.addEventListener('DOMContentLoaded', function() {
                    // Charts will be initialized when first CPU data arrives
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

module.exports = { CpuGraphViewProvider };
