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
export function getSquareForUsage(usage: number): string {
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

// Function to calculate RAM usage percentage and get available memory
export function calculateRamUsage(): { usagePercent: number; availableGB: number; totalGB: number } {
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const totalGB = totalMem / (1024 * 1024 * 1024);
	const freeGB = freeMem / (1024 * 1024 * 1024);
	
	const platform = os.platform();
	let usagePercent: number;
	let availableGB: number;
	
	switch (platform) {
		case 'darwin': // macOS
			// On macOS, os.freemem() only shows immediately free memory, not cached/buffered
			// macOS aggressively caches memory, so we need a more realistic calculation
			// Assume up to 50% of "used" memory could be cached and reclaimable
			const macosUsedMem = totalMem - freeMem;
			const estimatedCachedMem = Math.min(macosUsedMem * 0.5, totalMem * 0.4);
			const actualUsedMem = macosUsedMem - estimatedCachedMem;
			usagePercent = (actualUsedMem / totalMem) * 100;
			availableGB = (totalMem - actualUsedMem) / (1024 * 1024 * 1024);
			break;
			
		case 'linux':
			// On Linux, os.freemem() shows available memory including buffers/cache
			// This is typically more accurate than macOS
			usagePercent = ((totalMem - freeMem) / totalMem) * 100;
			availableGB = freeGB;
			break;
			
		case 'win32': // Windows
			// On Windows, os.freemem() shows available physical memory
			// Windows memory management is different but generally more accurate
			usagePercent = ((totalMem - freeMem) / totalMem) * 100;
			availableGB = freeGB;
			break;
			
		default:
			// Fallback for other platforms
			usagePercent = ((totalMem - freeMem) / totalMem) * 100;
			availableGB = freeGB;
			break;
	}
	
	// Ensure reasonable bounds
	usagePercent = Math.max(0, Math.min(100, usagePercent));
	availableGB = Math.max(0, availableGB);
	
	return {
		usagePercent,
		availableGB,
		totalGB
	};
}

// Function to get braille character based on RAM usage (0-100%)
export function getRamBlock(usage: number): string {
	// Use the same braille patterns as CPU for more granular RAM visualization
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
		const ramInfo = calculateRamUsage();
		
		// Create visual representation with individual braille characters for CPU cores
		let displayText = '';
		let tooltipText = `CPU Usage per core:\n`;
		
		// Add CPU cores
		for (let i = 0; i < cpuCores; i++) {
			const usage = usagePercentages[i];
			displayText += getSquareForUsage(usage);
			tooltipText += `Core ${i + 1}: ${usage.toFixed(1)}%\n`;
		}
		
		// Add space separator and RAM block
		displayText += ' ' + getRamBlock(ramInfo.usagePercent);
		
		// Add RAM info to tooltip
		tooltipText += `\nRAM Usage: ${ramInfo.usagePercent.toFixed(1)}%`;
		if (ramInfo.usagePercent >= 90) {
			tooltipText += ' (CRITICAL)';
		}
		tooltipText += `\nAvailable: ${ramInfo.availableGB.toFixed(1)}GB / ${ramInfo.totalGB.toFixed(1)}GB`;
		
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
		const ramInfo = calculateRamUsage();
		const platform = os.platform();
		
		const message = `System Info (${platform}):\n` +
			`CPU: ${cpuCores} cores - ${cpuModel}\n` +
			`RAM: ${ramInfo.availableGB.toFixed(1)}GB available / ${ramInfo.totalGB.toFixed(1)}GB total\n` +
			`Usage: ${ramInfo.usagePercent.toFixed(1)}% used\n` +
			`Block shown: "${getRamBlock(ramInfo.usagePercent)}"`;
		
		vscode.window.showInformationMessage(message);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
