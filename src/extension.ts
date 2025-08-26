// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';

// Store previous CPU times for usage calculation
let previousCpuTimes: os.CpuInfo[] = [];

// Function to calculate CPU usage percentage for each core
function calculateCpuUsage(): number[] {
	const currentCpuTimes = os.cpus();
	const usagePercentages: number[] = [];

	if (previousCpuTimes.length === 0) {
		// First run, store current times and return 0 usage
		previousCpuTimes = currentCpuTimes;
		return new Array(currentCpuTimes.length).fill(0);
	}

	for (let i = 0; i < currentCpuTimes.length; i++) {
		const current = currentCpuTimes[i].times;
		const previous = previousCpuTimes[i].times;

		const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);
		const previousTotal = Object.values(previous).reduce((a, b) => a + b, 0);

		const currentIdle = current.idle;
		const previousIdle = previous.idle;

		const totalDiff = currentTotal - previousTotal;
		const idleDiff = currentIdle - previousIdle;

		const usage = totalDiff === 0 ? 0 : Math.max(0, Math.min(100, 100 - (idleDiff / totalDiff) * 100));
		usagePercentages.push(usage);
	}

	previousCpuTimes = currentCpuTimes;
	return usagePercentages;
}

// Function to get braille character based on CPU usage (0-100%)
function getSquareForUsage(usage: number): string {
	// Use different braille patterns to represent usage levels
	if (usage < 10) {
		return '⣀'; // Empty braille (very low usage)
	}
	if (usage < 20) {
		return '⣄'; // Bottom dots (low usage)
	}
	if (usage < 40) {
		return '⣤'; // Bottom half filled (moderate usage)
	}
	if (usage < 60) {
		return '⣶'; // Most filled (high usage)
	}
	if (usage < 80) {
		return '⣷'; // Almost complete (between ⣶ and ⣿)
	}
	return '⣿'; // Full braille block (very high usage)
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sysmag" is now active!');

	// Get CPU core count
	const cpuCores = os.cpus().length;

	// Create a status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	statusBarItem.show();

	// Function to update CPU display
	function updateCpuDisplay() {
		const usagePercentages = calculateCpuUsage();
		
		// Create visual representation with individual colored squares for each core
		let displayText = '';
		let tooltipText = `CPU Usage per core:\n`;
		
		for (let i = 0; i < cpuCores; i++) {
			const usage = usagePercentages[i];
			displayText += getSquareForUsage(usage);
			tooltipText += `Core ${i + 1}: ${usage.toFixed(1)}%\n`;
		}
		
		statusBarItem.text = displayText;
		statusBarItem.tooltip = tooltipText.trim();
	}

	// Update display initially
	updateCpuDisplay();

	// Set up timer to update every second
	const updateInterval = setInterval(updateCpuDisplay, 200);

	// Add the status bar item and interval to subscriptions so they get disposed when extension is deactivated
	context.subscriptions.push(statusBarItem);
	context.subscriptions.push({ dispose: () => clearInterval(updateInterval) });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('sysmag.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const cpuInfo = os.cpus();
		const cpuModel = cpuInfo[0].model;
		vscode.window.showInformationMessage(`CPU Info: ${cpuCores} cores - ${cpuModel}`);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
