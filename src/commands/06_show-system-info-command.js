let { calculate_ram_usage_internal, get_ram_braille_character } = require('../monitors/02_ram-monitor.js');
let vscode = require('vscode');
let os = require('os');

//
//	Show system information command handler
//
async function show_system_info_command() {

    //
    //	Get current system information
    //
    let cpu_info = os.cpus();
    let cpu_model = cpu_info[0].model;
    let cpu_core_count = cpu_info.length;
    let ram_usage_info = await calculate_ram_usage_internal();
    let operating_system_platform = os.platform();

    //
    //	Get RAM braille character for current usage
    //
    let ram_braille_character = await get_ram_braille_character(ram_usage_info.usage_percent);

    //
    //	Build comprehensive system information message
    //
    let system_info_message = 'System Information:\n\n' +
		`OS: ${operating_system_platform}\n` +
		`CPU: ${cpu_model} (${cpu_core_count} cores)\n` +
		`RAM: ${ram_usage_info.total_gb.toFixed(1)}GB total\n` +
		`Usage: ${ram_usage_info.usage_percent.toFixed(1)}% used\n` +
		`Block shown: "${ram_braille_character}"`;

    //
    //	Display system information to user
    //
    vscode.window.showInformationMessage(system_info_message);
}

module.exports = show_system_info_command;
