import calculateCpuUsage from './01_calculate_cpu_usage';
import getCpuBrailleCharacter from './02_get_cpu_braille_character';
import calculateRamUsage from './03_calculate_ram_usage';
import getRamBrailleCharacter from './04_get_ram_braille_character';
import * as os from 'os';
import * as vscode from 'vscode';

//
//	Update status bar display with current system usage
//
export default async function(status_bar_item: vscode.StatusBarItem): Promise<void> {
	
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
	//	Get current system usage data
	//
	let cpu_usage_percentages = await calculateCpuUsage();
	let ram_usage_info = await calculateRamUsage();
	let cpu_core_count = os.cpus().length;
	
	//
	//	Build display text with CPU core representations
	//
	let display_text = '';
	let tooltip_text = 'CPU Usage per core:\n';
	
	//
	//	Add braille character for each CPU core
	//
	for (let core_index = 0; core_index < cpu_core_count; core_index++) {
		
		let core_usage_percent = cpu_usage_percentages[core_index];
		let core_braille_character = await getCpuBrailleCharacter(core_usage_percent);
		
		display_text += core_braille_character;
		tooltip_text += `Core ${core_index + 1}: ${core_usage_percent.toFixed(1)}%\n`;
	}
	
	//
	//	Add RAM usage representation
	//
	let ram_braille_character = await getRamBrailleCharacter(ram_usage_info.usage_percent);
	display_text += ' ' + ram_braille_character;
	
	//
	//	Build RAM tooltip information
	//
	tooltip_text += `\nRAM Usage: ${ram_usage_info.usage_percent.toFixed(1)}%`;
	
	if (ram_usage_info.usage_percent >= 90) {
		tooltip_text += ' (CRITICAL)';
	}
	
	tooltip_text += `\nAvailable: ${ram_usage_info.available_gb.toFixed(1)}GB / ${ram_usage_info.total_gb.toFixed(1)}GB`;
	
	//
	//	Update status bar item with new information
	//
	status_bar_item.text = display_text;
	status_bar_item.tooltip = tooltip_text.trim();
};
