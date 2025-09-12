let { calculate_cpu_usage, get_cpu_braille_character } = require('../01_monitors/01_cpu-monitor.js');
let { calculate_ram_usage_internal, get_ram_braille_character } = require('../01_monitors/02_ram-monitor.js');
let { calculate_disk_usage_internal, get_disk_braille_character } = require('../01_monitors/03_disk-monitor.js');
let { calculate_network_usage_internal, get_network_in_braille_character, get_network_out_braille_character } = require('../01_monitors/04_network-monitor.js');
let { calculate_swap_usage_internal, get_swap_braille_character } = require('../01_monitors/05_swap-monitor.js');
let { calculate_disk_activity_internal, get_disk_read_activity_braille_character, get_disk_write_activity_braille_character } = require('../01_monitors/06_disk-activity-monitor.js');
let os = require('os');

//
//	Update status bar display with current system usage
//
async function update_status_bar_display(status_bar_item, update_tooltip = true, cpuGraphProvider = null) {

    //
    //	Validate status bar item parameter
    //
    if (!status_bar_item) {

        //
        //	^^^ status bar item is required
        //
        throw new Error('status-bar-item-required');
    }

    //
    //	Get current system usage information in parallel for better performance
    //
    let [
        cpu_usage_percentages,
        ram_usage_info,
        disk_usage_info,
        disk_activity_info,
        network_usage_info,
        swap_usage_info
    ] = await Promise.all([
        calculate_cpu_usage(),
        calculate_ram_usage_internal(),
        calculate_disk_usage_internal(),
        calculate_disk_activity_internal(),
        calculate_network_usage_internal(),
        calculate_swap_usage_internal()
    ]);

    //
    //	Share CPU data with graph view (same calculation, same timing)
    //
    if (cpuGraphProvider) {
        cpuGraphProvider.updateCpuData(cpu_usage_percentages);
    }

    //
    //	Get braille characters for each CPU core in parallel
    //
    let cpu_braille_promises = cpu_usage_percentages.map(async(usage) => {
        return await get_cpu_braille_character(usage);
    });

    //
    //	Get all other braille characters in parallel
    //
    let [
        cpu_braille_chars,
        ram_braille_character,
        disk_braille_character,
        disk_read_activity_braille_character,
        disk_write_activity_braille_character,
        network_in_braille_character,
        network_out_braille_character,
        swap_braille_character
    ] = await Promise.all([
        Promise.all(cpu_braille_promises),
        get_ram_braille_character(ram_usage_info.usage_percent),
        get_disk_braille_character(disk_usage_info.usage_percent),
        get_disk_read_activity_braille_character(disk_activity_info.read_activity_level),
        get_disk_write_activity_braille_character(disk_activity_info.write_activity_level),
        get_network_in_braille_character(network_usage_info.network_in_percent),
        get_network_out_braille_character(network_usage_info.network_out_percent),
        //
        //	Handle swap character - use braille if enabled, otherwise show ⣛ (exclamation-like)
        //
        swap_usage_info.swap_enabled ?
            get_swap_braille_character(swap_usage_info.usage_percent) :
            Promise.resolve('⣛')
    ]);

    //
    //	Build CPU display string from parallel results
    //
    let cpu_display_string = cpu_braille_chars.join('');

    //
    //	Build status bar display text - per-core CPU + space + RAM + space +
    //  Swap (always shown) + space + Disk + space + DiskRead + DiskWrite + space + Network In + Network Out
    //
    let display_text = `${cpu_display_string} ${ram_braille_character} ${swap_braille_character} ${disk_braille_character} ${disk_read_activity_braille_character}${disk_write_activity_braille_character} ${network_in_braille_character}${network_out_braille_character}`;

    //
    //	Update status bar item with new information
    //
    status_bar_item.text = display_text;

    //
    //	Only update tooltip if requested (to prevent flickering)
    //
    if (update_tooltip) {
        //
        //	Build detailed tooltip information
        //
        let cpu_core_count = os.cpus().length;
        let swap_tooltip = swap_usage_info.swap_enabled ?
            `Swap: ${swap_usage_info.usage_percent.toFixed(1)}% used (${swap_usage_info.used_gb.toFixed(1)}GB / ${swap_usage_info.total_gb.toFixed(1)}GB)` :
            'Swap: Not configured';
        let cpu_part = `CPU Cores: ${cpu_core_count}`;
        let ram_part = `RAM: ${ram_usage_info.usage_percent.toFixed(1)}% used (${ram_usage_info.available_gb.toFixed(1)}GB / ${ram_usage_info.total_gb.toFixed(1)}GB)`;
        let disk_part = `Disk: ${disk_usage_info.usage_percent.toFixed(1)}% used (${disk_usage_info.available_gb.toFixed(1)}GB / ${disk_usage_info.total_gb.toFixed(1)}GB)`;
        let disk_activity_part = `Disk I/O: ${disk_activity_info.activity_description} (${disk_activity_info.total_tps.toFixed(0)} TPS, ${disk_activity_info.mb_per_second.toFixed(1)}MB/s) - Read: ${disk_activity_info.read_tps.toFixed(0)} TPS, Write: ${disk_activity_info.write_tps.toFixed(0)} TPS`;
        let network_part = `Network: ${network_usage_info.interface_name} (${network_usage_info.capacity_mbps}Mbps) - In: ${network_usage_info.network_in_percent.toFixed(1)}% Out: ${network_usage_info.network_out_percent.toFixed(1)}%`;
        let tooltip_text = `${cpu_part} | ${ram_part} | ${swap_tooltip} | ${disk_part} | ${disk_activity_part} | ${network_part}`;

        status_bar_item.tooltip = tooltip_text;
    }
}

module.exports = update_status_bar_display;
