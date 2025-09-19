let { exec } = require('child_process');
let { promisify } = require('util');
let execAsync = promisify(exec);
let os = require('os');
let fs = require('fs').promises;
let { get_cpu_braille_character } = require('./cpu-monitor.js');

//
//  Store previous Linux diskstats values for delta calculation
//
let previous_diskstats = new Map();
let previous_timestamp = 0;

//
//  Activity thresholds based on TPS (Transfers Per Second) - the "90s LED" metric
//  This measures drive busyness rather than raw throughput
//
let TPS_THRESHOLDS = {
    idle: 5,           // 0-5 TPS = idle
    light: 25,         // 5-25 TPS = light activity
    moderate: 100,     // 25-100 TPS = moderate activity
    busy: 300,         // 100-300 TPS = busy
    very_busy: 800,    // 300-800 TPS = very busy
    extreme: 1500      // 800+ TPS = extreme activity (lots of small random I/O)
};

//
//  Calculate current disk activity in real-time with cross-platform support
//
async function calculate_disk_activity_internal() {

    //
    //  Get operating system platform
    //
    let operating_system_platform = os.platform();

    //
    //  Platform-specific disk activity calculation
    //
    if (operating_system_platform === 'darwin') {
        return await calculate_disk_activity_macos();
    } else if (operating_system_platform === 'linux') {
        return await calculate_disk_activity_linux();
    } else if (operating_system_platform === 'win32') {
        return await calculate_disk_activity_windows();
    } else {
        //
        //  Other platforms: Return idle state
        //
        return get_idle_disk_activity_state();
    }
}

//
//  macOS disk activity calculation using iostat
//
async function calculate_disk_activity_macos() {

    try {

        //
        //  Get current disk I/O statistics using iostat
        //
        let command = 'iostat -d 1 2 | tail -1';
        let { stdout } = await execAsync(command);

        //
        //  Parse iostat output
        //  Format: KB/t  tps  MB/s
        //
        let lines = stdout.trim().split('\n');
        let stats_line = lines[lines.length - 1];
        let parts = stats_line.trim().split(/\s+/);

        if (parts.length >= 3) {

            let kb_per_transfer = parseFloat(parts[0]) || 0;
            let transfers_per_second = parseFloat(parts[1]) || 0;
            let mb_per_second = parseFloat(parts[2]) || 0;

            //
            //  Convert MB/s to KB/s for reference
            //
            let total_kb_s = mb_per_second * 1024;

            //
            //  Estimate read/write split based on transfer size patterns
            //  Small transfers (< 8KB) = likely random I/O (more reads than writes)
            //  Large transfers (> 32KB) = likely sequential (balanced read/write)
            //
            let estimated_read_ratio;
            let estimated_write_ratio;

            if (kb_per_transfer < 8) {
                //
                //  Small random I/O - typically 70% reads, 30% writes
                //
                estimated_read_ratio = 0.7;
                estimated_write_ratio = 0.3;
            } else if (kb_per_transfer > 32) {
                //
                //  Large sequential I/O - typically 50% reads, 50% writes
                //
                estimated_read_ratio = 0.5;
                estimated_write_ratio = 0.5;
            } else {
                //
                //  Medium I/O - blend based on size
                //
                let size_factor = (kb_per_transfer - 8) / (32 - 8);
                estimated_read_ratio = 0.7 - (size_factor * 0.2); // 70% -> 50%
                estimated_write_ratio = 0.3 + (size_factor * 0.2); // 30% -> 50%
            }

            //
            //  Calculate estimated read/write TPS
            //
            let estimated_read_tps = transfers_per_second * estimated_read_ratio;
            let estimated_write_tps = transfers_per_second * estimated_write_ratio;

            //
            //  Calculate activity levels based on TPS (the classic 90s LED metric)
            //
            let read_activity_level = calculate_tps_activity_level(estimated_read_tps);
            let write_activity_level = calculate_tps_activity_level(estimated_write_tps);
            let total_activity_level = calculate_tps_activity_level(transfers_per_second);

            return {
                total_tps: transfers_per_second,
                read_tps: estimated_read_tps,
                write_tps: estimated_write_tps,
                read_activity_level: read_activity_level,
                write_activity_level: write_activity_level,
                total_activity_level: total_activity_level,
                activity_description: get_tps_activity_description(transfers_per_second),
                mb_per_second: mb_per_second,
                kb_per_transfer: kb_per_transfer,
                activity_level: total_activity_level,
                total_kb_s: total_kb_s
            };

        }

        //
        //  Fallback if parsing fails
        //
        return get_idle_disk_activity_state();

    } catch (_error) {

        //
        //  Return idle state on error
        //
        return get_idle_disk_activity_state();
    }
}

//
//  Linux disk activity calculation using /proc/diskstats
//
async function calculate_disk_activity_linux() {

    try {

        //
        //  Read /proc/diskstats (kernel interface - always available)
        //
        let diskstats_data = await fs.readFile('/proc/diskstats', 'utf8');
        let lines = diskstats_data.trim().split('\n');
        let current_timestamp = Date.now();

        //
        //  Calculate time delta for per-second rates
        //
        let time_delta_seconds = previous_timestamp > 0
            ? (current_timestamp - previous_timestamp) / 1000
            : 2.0; // Default to 2 seconds for first reading

        let total_read_ops_delta = 0;
        let total_write_ops_delta = 0;
        let total_read_sectors_delta = 0;
        let total_write_sectors_delta = 0;
        let current_diskstats = new Map();

        //
        //  Parse /proc/diskstats format:
        //  major minor name rio rmerge rsect ruse wio wmerge wsect wuse running use aveq
        //
        for (let line of lines) {
            let parts = line.trim().split(/\s+/);
            if (parts.length >= 14) {

                let device_name = parts[2];

                //
                //  Skip system devices: loop, ram, sr (CD), fd (floppy)
                //
                if (device_name.match(/^(loop|ram|sr|fd)/)) {
                    continue;
                }
                //
                //  Skip partitions: sda1, hdb2 (traditional) and nvme0n1p1 (NVMe partitions)
                //  But keep main devices: sda, nvme0n1, etc.
                //
                if (device_name.match(/^(sd[a-z]|hd[a-z])\d+$/) || device_name.match(/nvme\d+n\d+p\d+/)) {
                    continue;
                }

                //
                //  Extract current cumulative values
                //
                let current_read_ops = parseInt(parts[3]) || 0;
                let current_read_sectors = parseInt(parts[5]) || 0;
                let current_write_ops = parseInt(parts[7]) || 0;
                let current_write_sectors = parseInt(parts[9]) || 0;

                //
                //  Store current values for next calculation
                //
                current_diskstats.set(device_name, {
                    read_ops: current_read_ops,
                    read_sectors: current_read_sectors,
                    write_ops: current_write_ops,
                    write_sectors: current_write_sectors
                });

                //
                //  Calculate deltas if we have previous data
                //
                let previous_stats = previous_diskstats.get(device_name);
                if (previous_stats) {
                    let read_ops_delta = Math.max(0, current_read_ops - previous_stats.read_ops);
                    let write_ops_delta = Math.max(0, current_write_ops - previous_stats.write_ops);
                    let read_sectors_delta = Math.max(0, current_read_sectors - previous_stats.read_sectors);
                    let write_sectors_delta = Math.max(0, current_write_sectors - previous_stats.write_sectors);

                    total_read_ops_delta += read_ops_delta;
                    total_write_ops_delta += write_ops_delta;
                    total_read_sectors_delta += read_sectors_delta;
                    total_write_sectors_delta += write_sectors_delta;
                }
            }
        }

        //
        //  Store current values for next calculation
        //
        previous_diskstats = current_diskstats;
        previous_timestamp = current_timestamp;

        //
        //  Calculate per-second rates from deltas
        //
        let total_read_tps = total_read_ops_delta / time_delta_seconds;
        let total_write_tps = total_write_ops_delta / time_delta_seconds;
        let total_tps = total_read_tps + total_write_tps;

        //
        //  Convert sectors to KB/s (Linux sectors are 512 bytes)
        //
        let total_read_kb_s = (total_read_sectors_delta * 512) / 1024 / time_delta_seconds;
        let total_write_kb_s = (total_write_sectors_delta * 512) / 1024 / time_delta_seconds;
        let total_kb_s = total_read_kb_s + total_write_kb_s;
        let mb_per_second = total_kb_s / 1024;
        let kb_per_transfer = total_tps > 0 ? total_kb_s / total_tps : 0;

        //
        //  Calculate activity levels
        //
        let read_activity_level = calculate_tps_activity_level(total_read_tps);
        let write_activity_level = calculate_tps_activity_level(total_write_tps);
        let total_activity_level = calculate_tps_activity_level(total_tps);

        return {
            total_tps: total_tps,
            read_tps: total_read_tps,
            write_tps: total_write_tps,
            read_activity_level: read_activity_level,
            write_activity_level: write_activity_level,
            total_activity_level: total_activity_level,
            activity_description: get_tps_activity_description(total_tps),
            mb_per_second: mb_per_second,
            kb_per_transfer: kb_per_transfer,
            activity_level: total_activity_level,
            total_kb_s: total_kb_s
        };

    } catch (_error) {

        //
        //  Fallback: Try iostat if available
        //
        try {
            let { stdout } = await execAsync('iostat -d 1 2 2>/dev/null | tail -1');

            //
            //  Basic iostat parsing for Linux (format may differ from macOS)
            //
            let parts = stdout.trim().split(/\s+/);
            if (parts.length >= 3) {
                let tps = parseFloat(parts[1]) || 0;
                let mb_s = parseFloat(parts[2]) || 0;

                let read_tps = tps * 0.6; // Estimate 60% reads
                let write_tps = tps * 0.4; // Estimate 40% writes

                return {
                    total_tps: tps,
                    read_tps: read_tps,
                    write_tps: write_tps,
                    read_activity_level: calculate_tps_activity_level(read_tps),
                    write_activity_level: calculate_tps_activity_level(write_tps),
                    total_activity_level: calculate_tps_activity_level(tps),
                    activity_description: get_tps_activity_description(tps),
                    mb_per_second: mb_s,
                    kb_per_transfer: tps > 0 ? (mb_s * 1024) / tps : 0,
                    activity_level: calculate_tps_activity_level(tps),
                    total_kb_s: mb_s * 1024
                };
            }
        } catch (_iostat_error) {
            // iostat not available, continue to idle state
        }

        //
        //  Return idle state if both methods fail
        //
        return get_idle_disk_activity_state();
    }
}

//
//  Windows disk activity calculation using wmic
//
async function calculate_disk_activity_windows() {

    try {

        //
        //  Use wmic to get disk performance data
        //
        let command = 'wmic path Win32_PerfRawData_PerfDisk_LogicalDisk get Name,DiskReadsPerSec,DiskWritesPerSec,DiskReadBytesPerSec,DiskWriteBytesPerSec /format:csv';
        let { stdout } = await execAsync(command);

        let lines = stdout.trim().split('\n');
        let total_read_ops = 0;
        let total_write_ops = 0;
        let total_read_bytes = 0;
        let total_write_bytes = 0;

        //
        //  Parse CSV output (skip header)
        //
        for (let i = 1; i < lines.length; i++) {
            let parts = lines[i].split(',');
            if (parts.length >= 5 && parts[1] && parts[1] !== 'Name') {

                //
                //  Skip _Total and other system entries
                //
                if (parts[1].includes('_Total') || parts[1].includes(':')) {
                    continue;
                }

                total_read_ops += parseInt(parts[2]) || 0;
                total_write_ops += parseInt(parts[3]) || 0;
                total_read_bytes += parseInt(parts[4]) || 0;
                total_write_bytes += parseInt(parts[5]) || 0;
            }
        }

        //
        //  Calculate metrics (scale down for display)
        //
        let read_tps = total_read_ops * 0.01;
        let write_tps = total_write_ops * 0.01;
        let total_tps = read_tps + write_tps;

        let read_kb_s = (total_read_bytes / 1024) * 0.01;
        let write_kb_s = (total_write_bytes / 1024) * 0.01;
        let total_kb_s = read_kb_s + write_kb_s;

        let mb_per_second = total_kb_s / 1024;
        let kb_per_transfer = total_tps > 0 ? total_kb_s / total_tps : 0;

        //
        //  Calculate activity levels
        //
        let read_activity_level = calculate_tps_activity_level(read_tps);
        let write_activity_level = calculate_tps_activity_level(write_tps);
        let total_activity_level = calculate_tps_activity_level(total_tps);

        return {
            total_tps: total_tps,
            read_tps: read_tps,
            write_tps: write_tps,
            read_activity_level: read_activity_level,
            write_activity_level: write_activity_level,
            total_activity_level: total_activity_level,
            activity_description: get_tps_activity_description(total_tps),
            mb_per_second: mb_per_second,
            kb_per_transfer: kb_per_transfer,
            activity_level: total_activity_level,
            total_kb_s: total_kb_s
        };

    } catch (_error) {

        //
        //  Return idle state on error
        //
        return get_idle_disk_activity_state();
    }
}

//
//  Get idle disk activity state (shared by all error conditions)
//
function get_idle_disk_activity_state() {
    return {
        total_tps: 0,
        read_tps: 0,
        write_tps: 0,
        read_activity_level: 0,
        write_activity_level: 0,
        total_activity_level: 0,
        activity_description: 'idle',
        mb_per_second: 0,
        kb_per_transfer: 0,
        activity_level: 0,
        total_kb_s: 0
    };
}

//
//  Calculate activity level based on TPS (like the classic 90s LED)
//  Higher TPS = more flickering/activity regardless of data volume
//
function calculate_tps_activity_level(tps) {

    if (tps <= TPS_THRESHOLDS.idle) {
        //
        //  0-5 TPS = 0-12.5% activity
        //
        return (tps / TPS_THRESHOLDS.idle) * 12.5;
    }

    if (tps <= TPS_THRESHOLDS.light) {
        //
        //  5-25 TPS = 12.5-25% activity
        //
        let range_position = (tps - TPS_THRESHOLDS.idle) /
            (TPS_THRESHOLDS.light - TPS_THRESHOLDS.idle);
        return 12.5 + (range_position * 12.5);
    }

    if (tps <= TPS_THRESHOLDS.moderate) {
        //
        //  25-100 TPS = 25-50% activity
        //
        let range_position = (tps - TPS_THRESHOLDS.light) /
            (TPS_THRESHOLDS.moderate - TPS_THRESHOLDS.light);
        return 25 + (range_position * 25);
    }

    if (tps <= TPS_THRESHOLDS.busy) {
        //
        //  100-300 TPS = 50-75% activity
        //
        let range_position = (tps - TPS_THRESHOLDS.moderate) /
            (TPS_THRESHOLDS.busy - TPS_THRESHOLDS.moderate);
        return 50 + (range_position * 25);
    }

    if (tps <= TPS_THRESHOLDS.very_busy) {
        //
        //  300-800 TPS = 75-87.5% activity
        //
        let range_position = (tps - TPS_THRESHOLDS.busy) /
            (TPS_THRESHOLDS.very_busy - TPS_THRESHOLDS.busy);
        return 75 + (range_position * 12.5);
    }

    //
    //  800+ TPS = 87.5-100% activity (extreme random I/O)
    //
    let range_position = Math.min((tps - TPS_THRESHOLDS.very_busy) /
        (TPS_THRESHOLDS.extreme - TPS_THRESHOLDS.very_busy), 1);
    return 87.5 + (range_position * 12.5);
}

//
//  Get activity description based on TPS (the "90s LED" feel)
//
function get_tps_activity_description(tps) {

    if (tps <= TPS_THRESHOLDS.idle) {
        return 'idle';
    }

    if (tps <= TPS_THRESHOLDS.light) {
        return 'light';
    }

    if (tps <= TPS_THRESHOLDS.moderate) {
        return 'moderate';
    }

    if (tps <= TPS_THRESHOLDS.busy) {
        return 'busy';
    }

    if (tps <= TPS_THRESHOLDS.very_busy) {
        return 'very busy';
    }

    return 'extreme';
}

//
//  Get read activity braille character based on read TPS activity level
//
async function get_disk_read_activity_braille_character(read_activity_level) {

    //
    //  Use the same braille progression as CPU/RAM
    //
    return await get_cpu_braille_character(read_activity_level);
}

//
//  Get write activity braille character based on write TPS activity level
//
async function get_disk_write_activity_braille_character(write_activity_level) {

    //
    //  Use the same braille progression as CPU/RAM
    //
    return await get_cpu_braille_character(write_activity_level);
}

//
//  Get total disk activity braille character
//
async function get_disk_activity_braille_character(activity_level) {

    //
    //  Use the same braille progression as CPU/RAM
    //
    return await get_cpu_braille_character(activity_level);
}

module.exports = {
    calculate_disk_activity_internal,
    get_disk_activity_braille_character,
    get_disk_read_activity_braille_character,
    get_disk_write_activity_braille_character,
    get_tps_activity_description
};
