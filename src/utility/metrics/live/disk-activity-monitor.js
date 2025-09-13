let { exec } = require('child_process');
let { promisify } = require('util');
let execAsync = promisify(exec);
let { get_cpu_braille_character } = require('./cpu-monitor.js');

//
//  Previous activity state for tracking changes
//
let previous_activity = {
    read_tps: 0,
    write_tps: 0,
    total_tps: 0,
    total_kb_s: 0,
    last_check: Date.now()
};

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
//  Calculate current disk activity in real-time
//
async function calculate_disk_activity_internal() {

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

            //
            //  Update previous activity state
            //
            previous_activity = {
                read_tps: estimated_read_tps,
                write_tps: estimated_write_tps,
                total_tps: transfers_per_second,
                total_kb_s: total_kb_s,
                last_check: Date.now()
            };

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
                // Keep legacy fields for compatibility
                activity_level: total_activity_level,
                total_kb_s: total_kb_s
            };

        }

        //
        //  Fallback if parsing fails
        //
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
            // Keep legacy fields for compatibility
            activity_level: 0,
            total_kb_s: 0
        };

    } catch (error) {

        //
        //  Return idle state on error
        //
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
            // Keep legacy fields for compatibility
            activity_level: 0,
            total_kb_s: 0
        };
    }
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
//  Get total disk activity braille character (legacy compatibility)
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
    get_tps_activity_description,
    // Keep legacy exports for compatibility
    get_activity_description: get_tps_activity_description
};
