let os = require('os');
let { exec } = require('child_process');
let { promisify } = require('util');

let execAsync = promisify(exec);

//
//  Static system information utilities (not for real-time updates)
//
class StaticSystemInfo {

    //
    //  Get comprehensive system information (expensive operation)
    //
    static async getSystemInformation() {

        //
        //  Basic OS information (fast)
        //
        let platform = StaticSystemInfo._getPlatformName(os.platform());
        let release = os.release();
        let architecture = os.arch();
        let hostname = os.hostname();
        let uptime = StaticSystemInfo._formatUptime(os.uptime());

        //
        //  CPU information (fast)
        //
        let cpus = os.cpus();
        let cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
        let cpuCores = cpus.length;
        let cpuSpeed = cpus.length > 0 ? `${(cpus[0].speed / 1000).toFixed(2)} GHz` : 'Unknown';

        //
        //  Memory information (fast)
        //
        let totalMemory = StaticSystemInfo._formatBytes(os.totalmem());
        let freeMemory = StaticSystemInfo._formatBytes(os.freemem());

        //
        //  Additional system information (potentially slower)
        //
        let additionalInfo = await StaticSystemInfo._getAdditionalSystemInfo();

        return {
            platform,
            release,
            architecture,
            hostname,
            cpuModel,
            cpuCores,
            cpuSpeed,
            totalMemory,
            freeMemory,
            uptime,
            ...additionalInfo
        };
    }

    //
    //  Get additional system information that might be slower to fetch
    //
    static async _getAdditionalSystemInfo() {

        let systemInfo = {};

        try {

            //
            //  Platform-specific additional information
            //
            switch (os.platform()) {

                case 'darwin':
                    systemInfo = await StaticSystemInfo._getMacOSInfo();
                    break;

                case 'linux':
                    systemInfo = await StaticSystemInfo._getLinuxInfo();
                    break;

                case 'win32':
                    systemInfo = await StaticSystemInfo._getWindowsInfo();
                    break;

                default:
                    systemInfo.osVersion = 'Unknown';
                    break;
            }

        } catch (error) {

            //
            //  Graceful fallback for additional info failures
            //
            console.warn('Could not fetch additional system info:', error.message);
            systemInfo.osVersion = 'Unknown';
        }

        return systemInfo;
    }

    //
    //  Get macOS specific information
    //
    static async _getMacOSInfo() {

        try {
            let { stdout } = await execAsync('sw_vers -productVersion');
            return {
                osVersion: `macOS ${stdout.trim()}`
            };
        } catch (error) {
            return {
                osVersion: 'macOS (version unknown)'
            };
        }
    }

    //
    //  Get Linux specific information
    //
    static async _getLinuxInfo() {

        try {

            //
            //  Try to get Linux distribution info
            //
            try {
                let { stdout } = await execAsync('lsb_release -d');
                let description = stdout.split(':')[1].trim();
                return {
                    osVersion: description
                };
            } catch (lsb_error) {

                //
                //  Fallback to /etc/os-release
                //
                let { stdout } = await execAsync('cat /etc/os-release | grep PRETTY_NAME');
                let prettyName = stdout.split('=')[1].replace(/"/g, '').trim();
                return {
                    osVersion: prettyName
                };
            }

        } catch (error) {
            return {
                osVersion: 'Linux (distribution unknown)'
            };
        }
    }

    //
    //  Get Windows specific information
    //
    static async _getWindowsInfo() {

        try {
            let { stdout } = await execAsync('wmic os get Caption /value');
            let caption = stdout.split('=')[1].trim();
            return {
                osVersion: caption
            };
        } catch (error) {
            return {
                osVersion: 'Windows (version unknown)'
            };
        }
    }

    //
    //  Get friendly platform name
    //
    static _getPlatformName(platform) {
        switch (platform) {
            case 'darwin': return 'macOS';
            case 'win32': return 'Windows';
            case 'linux': return 'Linux';
            case 'freebsd': return 'FreeBSD';
            case 'openbsd': return 'OpenBSD';
            case 'sunos': return 'Solaris';
            default: return platform;
        }
    }

    //
    //  Format bytes to human readable
    //
    static _formatBytes(bytes) {
        if (bytes === 0) {return '0 Bytes';}
        let k = 1024;
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        let i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    //
    //  Format uptime to human readable
    //
    static _formatUptime(seconds) {
        let days = Math.floor(seconds / (24 * 60 * 60));
        let hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        let minutes = Math.floor((seconds % (60 * 60)) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}

module.exports = { StaticSystemInfo };
