// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

//
//	Import modular functions
//
import calculateCpuUsage from './01_calculate_cpu_usage';
import getCpuBrailleCharacter from './02_get_cpu_braille_character';
import calculateRamUsageInternal from './03_calculate_ram_usage';
import getRamBrailleCharacter from './04_get_ram_braille_character';
import updateStatusBarDisplay from './05_update_status_bar_display';
import showSystemInfoCommand from './06_show_system_info_command';

//
//	Export functions for external access and testing
//
export async function getSquareForUsage(usage: number): Promise<string> {
	
	//
	//	--> delegate to modular CPU braille function
	//
	return await getCpuBrailleCharacter(usage);
}

export async function getRamBlock(usage: number): Promise<string> {
	
	//
	//	--> delegate to modular RAM braille function
	//
	return await getRamBrailleCharacter(usage);
}

export async function calculateRamUsage(): Promise<{ usagePercent: number; availableGB: number; totalGB: number }> {
	
	//
	//	Get RAM usage information from modular function
	//
	let ram_info = await calculateRamUsageInternal();
	
	//
	//	--> return formatted response for compatibility
	//
	return {
		usagePercent: ram_info.usage_percent,
		availableGB: ram_info.available_gb,
		totalGB: ram_info.total_gb
	};
}

//
//	This method is called when your extension is activated
//	Your extension is activated the very first time the command is executed
//
export function activate(context: vscode.ExtensionContext) {

	//
	//	Use the console to output diagnostic information (console.log) and errors (console.error)
	//	This line of code will only be executed once when your extension is activated
	//
	console.log('Congratulations, your extension "sysmag" is now active!');

	//
	//	Create a status bar item
	//
	let status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	status_bar_item.show();

	//
	//	Function to update CPU display using modular approach
	//
	async function update_display() {
		await updateStatusBarDisplay(status_bar_item);
	}

	//
	//	Update display initially
	//
	update_display();

	//
	//	Set up timer to update every 200ms
	//
	let update_interval = setInterval(update_display, 200);

	//
	//	Add the status bar item and interval to subscriptions so they get disposed when extension is deactivated
	//
	context.subscriptions.push(status_bar_item);
	context.subscriptions.push({ dispose: function() { clearInterval(update_interval); } });

	//
	//	The command has been defined in the package.json file
	//	Now provide the implementation of the command with registerCommand
	//	The commandId parameter must match the command field in package.json
	//
	let disposable = vscode.commands.registerCommand('sysmag.helloWorld', showSystemInfoCommand);

	context.subscriptions.push(disposable);
}

//
//	This method is called when your extension is deactivated
//
export function deactivate() {}
