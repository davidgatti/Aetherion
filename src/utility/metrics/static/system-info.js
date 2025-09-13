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

        //
        //  Get drive information (may be slow)
        //
        let drives = await StaticSystemInfo._getDriveInformation();

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
            drives,
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

    //
    //  Get information about all mounted drives/disks
    //
    static async _getDriveInformation() {

        let drives = [];

        try {

            switch (os.platform()) {

                case 'darwin':
                    drives = await StaticSystemInfo._getMacOSDrives();
                    break;

                case 'linux':
                    drives = await StaticSystemInfo._getLinuxDrives();
                    break;

                case 'win32':
                    drives = await StaticSystemInfo._getWindowsDrives();
                    break;

                default:
                    drives = await StaticSystemInfo._getFallbackDrives();
                    break;
            }

        } catch (error) {
            console.warn('Could not fetch drive information:', error.message);
            drives = [{ name: 'Unknown', size: 'Unknown', used: 'Unknown', available: 'Unknown', usage: 'Unknown' }];
        }

        return drives;
    }

    //
    //  Get macOS drive information using diskutil and df
    //
    static async _getMacOSDrives() {

        let drives = [];
        let localDriveData = { totalSize: 0, totalUsed: 0, totalAvailable: 0 };

        try {

            //
            //  Get all mounted volumes using df with a more reliable format
            //  Include both local disks and network mounts
            //
            let { stdout } = await execAsync('df -h');
            let lines = stdout.split('\n').slice(1); // Skip header

            for (let line of lines) {
                if (line.trim() === '') continue;

                //
                //  Split by multiple whitespace to handle the df output format properly
                //
                let columns = line.trim().split(/\s+/);
                if (columns.length >= 9) { // macOS df has more columns
                    let filesystem = columns[0];
                    let size = columns[1];
                    let used = columns[2];
                    let available = columns[3];
                    let usage = columns[4];
                    let mountPoint = columns[8]; // Last column is mount point

                    //
                    //  Handle local drives (combine them into one)
                    //
                    if (filesystem.startsWith('/dev/disk') && 
                        (mountPoint === '/' || mountPoint === '/System/Volumes/Data')) {
                        
                        //
                        //  Aggregate local drive data to show total system storage
                        //
                        let sizeBytes = StaticSystemInfo._parseSize(size);
                        let usedBytes = StaticSystemInfo._parseSize(used);
                        let availableBytes = StaticSystemInfo._parseSize(available);
                        
                        localDriveData.totalSize = Math.max(localDriveData.totalSize, sizeBytes);
                        localDriveData.totalUsed = Math.max(localDriveData.totalUsed, usedBytes);
                        localDriveData.totalAvailable = Math.max(localDriveData.totalAvailable, availableBytes);

                    //
                    //  Handle network drives
                    //
                    } else if (mountPoint.startsWith('/Volumes/') && !mountPoint.includes('VM') && !mountPoint.includes('Preboot')) {
                        
                        //
                        //  Detect network storage based on filesystem
                        //
                        let isNetworkDrive = filesystem.includes('@') || filesystem.startsWith('//') || 
                                           filesystem.includes('._smb.') || filesystem.includes('._afp.') ||
                                           filesystem.includes('nfs') || filesystem.includes('cifs');
                        
                        let driveLabel = isNetworkDrive ? 'Network Storage' : 'External Drive';
                        let driveName = mountPoint.replace('/Volumes/', '');
                        
                        drives.push({
                            name: `${driveName} (${driveLabel})`,
                            filesystem: filesystem,
                            mountPoint: mountPoint,
                            size: size,
                            used: used,
                            available: available,
                            usage: usage,
                            isNetwork: isNetworkDrive
                        });
                    }
                }
            }

            //
            //  Add combined local drive if we found local storage data
            //
            if (localDriveData.totalSize > 0) {
                let usagePercent = Math.round((localDriveData.totalUsed / localDriveData.totalSize) * 100);
                drives.unshift({ // Add at beginning
                    name: 'System Drive',
                    filesystem: 'Local Storage',
                    mountPoint: '/',
                    size: StaticSystemInfo._formatBytes(localDriveData.totalSize),
                    used: StaticSystemInfo._formatBytes(localDriveData.totalUsed),
                    available: StaticSystemInfo._formatBytes(localDriveData.totalAvailable),
                    usage: `${usagePercent}%`,
                    isNetwork: false
                });
            }

        } catch (error) {
            console.warn('Error fetching macOS drives:', error.message);
        }

        return drives.length > 0 ? drives : [{ name: 'System Drive', size: 'Unknown', used: 'Unknown', available: 'Unknown', usage: 'Unknown' }];
    }

    //
    //  Parse size string to bytes for aggregation (handles Ki, Mi, Gi, Ti suffixes)
    //
    static _parseSize(sizeStr) {
        if (!sizeStr || sizeStr === 'Unknown') return 0;
        
        let multipliers = { 'B': 1, 'K': 1024, 'M': 1024*1024, 'G': 1024*1024*1024, 'T': 1024*1024*1024*1024 };
        let match = sizeStr.match(/^([0-9.]+)([KMGT]?)[iB]?$/);
        
        if (match) {
            let value = parseFloat(match[1]);
            let unit = match[2] || 'B';
            return Math.round(value * (multipliers[unit] || 1));
        }
        
        return 0;
    }

    //
    //  Get Linux drive information using df
    //
    static async _getLinuxDrives() {

        let drives = [];

        try {

            //
            //  Get mounted filesystems with human-readable sizes
            //
            let { stdout } = await execAsync('df -h -x tmpfs -x devtmpfs -x squashfs');
            let lines = stdout.split('\n').slice(1); // Skip header

            for (let line of lines) {
                if (line.trim() === '') continue;

                let columns = line.trim().split(/\s+/);
                if (columns.length >= 6) {
                    let filesystem = columns[0];
                    let size = columns[1];
                    let used = columns[2];
                    let available = columns[3];
                    let usage = columns[4];
                    let mountPoint = columns[5];

                    //
                    //  Detect network drives and local drives
                    //
                    let isNetworkDrive = filesystem.includes(':') || filesystem.startsWith('//') || 
                                       filesystem.includes('nfs') || filesystem.includes('cifs') ||
                                       filesystem.includes('smb') || filesystem.includes('ftp');

                    //
                    //  Include physical disks, root filesystem, and network mounts
                    //
                    if (filesystem.startsWith('/dev/') || mountPoint === '/' || isNetworkDrive) {
                        
                        let driveName = 'Unknown Drive';
                        if (mountPoint === '/') {
                            driveName = 'Root Filesystem';
                        } else if (isNetworkDrive) {
                            driveName = `${mountPoint.split('/').pop() || 'Network Drive'} (Network Storage)`;
                        } else {
                            driveName = `Drive (${mountPoint})`;
                        }

                        drives.push({
                            name: driveName,
                            filesystem: filesystem,
                            mountPoint: mountPoint,
                            size: size,
                            used: used,
                            available: available,
                            usage: usage,
                            isNetwork: isNetworkDrive
                        });
                    }
                }
            }

        } catch (error) {
            console.warn('Error fetching Linux drives:', error.message);
        }

        return drives.length > 0 ? drives : [{ name: 'System Drive', size: 'Unknown', used: 'Unknown', available: 'Unknown', usage: 'Unknown' }];
    }

    //
    //  Get Windows drive information using wmic
    //
    static async _getWindowsDrives() {

        let drives = [];

        try {

            //
            //  Get drive information using wmic
            //
            let { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption,volumename /format:csv');
            let lines = stdout.split('\n').slice(2); // Skip header lines

            for (let line of lines) {
                if (line.trim() === '') continue;

                let columns = line.trim().split(',');
                if (columns.length >= 5) {
                    let caption = columns[1]; // Drive letter (C:, D:, etc.)
                    let freeSpace = parseInt(columns[2]);
                    let size = parseInt(columns[3]);
                    let volumeName = columns[4] || caption;

                    if (size > 0) {
                        let used = size - freeSpace;
                        let usagePercent = Math.round((used / size) * 100);

                        drives.push({
                            name: volumeName,
                            filesystem: caption,
                            mountPoint: caption,
                            size: StaticSystemInfo._formatBytes(size),
                            used: StaticSystemInfo._formatBytes(used),
                            available: StaticSystemInfo._formatBytes(freeSpace),
                            usage: `${usagePercent}%`
                        });
                    }
                }
            }

        } catch (error) {
            console.warn('Error fetching Windows drives:', error.message);
        }

        return drives.length > 0 ? drives : [{ name: 'System Drive', size: 'Unknown', used: 'Unknown', available: 'Unknown', usage: 'Unknown' }];
    }

    //
    //  Fallback drive information for unknown platforms
    //
    static async _getFallbackDrives() {
        return [{ name: 'Primary Drive', size: 'Unknown', used: 'Unknown', available: 'Unknown', usage: 'Unknown' }];
    }
}

module.exports = { StaticSystemInfo };
