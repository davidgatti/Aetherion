let vscode = require('vscode');
let os = require('os');

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
            //	Root level - show only system info
            //
            return [
                new SystemTreeItem('System Info', vscode.TreeItemCollapsibleState.Expanded, 'system')
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
        //
        //	Since we're only showing system info now, no need to update CPU/RAM data
        //
        try {
            //
            //	System info is static, no need to cache anything for tree view
            //
            this.systemData = {
                last_updated: Date.now()
            };
        } catch (error) {
            console.error('Failed to update system data:', error);
        }
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
        //	Make system items clickable for details
        //
        if (contextValue.startsWith('system-')) {
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
            case 'system':
                return 'System information';
            case 'system-platform':
                return 'Operating system platform';
            case 'system-arch':
                return 'System architecture';
            case 'system-cores':
                return 'Number of CPU cores';
            case 'system-model':
                return 'CPU model information';
            case 'system-uptime':
                return 'System uptime';
            default:
                return this.label;
        }
    }
}

module.exports = { SystemMonitorTreeProvider, SystemTreeItem };
