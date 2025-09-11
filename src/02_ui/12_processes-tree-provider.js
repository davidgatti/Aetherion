let vscode = require('vscode');
let { exec } = require('child_process');
let os = require('os');

//
//	Tree view provider for system processes
//
class SystemProcessesTreeProvider {

    constructor() {
        //
        //	Event emitter for tree refresh
        //
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        //
        //	Cache process data
        //
        this.processData = [];
    }

    //
    //	Refresh the tree view
    //
    refresh() {
        this._onDidChangeTreeData.fire();
    }

    //
    //	Get tree item configuration
    //
    getTreeItem(element) {
        return element;
    }

    //
    //	Get children for tree nodes
    //
    async getChildren(element) {

        if (!element) {
            //
            //	Root level - show top processes
            //
            await this.updateProcessData();

            return this.processData.map(proc => new ProcessTreeItem(
                `${proc.name} (${proc.cpu}%)`,
                vscode.TreeItemCollapsibleState.None,
                'process',
                this.getCpuIcon(proc.cpu),
                proc.pid
            ));
        }

        return [];
    }

    //
    //	Update process data cache
    //
    async updateProcessData() {
        try {
            this.processData = await this.getTopProcesses();
        } catch (error) {
            console.error('Failed to get process data:', error);
            this.processData = [
                { name: 'Process data unavailable', cpu: 0, pid: 0 }
            ];
        }
    }

    //
    //	Get top CPU-consuming processes
    //
    getTopProcesses() {
        return new Promise((resolve) => {
            if (os.platform() === 'darwin') {
                //
                //	macOS - use ps command
                //
                exec('ps -eo pid,pcpu,comm --sort=-pcpu | head -6', (error, stdout) => {
                    if (error) {
                        resolve([{ name: 'Unable to get processes', cpu: 0, pid: 0 }]);
                        return;
                    }

                    let lines = stdout.trim().split('\n').slice(1); // Skip header
                    let processes = lines.map(line => {
                        let parts = line.trim().split(/\s+/);
                        return {
                            pid: parseInt(parts[0]) || 0,
                            cpu: parseFloat(parts[1]) || 0,
                            name: parts.slice(2).join(' ').split('/').pop() || 'Unknown'
                        };
                    }).slice(0, 5); // Top 5 processes

                    resolve(processes);
                });
            } else {
                //
                //	Linux/Other - simplified mock data
                //
                resolve([
                    { name: 'VS Code', cpu: 15.2, pid: 1234 },
                    { name: 'Chrome', cpu: 12.8, pid: 5678 },
                    { name: 'Node.js', cpu: 8.5, pid: 9012 },
                    { name: 'Terminal', cpu: 3.2, pid: 3456 },
                    { name: 'System', cpu: 2.1, pid: 7890 }
                ]);
            }
        });
    }

    //
    //	Get appropriate CPU icon based on usage
    //
    getCpuIcon(usage) {
        if (usage < 5) {return '🟢';} // Green - low usage
        if (usage < 15) {return '🟡';} // Yellow - moderate usage
        if (usage < 30) {return '🟠';} // Orange - high usage
        return '🔴'; // Red - very high usage
    }
}

//
//	Tree item class for process entries
//
class ProcessTreeItem extends vscode.TreeItem {

    constructor(label, collapsibleState, contextValue, iconPath = null, pid = 0) {
        super(label, collapsibleState);

        this.contextValue = contextValue;
        this.pid = pid;

        //
        //	Set icon if provided
        //
        if (iconPath) {
            this.iconPath = new vscode.ThemeIcon('symbol-misc');
            this.description = iconPath; // Show emoji in description
        }

        //
        //	Add tooltip
        //
        this.tooltip = `Process ID: ${pid}\nCPU Usage: ${this.getCpuFromLabel()}%`;
    }

    //
    //	Extract CPU usage from label for tooltip
    //
    getCpuFromLabel() {
        let match = this.label.match(/\((\d+\.?\d*)%\)/);
        return match ? match[1] : '0';
    }
}

module.exports = { SystemProcessesTreeProvider, ProcessTreeItem };
