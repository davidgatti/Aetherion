let vscode = require('vscode');
let os = require('os');
let calculate_cpu_usage = require('./01_calculate_cpu_usage.js');
let calculate_ram_usage = require('./03_calculate_ram_usage.js');

//
//	Tree view provider for system monitoring in sidebar
//
class SystemMonitorTreeProvider {

    constructor() {
        //
        //	Event emitter for tree refresh
        //
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        //
        //	Cache system data
        //
        this.systemData = null;
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

        //
        //	Update system data
        //
        await this.updateSystemData();

        if (!element) {
            //
            //	Root level - show main categories
            //
            return [
                new SystemTreeItem('CPU Monitor', vscode.TreeItemCollapsibleState.Expanded, 'cpu'),
                new SystemTreeItem('Memory Monitor', vscode.TreeItemCollapsibleState.Expanded, 'memory'),
                new SystemTreeItem('System Info', vscode.TreeItemCollapsibleState.Expanded, 'system')
            ];
        }

        if (element.contextValue === 'cpu') {
            //
            //	CPU section - show per-core usage
            //
            let cpu_items = [];

            //
            //	Add overall CPU usage
            //
            let total_usage = this.systemData.cpu_usage.reduce((sum, usage) => sum + usage, 0);
            let avg_cpu = total_usage / this.systemData.cpu_usage.length;
            cpu_items.push(new SystemTreeItem(
                `Overall: ${avg_cpu.toFixed(1)}%`,
                vscode.TreeItemCollapsibleState.None,
                'cpu-overall',
                this.getCpuIcon(avg_cpu)
            ));

            //
            //	Add per-core usage
            //
            this.systemData.cpu_usage.forEach((usage, index) => {
                cpu_items.push(new SystemTreeItem(
                    `Core ${index + 1}: ${usage.toFixed(1)}%`,
                    vscode.TreeItemCollapsibleState.None,
                    'cpu-core',
                    this.getCpuIcon(usage)
                ));
            });

            return cpu_items;
        }

        if (element.contextValue === 'memory') {
            //
            //	Memory section - show detailed breakdown
            //
            let ram = this.systemData.ram_usage;
            let used_gb = ram.total_gb - ram.available_gb;

            return [
                new SystemTreeItem(
                    `Usage: ${ram.usage_percent.toFixed(1)}%`,
                    vscode.TreeItemCollapsibleState.None,
                    'memory-usage',
                    this.getMemoryIcon(ram.usage_percent)
                ),
                new SystemTreeItem(
                    `Used: ${used_gb.toFixed(1)}GB`,
                    vscode.TreeItemCollapsibleState.None,
                    'memory-used',
                    '📊'
                ),
                new SystemTreeItem(
                    `Available: ${ram.available_gb.toFixed(1)}GB`,
                    vscode.TreeItemCollapsibleState.None,
                    'memory-available',
                    '💾'
                ),
                new SystemTreeItem(
                    `Total: ${ram.total_gb.toFixed(1)}GB`,
                    vscode.TreeItemCollapsibleState.None,
                    'memory-total',
                    '🗄️'
                )
            ];
        }

        if (element.contextValue === 'system') {
            //
            //	System section - show general info
            //
            let cpus = os.cpus();
            return [
                new SystemTreeItem(
                    `Platform: ${os.platform()}`,
                    vscode.TreeItemCollapsibleState.None,
                    'system-platform',
                    '🖥️'
                ),
                new SystemTreeItem(
                    `Architecture: ${os.arch()}`,
                    vscode.TreeItemCollapsibleState.None,
                    'system-arch',
                    '⚙️'
                ),
                new SystemTreeItem(
                    `CPU Cores: ${cpus.length}`,
                    vscode.TreeItemCollapsibleState.None,
                    'system-cores',
                    '🔧'
                ),
                new SystemTreeItem(
                    `CPU Model: ${cpus[0].model.split(' ').slice(0, 3).join(' ')}...`,
                    vscode.TreeItemCollapsibleState.None,
                    'system-model',
                    '💻'
                ),
                new SystemTreeItem(
                    `Uptime: ${this.formatUptime(os.uptime())}`,
                    vscode.TreeItemCollapsibleState.None,
                    'system-uptime',
                    '⏱️'
                )
            ];
        }

        return [];
    }

    //
    //	Update system data cache
    //
    async updateSystemData() {
        try {
            this.systemData = {
                cpu_usage: await calculate_cpu_usage(),
                ram_usage: await calculate_ram_usage()
            };
        } catch (error) {
            console.error('Failed to update system data:', error);
        }
    }

    //
    //	Get appropriate CPU icon based on usage
    //
    getCpuIcon(usage) {
        if (usage < 25) {return '🟢';} // Green - low usage
        if (usage < 50) {return '🟡';} // Yellow - moderate usage
        if (usage < 75) {return '🟠';} // Orange - high usage
        return '🔴'; // Red - very high usage
    }

    //
    //	Get appropriate memory icon based on usage
    //
    getMemoryIcon(usage) {
        if (usage < 50) {return '🟢';} // Green - low usage
        if (usage < 70) {return '🟡';} // Yellow - moderate usage
        if (usage < 85) {return '🟠';} // Orange - high usage
        return '🔴'; // Red - very high usage
    }

    //
    //	Format uptime in human-readable format
    //
    formatUptime(seconds) {
        let days = Math.floor(seconds / 86400);
        let hours = Math.floor((seconds % 86400) / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

//
//	Tree item class for system monitor entries
//
class SystemTreeItem extends vscode.TreeItem {

    constructor(label, collapsibleState, contextValue, iconPath = null) {
        super(label, collapsibleState);

        this.contextValue = contextValue;

        //
        //	Set icon if provided
        //
        if (iconPath) {
            this.iconPath = new vscode.ThemeIcon('symbol-misc');
            this.description = iconPath; // Show emoji in description
        }

        //
        //	Add tooltip with additional info
        //
        this.tooltip = this.getTooltip();

        //
        //	Make some items clickable
        //
        if (contextValue.startsWith('cpu-') || contextValue.startsWith('memory-')) {
            this.command = {
                command: 'sysmag.showItemDetails',
                title: 'Show Details',
                arguments: [this]
            };
        }
    }

    //
    //	Get tooltip text for the item
    //
    getTooltip() {
        switch (this.contextValue) {
            case 'cpu':
                return 'CPU usage per core';
            case 'memory':
                return 'Memory usage breakdown';
            case 'system':
                return 'System information';
            case 'cpu-overall':
                return 'Average CPU usage across all cores';
            case 'cpu-core':
                return 'Individual CPU core usage';
            case 'memory-usage':
                return 'Total memory usage percentage';
            case 'memory-used':
                return 'Currently used memory';
            case 'memory-available':
                return 'Available memory for applications';
            case 'memory-total':
                return 'Total installed memory';
            default:
                return this.label;
        }
    }
}

module.exports = { SystemMonitorTreeProvider, SystemTreeItem };
