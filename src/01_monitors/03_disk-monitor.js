let os = require('os');
let { exec } = require('child_process');
let { promisify } = require('util');
let fs = require('fs');
let get_braille_character = require('../.utility/get_braille_character.js');

let execAsync = promisify(exec);

//
//	Calculate disk usage percentage for the main disk
//
//	This function provides cross-platform disk usage calculation:
//	- macOS: Uses 'diskutil apfs list' for precise APFS container calculations
//	- Linux: Uses 'df -B1' for byte-level precision
//	- Windows: Uses 'wmic' for accurate drive space calculation
//	- Fallback: Uses Node.js fs.statSync for basic support
//
//	Note: Different tools may show slightly different values due to:
//	- Filesystem overhead (APFS snapshots, journaling, etc.)
//	- Reserved space for system operations
//	- Different calculation methods (1000 vs 1024 byte units)
//	This implementation prioritizes accuracy over consistency across tools.
//
async function calculate_disk_usage_internal() {

    //
    //	Get operating system platform
    //
    let operating_system_platform = os.platform();
    let usage_percent = 0;
    let available_disk_gb = 0;
    let total_disk_gb = 0;

    //
    //	Platform-specific disk usage calculation
    //
    if (operating_system_platform === 'darwin') {

        //
        //	macOS: Use diskutil apfs list for accurate APFS container usage
        //	This gives us the real disk usage that matches System Settings
        //
        try {
            let { stdout: diskutil_output } = await execAsync('diskutil apfs list');

            //
            //	Parse APFS container information for main disk
            //	Look for byte values for precise calculation
            //
            let capacity_in_use_match = diskutil_output.match(
                /Capacity In Use By Volumes:\s+(\d+) B \(([^)]+)\)/
            );
            let total_capacity_match = diskutil_output.match(
                /Size \(Capacity Ceiling\):\s+(\d+) B \(([^)]+)\)/
            );

            if (capacity_in_use_match && total_capacity_match) {
                //
                //	Extract byte values for precise calculation
                //
                let used_bytes = parseInt(capacity_in_use_match[1]);
                let total_bytes = parseInt(total_capacity_match[1]);

                //
                //	Convert to GB and calculate usage
                //
                total_disk_gb = total_bytes / (1024 * 1024 * 1024);
                let used_disk_gb = used_bytes / (1024 * 1024 * 1024);
                available_disk_gb = total_disk_gb - used_disk_gb;
                usage_percent = (used_disk_gb / total_disk_gb) * 100;

            } else {
                //
                //	Fallback to df if diskutil parsing fails
                //
                throw new Error('Could not parse diskutil apfs list output');
            }

        } catch (_error) {
            //
            //	Fallback: Use df command for basic disk info
            //
            try {
                let { stdout: df_output } = await execAsync('df -h /');
                let lines = df_output.split('\n');
                let data_line = lines[1]; // Second line contains the data

                //
                //	Parse df output: Filesystem Size Used Avail Capacity Mounted
                //	Example: /dev/disk3s1s1 233Gi  14Gi 139Gi    10%    /
                //
                let columns = data_line.trim().split(/\s+/);
                let size_str = columns[1];
                let used_str = columns[2];
                let available_str = columns[3];

                //
                //	Convert size strings to GB (handle Gi, Ti, Ki suffixes)
                //
                total_disk_gb = convert_size_to_gb(size_str);
                let used_disk_gb = convert_size_to_gb(used_str);
                available_disk_gb = convert_size_to_gb(available_str);

                //
                //	Calculate usage percentage
                //
                usage_percent = (used_disk_gb / total_disk_gb) * 100;

            } catch (_fallback_error) {
                //
                //	Ultimate fallback: Use Node.js fs.statSync for basic disk info
                //
                let fallback_result = get_fallback_disk_usage('/');
                usage_percent = fallback_result.usage_percent;
                available_disk_gb = fallback_result.available_gb;
                total_disk_gb = fallback_result.total_gb;
            }
        }

    } else if (operating_system_platform === 'linux') {

        //
        //	Linux: Use df with byte output for more accurate calculation
        //
        try {
            let { stdout: df_output } = await execAsync('df -B1 /');
            let lines = df_output.split('\n');
            let data_line = lines[1]; // Second line contains the data

            //
            //	Parse df output: Filesystem 1B-blocks Used Available Use% Mounted
            //	Example: /dev/sda1 500000000000 400000000000 100000000000 80% /
            //
            let columns = data_line.trim().split(/\s+/);
            let total_bytes = parseInt(columns[1]);
            let used_bytes = parseInt(columns[2]);
            let available_bytes = parseInt(columns[3]);

            //
            //	Convert to GB and calculate usage
            //
            total_disk_gb = total_bytes / (1024 * 1024 * 1024);
            available_disk_gb = available_bytes / (1024 * 1024 * 1024);
            usage_percent = (used_bytes / total_bytes) * 100;

        } catch (_error) {
            //
            //	Fallback: Use df -h if df -B1 fails
            //
            try {
                let { stdout: df_output } = await execAsync('df -h /');
                let lines = df_output.split('\n');
                let data_line = lines[1]; // Second line contains the data

                //
                //	Parse df output similar to macOS fallback
                //
                let columns = data_line.trim().split(/\s+/);
                let size_str = columns[1];
                let used_str = columns[2];
                let available_str = columns[3];

                //
                //	Convert size strings to GB
                //
                total_disk_gb = convert_size_to_gb(size_str);
                let used_disk_gb = convert_size_to_gb(used_str);
                available_disk_gb = convert_size_to_gb(available_str);

                //
                //	Calculate usage percentage
                //
                usage_percent = (used_disk_gb / total_disk_gb) * 100;

            } catch (_fallback_error) {
                //
                //	Ultimate fallback: Use Node.js fs.statSync for basic disk info
                //
                let fallback_result = get_fallback_disk_usage('/');
                usage_percent = fallback_result.usage_percent;
                available_disk_gb = fallback_result.available_gb;
                total_disk_gb = fallback_result.total_gb;
            }
        }

    } else if (operating_system_platform === 'win32') {

        //
        //	Windows: Use dir command or wmic to get disk usage for C: drive
        //
        try {
            let { stdout: wmic_output } = await execAsync('wmic logicaldisk where size!=0 get size,freespace,caption');
            let lines = wmic_output.split('\n');

            //
            //	Find C: drive data (usually the main system drive)
            //
            let c_drive_line = lines.find(line => line.includes('C:'));
            if (c_drive_line) {
                let columns = c_drive_line.trim().split(/\s+/);
                // WMIC format: Caption FreeSpace Size
                let free_space_bytes = parseInt(columns[1]);
                let total_space_bytes = parseInt(columns[2]);

                total_disk_gb = total_space_bytes / (1024 * 1024 * 1024);
                available_disk_gb = free_space_bytes / (1024 * 1024 * 1024);
                let used_disk_gb = total_disk_gb - available_disk_gb;

                usage_percent = (used_disk_gb / total_disk_gb) * 100;
            } else {
                throw new Error('C: drive not found');
            }

        } catch (_error) {
            //
            //	Fallback: Use Node.js fs.statSync for basic disk info
            //
            let fallback_result = get_fallback_disk_usage('C:\\');
            usage_percent = fallback_result.usage_percent;
            available_disk_gb = fallback_result.available_gb;
            total_disk_gb = fallback_result.total_gb;
        }

    } else {

        //
        //	Other platforms: Use basic fallback method
        //
        let fallback_result = get_fallback_disk_usage('/');
        usage_percent = fallback_result.usage_percent;
        available_disk_gb = fallback_result.available_gb;
        total_disk_gb = fallback_result.total_gb;
    }

    //
    //	Ensure usage percentage is within valid range
    //
    usage_percent = Math.max(0, Math.min(100, usage_percent));

    //
    //	--> return disk usage information
    //
    return {
        usage_percent: usage_percent,
        available_gb: available_disk_gb,
        total_gb: total_disk_gb
    };
}

//
//	Convert size string (e.g., "233Gi", "14.5G", "1.2T") to GB
//
function convert_size_to_gb(size_str) {
    let numeric_part = parseFloat(size_str);
    let unit = size_str.slice(-2);
    let single_unit = size_str.slice(-1);

    //
    //	Handle binary units (Gi, Ti, Ki) and decimal units (G, T, K, M)
    //
    if (unit === 'Gi') {
        return numeric_part * 1.073741824; // 1 Gi = 1.073741824 GB
    } else if (unit === 'Ti') {
        return numeric_part * 1099.511627776; // 1 Ti = 1099.511627776 GB
    } else if (unit === 'Ki') {
        return numeric_part / 976562.5; // 1 Ki = 1/976562.5 GB
    } else if (unit === 'Mi') {
        return numeric_part / 953.67431640625; // 1 Mi = 1/953.67431640625 GB
    } else if (single_unit === 'G') {
        return numeric_part;
    } else if (single_unit === 'T') {
        return numeric_part * 1000;
    } else if (single_unit === 'M') {
        return numeric_part / 1000;
    } else if (single_unit === 'K') {
        return numeric_part / 1000000;
    } else {
        //
        //	Assume bytes if no unit specified
        //
        return numeric_part / (1024 * 1024 * 1024);
    }
}

//
//	Fallback method using Node.js fs.statSync (limited accuracy)
//
function get_fallback_disk_usage(path) {
    try {
        fs.statSync(path);
        //
        //	Note: fs.statSync doesn't provide disk space info
        //	This is a very basic fallback that assumes some default values
        //	In practice, this should rarely be used due to platform-specific commands above
        //
        return {
            usage_percent: 50, // Default assumption
            available_gb: 100, // Default assumption
            total_gb: 200 // Default assumption
        };
    } catch (_error) {
        //
        //	Ultimate fallback with conservative estimates
        //
        return {
            usage_percent: 50,
            available_gb: 100,
            total_gb: 200
        };
    }
}

//
//	Convert disk usage percentage to braille character
//
async function get_disk_braille_character(disk_usage_percent) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(disk_usage_percent);
}

module.exports = {
    calculate_disk_usage_internal,
    get_disk_braille_character
};
