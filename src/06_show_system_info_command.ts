import calculateRamUsage from './03_calculate_ram_usage';
import getRamBrailleCharacter from './04_get_ram_braille_character';
import * as vscode from 'vscode';
import * as os from 'os';

//
//	Show system information command handler
//
export default async function(): Promise<void> {
	
	//
	//	Get current system information
	//
	let cpu_info = os.cpus();
	let cpu_model = cpu_info[0].model;
	let cpu_core_count = cpu_info.length;
	let ram_usage_info = await calculateRamUsage();
	let operating_system_platform = os.platform();
	
	//
	//	Get RAM braille character for display
	//
	let ram_braille_character = await getRamBrailleCharacter(ram_usage_info.usage_percent);
	
	//
	//	Build system information message
	//
	let system_info_message = `System Info (${operating_system_platform}):\n` +
		`CPU: ${cpu_core_count} cores - ${cpu_model}\n` +
		`RAM: ${ram_usage_info.available_gb.toFixed(1)}GB available / ${ram_usage_info.total_gb.toFixed(1)}GB total\n` +
		`Usage: ${ram_usage_info.usage_percent.toFixed(1)}% used\n` +
		`Block shown: "${ram_braille_character}"`;
	
	//
	//	Display system information to user
	//
	vscode.window.showInformationMessage(system_info_message);
};
