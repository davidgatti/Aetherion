let vscode = require('vscode');
let { exec } = require('child_process');
let { promisify } = require('util');

let execAsync = promisify(exec);

//
//  Track the current panel to prevent multiple instances
//
let currentPanel = undefined;

//
//  Generic heuristic-based context detection for processes
//
function detectProcessContext(fullCommand, processName, workingDir) {
    
    //
    //  Extract script filename from command (any language)
    //
    let scriptMatch = fullCommand.match(/([^\/\s]*\.(js|py|sh|jar|exe|rb|php|go|cpp|java))(\s|$)/i);
    if (scriptMatch) {
        let scriptName = scriptMatch[1];
        let projectMatch = workingDir.match(/\/([^\/]+)$/);
        if (projectMatch && projectMatch[1] !== 'home' && projectMatch[1] !== processName) {
            return `${processName}: ${scriptName} (${projectMatch[1]})`;
        }
        return `${processName}: ${scriptName}`;
    }
    
    //
    //  Extract project context from working directory
    //
    if (workingDir && workingDir !== 'unknown') {
        let projectMatch = workingDir.match(/\/([^\/]+)$/);
        if (projectMatch && projectMatch[1] !== 'home' && projectMatch[1] !== processName) {
            return `${processName} (${projectMatch[1]})`;
        }
    }
    
    //
    //  Detect server processes by port or server keywords
    //
    if (fullCommand.includes('--port=') || fullCommand.includes('-p ')) {
        let portMatch = fullCommand.match(/(?:--port=|-p\s+)(\d+)/);
        if (portMatch) {
            return `${processName} Server :${portMatch[1]}`;
        }
        return `${processName} Server`;
    }
    
    //
    //  Detect common process types by arguments
    //
    if (fullCommand.toLowerCase().includes('server')) return `${processName} Server`;
    if (fullCommand.toLowerCase().includes('build')) return `${processName} Build Tool`;
    if (fullCommand.toLowerCase().includes('test')) return `${processName} Test Runner`;
    if (fullCommand.toLowerCase().includes('webpack')) return `${processName} (Webpack)`;
    if (fullCommand.toLowerCase().includes('jest')) return `${processName} (Jest)`;
    
    //
    //  Extract meaningful directory path context
    //
    let pathMatches = fullCommand.match(/\/([^\/\s]{3,15})\//g);
    if (pathMatches && pathMatches.length > 0) {
        let meaningfulPath = pathMatches[pathMatches.length - 1].replace(/\//g, '');
        if (meaningfulPath !== processName && meaningfulPath !== 'bin' && meaningfulPath !== 'usr') {
            return `${processName} (${meaningfulPath})`;
        }
    }
    
    //
    //  Detect system processes
    //
    if (fullCommand.startsWith('/usr/lib/systemd/')) return 'System Service';
    if (fullCommand.includes('gnome-')) return 'GNOME Desktop';
    if (fullCommand.includes('/sbin/')) return 'System Binary';
    
    //
    //  Fallback to original process name
    //
    return processName;
}

//
//  Fetch process list from system
//
async function fetchProcessList() {
    try {
        //
        //  Execute ps command to get comprehensive process info
        //
        let { stdout } = await execAsync('ps -eo pid,ppid,user,comm,etime,cmd --no-headers');
        
        //
        //  Parse the output into array of objects
        //
        let processes = [];
        let lines = stdout.trim().split('\n');
        
        for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed) {
                //
                //  Parse ps output: PID PPID USER COMM ETIME CMD...
                //
                let match = trimmed.match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+([^\s]+)\s+(.*)$/);
                if (match) {
                    let [, pid, ppid, user, comm, etime, cmd] = match;
                    
                    //
                    //  Generate context without expensive working directory lookup for now
                    //  (we can add working directory later if needed for better context)
                    //
                    processes.push({
                        pid: pid,
                        ppid: ppid,
                        user: user,
                        name: comm,
                        runtime: etime,
                        fullCommand: cmd,
                        workingDir: 'unknown', // Skip expensive lookup for now
                        context: detectProcessContext(cmd, comm, 'unknown')
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
            
            .runtime-column {
                width: 90px;
                font-family: monospace;
                color: var(--vscode-textPreformat-foreground);
                text-align: right;
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
                    <th class="runtime-column">Runtime</th>
                    <th class="context-column">Context</th>
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
                        <td class="runtime-column">\${process.runtime}</td>
                        <td class="context-column">\${process.context}</td>
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