let os = require('os');
let { execSync } = require('child_process');
let fs = require('fs');
let get_braille_character = require('../shared/get_braille_character.js');

//
//	Calculate swap usage percentage and swap information
//
async function calculate_swap_usage_internal() {

    //
    //	Get operating system platform
    //
    let operating_system_platform = os.platform();
    let swap_info = {
        usage_percent: 0,
        total_gb: 0,
        used_gb: 0,
        available_gb: 0,
        swap_enabled: false
    };

    //
    //	Platform-specific swap calculation
    //
    if (operating_system_platform === 'darwin') {

        //
        //	macOS: Use sysctl vm.swapusage (no root required)
        //
        try {
            let swap_output = execSync('sysctl vm.swapusage', { encoding: 'utf8' });

            //
            //	Parse swap usage: vm.swapusage: total = 2048.00M  used = 723.75M  free = 1324.25M  (encrypted)
            //
            let total_match = swap_output.match(/total = ([\d.]+)([KMG])/);
            let used_match = swap_output.match(/used = ([\d.]+)([KMG])/);
            let free_match = swap_output.match(/free = ([\d.]+)([KMG])/);

            if (total_match && used_match) {

                //
                //	Convert to GB based on unit
                //
                let total_value = parseFloat(total_match[1]);
                let total_unit = total_match[2];
                let used_value = parseFloat(used_match[1]);
                let used_unit = used_match[2];

                //
                //	Unit conversion helper
                //
                function convert_to_gb(value, unit) {
                    if (unit === 'K') {
                        return value / (1024 * 1024);
                    }
                    if (unit === 'M') {
                        return value / 1024;
                    }
                    if (unit === 'G') {
                        return value;
                    }
                    return value; // Assume bytes if no unit
                }

                swap_info.total_gb = convert_to_gb(total_value, total_unit);
                swap_info.used_gb = convert_to_gb(used_value, used_unit);
                swap_info.available_gb = swap_info.total_gb - swap_info.used_gb;

                if (swap_info.total_gb > 0) {
                    swap_info.usage_percent = (swap_info.used_gb / swap_info.total_gb) * 100;
                    swap_info.swap_enabled = true;
                }
            }

        } catch (_error) {
            //
            //	Fallback: Try checking for swap files in /var/vm/ (macOS)
            //
            try {
                let swap_files = execSync('ls -la /var/vm/swapfile* 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
                let swap_file_count = parseInt(swap_files);

                if (swap_file_count > 0) {
                    //
                    //	Estimate swap usage based on file count (rough estimation)
                    //
                    swap_info.total_gb = swap_file_count * 1; // Assume ~1GB per swap file
                    swap_info.used_gb = swap_file_count * 0.5; // Rough usage estimation
                    swap_info.available_gb = swap_info.total_gb - swap_info.used_gb;
                    swap_info.usage_percent = 50; // Conservative estimate
                    swap_info.swap_enabled = true;
                }
            } catch (_fallback_error) {
                // No swap detected
            }
        }

    } else if (operating_system_platform === 'linux') {

        //
        //	Linux: Use /proc/meminfo (no root required)
        //
        try {
            let meminfo_content = fs.readFileSync('/proc/meminfo', 'utf8');

            //
            //	Parse swap information from /proc/meminfo
            //	SwapTotal:       8388604 kB
            //	SwapFree:        6291452 kB
            //
            let swap_total_match = meminfo_content.match(/SwapTotal:\s+(\d+)\s+kB/);
            let swap_free_match = meminfo_content.match(/SwapFree:\s+(\d+)\s+kB/);

            if (swap_total_match && swap_free_match) {
                let total_kb = parseInt(swap_total_match[1]);
                let free_kb = parseInt(swap_free_match[1]);
                let used_kb = total_kb - free_kb;

                swap_info.total_gb = total_kb / (1024 * 1024);
                swap_info.used_gb = used_kb / (1024 * 1024);
                swap_info.available_gb = free_kb / (1024 * 1024);

                if (swap_info.total_gb > 0) {
                    swap_info.usage_percent = (swap_info.used_gb / swap_info.total_gb) * 100;
                    swap_info.swap_enabled = true;
                }
            }

        } catch (_error) {
            //
            //	Fallback: Try 'free' command if available
            //
            try {
                let free_output = execSync('free -b', { encoding: 'utf8' });
                let swap_line = free_output.split('\n').find(line => line.startsWith('Swap:'));

                if (swap_line) {
                    let swap_parts = swap_line.split(/\s+/);
                    if (swap_parts.length >= 4) {
                        let total_bytes = parseInt(swap_parts[1]);
                        let used_bytes = parseInt(swap_parts[2]);
                        let free_bytes = parseInt(swap_parts[3]);

                        swap_info.total_gb = total_bytes / (1024 * 1024 * 1024);
                        swap_info.used_gb = used_bytes / (1024 * 1024 * 1024);
                        swap_info.available_gb = free_bytes / (1024 * 1024 * 1024);

                        if (swap_info.total_gb > 0) {
                            swap_info.usage_percent = (swap_info.used_gb / swap_info.total_gb) * 100;
                            swap_info.swap_enabled = true;
                        }
                    }
                }

            } catch (_fallback_error) {
                // No swap detected or commands not available
            }
        }

    } else if (operating_system_platform === 'win32') {

        //
        //	Windows: Try WMI query for virtual memory (no admin required)
        //
        try {
            let wmic_output = execSync('wmic pagefile list brief', { encoding: 'utf8' });

            //
            //	Parse Windows pagefile information
            //	Look for CurrentUsage and MaximumSize
            //
            let current_usage_match = wmic_output.match(/CurrentUsage=(\d+)/);
            let max_size_match = wmic_output.match(/MaximumSize=(\d+)/);

            if (current_usage_match && max_size_match) {
                let current_mb = parseInt(current_usage_match[1]);
                let max_mb = parseInt(max_size_match[1]);

                swap_info.total_gb = max_mb / 1024;
                swap_info.used_gb = current_mb / 1024;
                swap_info.available_gb = (max_mb - current_mb) / 1024;

                if (swap_info.total_gb > 0) {
                    swap_info.usage_percent = (swap_info.used_gb / swap_info.total_gb) * 100;
                    swap_info.swap_enabled = true;
                }
            }

        } catch (_error) {
            //
            //	Windows fallback: Try PowerShell if WMIC fails
            //
            try {
                let ps_cmd = 'powershell "Get-WmiObject -Class Win32_PageFileUsage | Select-Object CurrentUsage,AllocatedBaseSize"';
                let ps_output = execSync(ps_cmd, { encoding: 'utf8' });

                let current_match = ps_output.match(/CurrentUsage\s*:\s*(\d+)/);
                let allocated_match = ps_output.match(/AllocatedBaseSize\s*:\s*(\d+)/);

                if (current_match && allocated_match) {
                    let current_mb = parseInt(current_match[1]);
                    let allocated_mb = parseInt(allocated_match[1]);

                    swap_info.total_gb = allocated_mb / 1024;
                    swap_info.used_gb = current_mb / 1024;
                    swap_info.available_gb = (allocated_mb - current_mb) / 1024;

                    if (swap_info.total_gb > 0) {
                        swap_info.usage_percent = (swap_info.used_gb / swap_info.total_gb) * 100;
                        swap_info.swap_enabled = true;
                    }
                }

            } catch (_fallback_error) {
                // No swap detected
            }
        }
    }

    //
    //	Ensure values are within valid ranges
    //
    swap_info.usage_percent = Math.max(0, Math.min(100, swap_info.usage_percent));
    swap_info.total_gb = Math.max(0, swap_info.total_gb);
    swap_info.used_gb = Math.max(0, swap_info.used_gb);
    swap_info.available_gb = Math.max(0, swap_info.available_gb);

    return swap_info;
}

//
//	Calculate swap usage (for compatibility with existing pattern)
//
async function calculate_swap_usage() {
    return await calculate_swap_usage_internal();
}

//
//	Get braille character representing swap usage percentage
//
async function get_swap_braille_character(usage_percent) {

    //
    //	Validate input
    //
    if (typeof usage_percent !== 'number' || usage_percent < 0 || usage_percent > 100) {
        throw new Error('Usage percent must be a number between 0 and 100');
    }

    //
    //	Delegate to utility braille function
    //
    return await get_braille_character(usage_percent);
}

//
//	Export functions
//
module.exports = {
    calculate_swap_usage_internal,
    calculate_swap_usage,
    get_swap_braille_character
};
