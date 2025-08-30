let calculate_cpu_usage = require('./01_calculate_cpu_usage.js');
let get_cpu_braille_character = require('./02_get_cpu_braille_character.js');
let calculate_ram_usage = require('./03_calculate_ram_usage.js');
let get_ram_braille_character = require('./04_get_ram_braille_character.js');
let os = require('os');

//
//	Update status bar display with current system usage
//
async function update_status_bar_display(status_bar_item, update_tooltip = true) {

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
    //	Get current system usage information
    //
    let cpu_usage_percentages = await calculate_cpu_usage();
    let ram_usage_info = await calculate_ram_usage();

    //
    //	Get braille characters for each CPU core
    //
    let cpu_display_string = '';
    for (let i = 0; i < cpu_usage_percentages.length; i++) {
        let core_braille = await get_cpu_braille_character(cpu_usage_percentages[i]);
        cpu_display_string += core_braille;
    }

    //
    //	Get RAM braille character
    //
    let ram_braille_character = await get_ram_braille_character(ram_usage_info.usage_percent);

    //
    //	Build status bar display text - per-core CPU + space + RAM
    //
    let display_text = cpu_display_string + ' ' + ram_braille_character;

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
        let tooltip_text = `CPU Cores: ${cpu_core_count} | RAM: ${ram_usage_info.usage_percent.toFixed(1)}% used (${ram_usage_info.available_gb.toFixed(1)}GB / ${ram_usage_info.total_gb.toFixed(1)}GB)`;

        status_bar_item.tooltip = tooltip_text;
    }
}

module.exports = update_status_bar_display;
