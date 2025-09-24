let vscode = require('vscode');
let { exec } = require('child_process');
let { promisify } = require('util');

let execAsync = promisify(exec);

//
//  Track the current panel to prevent multiple instances
//
let currentPanel = undefined;

//
//  Fetch process list from system
//
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
        <div id="loading" class="loading">Loading processes...</div>
        <table id="processTable" style="display: none;">
            <thead>
                <tr>
                    <th class="nr-column">NR</th>
                    <th class="pid-column">PID</th>
                    <th class="user-column">User</th>
                    <th class="cpu-column">CPU%</th>
                    <th class="memory-column">MEM%</th>
                    <th class="runtime-column">Started</th>
                    <th class="context-column">Command</th>
                </tr>
            </thead>
            <tbody id="processTableBody">
            </tbody>
        </table>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            //
            //  Request process data when page loads
            //
            window.addEventListener('DOMContentLoaded', function() {
                vscode.postMessage({
                    command: 'loadProcesses'
                });
            });
            
            //
            //  Handle messages from extension
            //
            window.addEventListener('message', event => {
                let message = event.data;
                
                switch (message.command) {
                    case 'processData':
                        populateProcessTable(message.processes);
                        break;
                }
            });
            
            //
            //  Populate the process table with data
            //
            function populateProcessTable(processes) {
                let tableBody = document.getElementById('processTableBody');
                let loading = document.getElementById('loading');
                let table = document.getElementById('processTable');
                
                //
                //  Clear existing content
                //
                tableBody.innerHTML = '';
                
                //
                //  Add rows for each process with sequential numbering
                //
                processes.forEach((process, index) => {
                    let row = document.createElement('tr');
                    row.innerHTML = \`
                        <td class="nr-column">\${index + 1}</td>
                        <td class="pid-column">\${process.pid}</td>
                        <td class="user-column">\${process.user}</td>
                        <td class="cpu-column">\${process.cpu}</td>
                        <td class="memory-column">\${process.memory}</td>
                        <td class="runtime-column">\${process.runtime}</td>
                        <td class="context-column">\${process.fullCommand}</td>
                    \`;
                    tableBody.appendChild(row);
                });
                
                //
                //  Hide loading, show table
                //
                loading.style.display = 'none';
                table.style.display = 'table';
            }
        </script>
    </body>
    </html>`;
}

module.exports = { open_full_tab };