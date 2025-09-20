let os = require('os');
let { exec } = require('child_process');
let { promisify } = require('util');
let execAsync = promisify(exec);
let get_braille_character = require('../../get_braille_character.js');

//
//	Calculate process usage percentage and process information
//
async function calculate_process_usage_internal() {

    //
    //	Get operating system platform
    //
    let operating_system_platform = os.platform();
    let current_process_count = 0;
    let max_process_limit = 0;
    let usage_percent = 0;

    //
    //	Platform-specific process monitoring
    //
    if (operating_system_platform === 'linux') {

        //
        //	Linux: Use /proc/self/limits for max processes and ps for current count
        //
        try {
            // Get max processes from /proc/self/limits
            let { stdout: limits_output } = await execAsync('cat /proc/self/limits');

            //
            //	Parse max processes from /proc/self/limits
            //
            let max_processes_match = limits_output.match(/Max processes\s+(\d+)/);
            if (max_processes_match) {
                max_process_limit = parseInt(max_processes_match[1]);
            }

            // Get current process count
            let { stdout: ps_output } = await execAsync('ps aux | wc -l');
            current_process_count = parseInt(ps_output.trim()) - 1; // Subtract header line

        } catch {
            //
            //	Fallback values if commands fail
            //
            max_process_limit = 32768; // Common Linux default
            current_process_count = 100; // Fallback estimate
        }

    } else if (operating_system_platform === 'darwin') {

        //
        //	macOS: Use ulimit for max processes and ps for current count
        //
        try {
            // Get max processes from ulimit
            let { stdout: ulimit_output } = await execAsync('ulimit -u');
            max_process_limit = parseInt(ulimit_output.trim());

            // Get current process count
            let { stdout: ps_output } = await execAsync('ps aux | wc -l');
            current_process_count = parseInt(ps_output.trim()) - 1; // Subtract header line

        } catch {
            //
            //	Fallback values if commands fail
            //
            max_process_limit = 1064; // Common macOS default
            current_process_count = 200; // Fallback estimate
        }

    } else if (operating_system_platform === 'win32') {

        //
        //	Windows: Use tasklist for process count, fallback for max limit
        //
        try {
            // Get current process count
            let { stdout: tasklist_output } = await execAsync('tasklist /FI "STATUS eq running" /NH | find /c "exe"');
            current_process_count = parseInt(tasklist_output.trim());

            // Windows doesn't have a simple ulimit equivalent, use reasonable default
            max_process_limit = 4096; // Common Windows limit

        } catch {
            //
            //	Fallback values if commands fail
            //
            max_process_limit = 4096;
            current_process_count = 100; // Fallback estimate
        }

    } else {

        //
        //	Other platforms: use fallback values
        //
        max_process_limit = 1024;
        current_process_count = 50;
    }

    //
    //	Calculate usage percentage
    //
    if (max_process_limit > 0) {
        usage_percent = (current_process_count / max_process_limit) * 100;
    }

    //
    //	Ensure usage percentage is within valid range
    //
    usage_percent = Math.max(0, Math.min(100, usage_percent));

    //
    //	--> return process usage information
    //
    return {
        usage_percent: usage_percent,
        current_count: current_process_count,
        max_count: max_process_limit
    };
}

//
//	Convert process usage percentage to braille character
//
async function get_process_braille_character(process_usage_percent) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(process_usage_percent);
}

module.exports = {
    calculate_process_usage_internal,
    get_process_braille_character
};