let vscode = require('vscode');
let { exec } = require('child_process');
let { promisify } = require('util');

let execAsync = promisify(exec);

//
//  Track the current panel to prevent multiple instances
//
let currentPanel = undefined;

//
//  Analyze system load by sampling processes over time
//
async function analyzeSystemLoad() {
    let processAverages = new Map();

    //
    //  Take 3 samples over 6 seconds (every 2 seconds) to reduce CPU impact
    //
    for (let i = 0; i < 3; i++) {
        try {
            let { stdout } = await execAsync('ps -eo pid,user,%cpu,%mem,comm,cmd --no-headers');
            let lines = stdout.trim().split('\n');

            for (let line of lines) {
                let trimmed = line.trim();
                if (trimmed) {
                    let parts = trimmed.split(/\s+/);
                    if (parts.length >= 6) {
                        let pid = parts[0];
                        let user = parts[1];
                        let cpu = parseFloat(parts[2]);
                        let mem = parseFloat(parts[3]);
                        let comm = parts[4];
                        let cmd = parts.slice(5).join(' ');

                        //
                        //  Skip our own ps processes to avoid the observer effect
                        //
                        if (cmd.includes('ps -eo') || comm === 'ps') {
                            continue;
                        }

                        //
                        //  Track average CPU usage per process
                        //
                        if (!processAverages.has(pid)) {
                            processAverages.set(pid, {
                                pid: pid,
                                user: user,
                                comm: comm,
                                cmd: cmd,
                                cpuSamples: [],
                                memSamples: []
                            });
                        }

                        processAverages.get(pid).cpuSamples.push(cpu);
                        processAverages.get(pid).memSamples.push(mem);
                    }
                }
            }

            //
            //  Wait 2 seconds between samples (except for last sample)
            //
            if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.error('Error sampling processes:', error);
        }
    }

    //
    //  Calculate averages and prepare results
    //
    let analyzedProcesses = [];

    for (let [, data] of processAverages) {
        if (data.cpuSamples.length > 0) {
            let avgCpu = data.cpuSamples.reduce((a, b) => a + b, 0) / data.cpuSamples.length;
            let avgMem = data.memSamples.reduce((a, b) => a + b, 0) / data.memSamples.length;

            //
            //  Only include processes with meaningful CPU usage (> 0.1%)
            //
            if (avgCpu > 0.1) {
                analyzedProcesses.push({
                    pid: data.pid,
                    user: data.user,
                    cpu: avgCpu.toFixed(1),
                    memory: avgMem.toFixed(1),
                    name: data.comm,
                    fullCommand: data.cmd
                });
            }
        }
    }

    //
    //  Sort by CPU usage (highest first)
    //
    analyzedProcesses.sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu));

    return analyzedProcesses;
}
async function fetchProcessList() {
    try {
        //
        //  Execute ps command to get comprehensive process info including CPU and memory
        //
        let { stdout } = await execAsync('ps -eo pid,ppid,user,%cpu,%mem,comm,lstart,cmd --no-headers');

        //
        //  Parse the output into array of objects
        //
        let processes = [];
        let lines = stdout.trim().split('\n');

        for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed) {
                //
                //  Parse ps output: PID PPID USER %CPU %MEM COMM LSTART CMD...
                //  LSTART format: "Day Mon DD HH:MM:SS YYYY" (24 chars + space before CMD)
                //
                let parts = trimmed.split(/\s+/);
                if (parts.length >= 11) {
                    let pid = parts[0];
                    let ppid = parts[1];
                    let user = parts[2];
                    let cpu = parts[3];
                    let mem = parts[4];
                    let comm = parts[5];

                    //
                    //  LSTART is the next 5 parts: Day Mon DD HH:MM:SS YYYY
                    //
                    let lstart = parts.slice(6, 11).join(' ');

                    //
                    //  CMD is everything after LSTART
                    //
                    let cmd = parts.slice(11).join(' ');

                    //
                    //  Generate context without expensive working directory lookup for now
                    //  (we can add working directory later if needed for better context)
                    //
                    processes.push({
                        pid: pid,
                        ppid: ppid,
                        user: user,
                        cpu: cpu,
                        memory: mem,
                        name: comm,
                        runtime: lstart.trim(),
                        fullCommand: cmd,
                        workingDir: 'unknown' // Skip expensive lookup for now
                    });
                }
            }
        }

        return processes;

    } catch (error) {
        console.error('Error fetching process list:', error);
        return [];
    }
}

//
//  Command to open a new webview tab with Hello World content
//
async function open_full_tab() {

    try {

        //
        //  If panel already exists, just reveal/focus it
        //
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        //
        //  Create a webview panel (custom app-like tab)
        //
        currentPanel = vscode.window.createWebviewPanel(
            'processMonitorView', // View type identifier
            'Process Monitor', // Title shown in tab
            vscode.ViewColumn.One, // Open in first column
            {
                enableScripts: true, // Allow JavaScript
                retainContextWhenHidden: true // Keep content when tab is hidden
            }
        );

        //
        //  Set the webview HTML content
        //
        currentPanel.webview.html = getWebviewContent();

        //
        //  Handle messages from the webview
        //
        currentPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'loadProcesses':
                        //
                        //  Fetch process data and send it to webview
                        //
                        let processes = await fetchProcessList();
                        currentPanel.webview.postMessage({
                            command: 'processData',
                            processes: processes
                        });
                        break;
                    case 'analyzeLoad':
                        //
                        //  Analyze system load over 5 seconds
                        //
                        currentPanel.webview.postMessage({
                            command: 'analysisStarted'
                        });
                        let analyzedProcesses = await analyzeSystemLoad();
                        currentPanel.webview.postMessage({
                            command: 'analysisComplete',
                            processes: analyzedProcesses
                        });
                        break;
                }
            }
        );

        //
        //  Handle panel disposal (when user closes the tab)
        //
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });

    } catch (error) {

        //
        //  Log error for debugging
        //
        console.error('Error opening full tab:', error);
        vscode.window.showErrorMessage('Failed to open full tab');
    }
}

//
//  Generate HTML content for the webview (process table interface)
//
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Process List</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            .loading {
                text-align: center;
                padding: 40px;
                color: var(--vscode-descriptionForeground);
            }
            
            .controls {
                padding: 20px 0;
                text-align: center;
            }
            
            .analyze-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
            }
            
            .analyze-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .analyze-button:disabled {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                cursor: not-allowed;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-input-border);
            }
            
            th, td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-input-border);
            }
            
            /* Remove border from main process rows */
            tr.process-main td {
                border-bottom: none;
            }
            
            th {
                background-color: var(--vscode-sideBar-background);
                color: var(--vscode-textLink-foreground);
                font-weight: bold;
                position: sticky;
                top: 0;
            }
            
            tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            
            tr.process-main {
                border-bottom: none; /* Remove border between main and command row */
            }
            
            tr.process-main.even {
                background-color: var(--vscode-editor-background);
            }
            
            tr.process-main.odd {
                background-color: var(--vscode-sideBar-background);
            }
            
            tr.command-row {
                font-size: 0.9em;
            }
            
            tr.command-row.even {
                background-color: var(--vscode-editor-background);
            }
            
            tr.command-row.odd {
                background-color: var(--vscode-sideBar-background);
            }
            
            tr.command-row td {
                padding: 4px 12px 8px 20px; /* Extra left padding for indentation */
                border-bottom: 2px solid var(--vscode-input-border);
            }
            
            /* Grouped hover effect */
            tr.process-main.hover-group,
            tr.command-row.hover-group {
                background-color: var(--vscode-list-hoverBackground) !important;
            }
            
            .nr-column {
                width: 60px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
                text-align: right;
            }
            
            .pid-column {
                width: 80px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
            }
            
            .user-column {
                width: 100px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
            }
            
            .cpu-column {
                width: 60px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
                text-align: right;
            }
            
            .memory-column {
                width: 60px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
                text-align: right;
            }
            
            .runtime-column {
                width: 200px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
                text-align: left;
            }
            
            .context-column {
                font-family: monospace;
                color: var(--vscode-editor-foreground);
                min-width: 200px;
            }
            
            .name-column {
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <div class="controls">
            <button id="analyzeButton" class="analyze-button">Analyze Load (6 sec sample)</button>
        </div>
        <div id="loading" class="loading">Click "Analyze Load" to sample system processes...</div>
        <table id="processTable" style="display: none;">
            <thead>
                <tr>
                    <th class="nr-column">NR</th>
                    <th class="pid-column">PID</th>
                    <th class="user-column">User</th>
                    <th class="cpu-column">CPU%</th>
                    <th class="memory-column">MEM%</th>
                    <th class="context-column">Process</th>
                </tr>
            </thead>
            <tbody id="processTableBody">
            </tbody>
        </table>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            //
            //  Set up button click handler
            //
            window.addEventListener('DOMContentLoaded', function() {
                document.getElementById('analyzeButton').addEventListener('click', function() {
                    vscode.postMessage({
                        command: 'analyzeLoad'
                    });
                });
            });
            
            //
            //  Handle messages from extension
            //
            window.addEventListener('message', event => {
                let message = event.data;
                
                switch (message.command) {
                    case 'processData':
                        populateProcessTable(message.processes, 'Instant Snapshot');
                        break;
                    case 'analysisStarted':
                        let loading = document.getElementById('loading');
                        let button = document.getElementById('analyzeButton');
                        loading.textContent = 'Analyzing system load... (sampling for 6 seconds)';
                        loading.style.display = 'block';
                        button.disabled = true;
                        button.textContent = 'Analyzing...';
                        document.getElementById('processTable').style.display = 'none';
                        break;
                    case 'analysisComplete':
                        populateProcessTable(message.processes, 'Load Analysis Results (6s avg, sorted by CPU)');
                        document.getElementById('analyzeButton').disabled = false;
                        document.getElementById('analyzeButton').textContent = 'Analyze Load (6 sec sample)';
                        break;
                }
            });
            
            //
            //  Populate the process table with data
            //
            function populateProcessTable(processes, title) {
                let tableBody = document.getElementById('processTableBody');
                let loading = document.getElementById('loading');
                let table = document.getElementById('processTable');
                
                //
                //  Clear existing content
                //
                tableBody.innerHTML = '';
                
                //
                //  Add rows for each process - two rows per process with grouping
                //
                processes.forEach((process, index) => {
                    let groupClass = index % 2 === 0 ? 'even' : 'odd';
                    let processId = \`process-\${index}\`;
                    
                    //
                    //  First row: Basic process info
                    //
                    let mainRow = document.createElement('tr');
                    mainRow.className = \`process-main \${groupClass}\`;
                    mainRow.setAttribute('data-process-group', processId);
                    mainRow.innerHTML = \`
                        <td class="nr-column">\${index + 1}</td>
                        <td class="pid-column">\${process.pid}</td>
                        <td class="user-column">\${process.user}</td>
                        <td class="cpu-column">\${process.cpu}</td>
                        <td class="memory-column">\${process.memory}</td>
                        <td class="context-column">\${process.name}</td>
                    \`;
                    tableBody.appendChild(mainRow);
                    
                    //
                    //  Second row: Full command (spans most columns)
                    //
                    let commandRow = document.createElement('tr');
                    commandRow.className = \`command-row \${groupClass}\`;
                    commandRow.setAttribute('data-process-group', processId);
                    commandRow.innerHTML = \`
                        <td></td>
                        <td colspan="5" style="font-family: monospace; color: var(--vscode-textPreformat-foreground); word-break: break-all;">\${process.fullCommand}</td>
                    \`;
                    tableBody.appendChild(commandRow);
                });
                
                //
                //  Add grouped hover effects
                //
                addGroupedHoverEffects();
                
                //
                //  Hide loading, show table
                //
                loading.style.display = 'none';
                table.style.display = 'table';
            }
            
            //
            //  Add grouped hover effects to link process rows
            //
            function addGroupedHoverEffects() {
                let allRows = document.querySelectorAll('tr[data-process-group]');
                
                allRows.forEach(row => {
                    row.addEventListener('mouseenter', function() {
                        let groupId = this.getAttribute('data-process-group');
                        let groupRows = document.querySelectorAll(\`tr[data-process-group="\${groupId}"]\`);
                        groupRows.forEach(groupRow => {
                            groupRow.classList.add('hover-group');
                        });
                    });
                    
                    row.addEventListener('mouseleave', function() {
                        let groupId = this.getAttribute('data-process-group');
                        let groupRows = document.querySelectorAll(\`tr[data-process-group="\${groupId}"]\`);
                        groupRows.forEach(groupRow => {
                            groupRow.classList.remove('hover-group');
                        });
                    });
                });
            }
        </script>
    </body>
    </html>`;
}

module.exports = { open_full_tab };