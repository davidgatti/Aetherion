let calculate_cpu_usage = require('./01_calculate_cpu_usage.js');
let get_cpu_braille_character = require('./02_get_cpu_braille_character.js');
let calculate_ram_usage = require('./03_calculate_ram_usage.js');
let get_ram_braille_character = require('./04_get_ram_braille_character.js');
let os = require('os');

//
//	Update status bar display with current system usage
//
async function update_status_bar_display(status_bar_item) {
	
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
	//	Calculate average CPU usage across all cores
	//
	let average_cpu_usage = cpu_usage_percentages.length > 0 ? 
		cpu_usage_percentages.reduce((a, b) => a + b, 0) / cpu_usage_percentages.length : 0;
	
	//
	//	Get braille characters for current usage
	//
	let cpu_braille_character = await get_cpu_braille_character(average_cpu_usage);
	let ram_braille_character = await get_ram_braille_character(ram_usage_info.usage_percent);
	
	//
	//	Build status bar display text
	//
	let display_text = `CPU ${cpu_braille_character} RAM ${ram_braille_character}`;
	
	//
	//	Build detailed tooltip information
	//
	let cpu_core_count = os.cpus().length;
	let tooltip_text = `System Monitor:\n`;
	tooltip_text += `CPU: ${average_cpu_usage.toFixed(1)}% avg (${cpu_core_count} cores)\n`;
	tooltip_text += `RAM: ${ram_usage_info.usage_percent.toFixed(1)}% used\n`;
	tooltip_text += `Available: ${ram_usage_info.available_gb.toFixed(1)}GB / ${ram_usage_info.total_gb.toFixed(1)}GB`;
	
	//
	//	Update status bar item with new information
	//
	status_bar_item.text = display_text;
	status_bar_item.tooltip = tooltip_text.trim();
}

module.exports = update_status_bar_display;
