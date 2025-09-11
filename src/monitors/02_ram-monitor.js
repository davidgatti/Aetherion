let os = require('os');
let { execSync } = require('child_process');
let get_braille_character = require('../utility/get_braille_character.js');

//
//	Calculate RAM usage percentage and memory information
//
async function calculate_ram_usage_internal() {

    //
    //	Get system memory information
    //
    let total_memory_bytes = os.totalmem();
    let total_memory_gb = total_memory_bytes / (1024 * 1024 * 1024);

    //
    //	Get operating system platform
    //
    let operating_system_platform = os.platform();
    let usage_percent = 0;
    let available_memory_gb = 0;

    //
    //	Platform-specific memory calculation
    //
    if (operating_system_platform === 'darwin') {

        //
        //	macOS: Use memory_pressure for Activity Monitor-like memory usage
        //
        try {
            let memory_pressure_output = execSync('memory_pressure', { encoding: 'utf8' });

            //
            //	Parse total memory from memory_pressure (more accurate than os.totalmem)
            //
            let total_bytes_match = memory_pressure_output.match(/The system has (\d+)/);
            if (total_bytes_match) {
                total_memory_gb = parseInt(total_bytes_match[1]) / (1024 * 1024 * 1024);
            }

            //
            //	Parse individual page counts for Activity Monitor-style calculation
            //
            let pages_active = parseInt(memory_pressure_output.match(/Pages active: (\d+)/)[1]);
            let pages_wired = parseInt(memory_pressure_output.match(/Pages wired down: (\d+)/)[1]);
            let pages_compressed_match = memory_pressure_output.match(/Pages used by compressor: (\d+)/);
            let pages_compressed = parseInt(pages_compressed_match[1]);
            let pages_free = parseInt(memory_pressure_output.match(/Pages free: (\d+)/)[1]);
            let pages_inactive_match = memory_pressure_output.match(/Pages inactive: (\d+)/);
            let pages_inactive = parseInt(pages_inactive_match[1]);
            let pages_speculative = parseInt(memory_pressure_output.match(/Pages speculative: (\d+)/)[1]);
            let page_size = 16384; // bytes

            //
            //	Calculate memory usage similar to Activity Monitor
            //	"Memory Used" = Active + Wired + Compressed pages
            //	Available = Free + Inactive + Speculative (can be reclaimed)
            //
            let used_pages = pages_active + pages_wired + pages_compressed;
            let available_pages = pages_free + pages_inactive + pages_speculative;

            let used_memory_gb = (used_pages * page_size) / (1024 * 1024 * 1024);
            available_memory_gb = (available_pages * page_size) / (1024 * 1024 * 1024);

            //
            //	Calculate usage percentage based on used memory vs total
            //
            usage_percent = (used_memory_gb / total_memory_gb) * 100;

        } catch {
            //
            //	Fallback to basic calculation if memory_pressure fails
            //
            let free_memory_bytes = os.freemem();
            let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
            available_memory_gb = free_memory_gb;
            usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
        }

    } else if (operating_system_platform === 'linux') {

        //
        //	Linux: Use /proc/meminfo for accurate memory calculation
        //
        try {
            let meminfo_output = execSync('cat /proc/meminfo', { encoding: 'utf8' });

            //
            //	Parse memory information from /proc/meminfo
            //
            let mem_total_match = meminfo_output.match(/MemTotal:\s+(\d+)\s+kB/);
            let mem_available_match = meminfo_output.match(/MemAvailable:\s+(\d+)\s+kB/);

            if (mem_total_match && mem_available_match) {
                //
                //	Use MemAvailable which includes reclaimable cache/buffer memory
                //
                let total_kb = parseInt(mem_total_match[1]);
                let available_kb = parseInt(mem_available_match[1]);

                total_memory_gb = total_kb / (1024 * 1024);
                available_memory_gb = available_kb / (1024 * 1024);
                usage_percent = ((total_memory_gb - available_memory_gb) / total_memory_gb) * 100;
            } else {
                //
                //	Fallback to basic calculation if parsing fails
                //
                let free_memory_bytes = os.freemem();
                let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
                available_memory_gb = free_memory_gb;
                usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
            }

        } catch {
            //
            //	Fallback to basic calculation if /proc/meminfo fails
            //
            let free_memory_bytes = os.freemem();
            let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
            available_memory_gb = free_memory_gb;
            usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
        }

    } else if (operating_system_platform === 'win32') {

        //
        //	Windows: free memory is available memory
        //
        let free_memory_bytes = os.freemem();
        let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
        available_memory_gb = free_memory_gb;
        usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;

    } else {

        //
        //	Other platforms: use basic calculation
        //
        let free_memory_bytes = os.freemem();
        let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
        available_memory_gb = free_memory_gb;
        usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
    }

    //
    //	Ensure usage percentage is within valid range
    //
    usage_percent = Math.max(0, Math.min(100, usage_percent));

    //
    //	--> return memory usage information
    //
    return {
        usage_percent: usage_percent,
        available_gb: available_memory_gb,
        total_gb: total_memory_gb
    };
}

//
//	Convert RAM usage percentage to braille character
//
async function get_ram_braille_character(ram_usage_percent) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(ram_usage_percent);
}

module.exports = {
    calculate_ram_usage_internal,
    get_ram_braille_character
};
