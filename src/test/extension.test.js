let assert = require('assert');
let vscode = require('vscode');
let os = require('os');

// Import the functions we want to test
let { getSquareForUsage, getRamBlock, calculateRamUsage } = require('../extension.js');

suite('Aetherion CPU Monitor Test Suite', function() {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', function() {
		let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
		assert.ok(extension, 'Extension should be found');
	});

	suite('CPU Braille Character Mapping', function() {
		test('should return correct braille for very low usage (0-10%)', async function() {
			assert.strictEqual(await getSquareForUsage(0), '⣀');
			assert.strictEqual(await getSquareForUsage(5), '⣀');
			assert.strictEqual(await getSquareForUsage(9), '⣀');
		});

		test('should return correct braille for low usage (10-20%)', async function() {
			assert.strictEqual(await getSquareForUsage(10), '⣄');
			assert.strictEqual(await getSquareForUsage(15), '⣄');
			assert.strictEqual(await getSquareForUsage(19), '⣄');
		});

		test('should return correct braille for moderate usage (20-40%)', async function() {
			assert.strictEqual(await getSquareForUsage(20), '⣤');
			assert.strictEqual(await getSquareForUsage(30), '⣤');
			assert.strictEqual(await getSquareForUsage(39), '⣤');
		});

		test('should return correct braille for high usage (40-60%)', async function() {
			assert.strictEqual(await getSquareForUsage(40), '⣶');
			assert.strictEqual(await getSquareForUsage(50), '⣶');
			assert.strictEqual(await getSquareForUsage(59), '⣶');
		});

		test('should return correct braille for very high usage (60-80%)', async function() {
			assert.strictEqual(await getSquareForUsage(60), '⣷');
			assert.strictEqual(await getSquareForUsage(70), '⣷');
			assert.strictEqual(await getSquareForUsage(79), '⣷');
		});

		test('should return correct braille for maximum usage (80-100%)', async function() {
			assert.strictEqual(await getSquareForUsage(80), '⣿');
			assert.strictEqual(await getSquareForUsage(90), '⣿');
			assert.strictEqual(await getSquareForUsage(100), '⣿');
		});
	});

	suite('RAM Braille Character Mapping', function() {
		test('should use same braille patterns as CPU', async function() {
			// Test that RAM and CPU use identical braille progression
			assert.strictEqual(await getRamBlock(5), await getSquareForUsage(5));
			assert.strictEqual(await getRamBlock(15), await getSquareForUsage(15));
			assert.strictEqual(await getRamBlock(30), await getSquareForUsage(30));
			assert.strictEqual(await getRamBlock(50), await getSquareForUsage(50));
			assert.strictEqual(await getRamBlock(70), await getSquareForUsage(70));
			assert.strictEqual(await getRamBlock(90), await getSquareForUsage(90));
		});

		test('should return correct braille for very low RAM usage (0-10%)', async function() {
			assert.strictEqual(await getRamBlock(0), '⣀');
			assert.strictEqual(await getRamBlock(5), '⣀');
			assert.strictEqual(await getRamBlock(9), '⣀');
		});

		test('should return correct braille for low RAM usage (10-20%)', async function() {
			assert.strictEqual(await getRamBlock(10), '⣄');
			assert.strictEqual(await getRamBlock(15), '⣄');
			assert.strictEqual(await getRamBlock(19), '⣄');
		});

		test('should return correct braille for moderate RAM usage (20-40%)', async function() {
			assert.strictEqual(await getRamBlock(20), '⣤');
			assert.strictEqual(await getRamBlock(30), '⣤');
			assert.strictEqual(await getRamBlock(39), '⣤');
		});

		test('should return correct braille for high RAM usage (40-60%)', async function() {
			assert.strictEqual(await getRamBlock(40), '⣶');
			assert.strictEqual(await getRamBlock(50), '⣶');
			assert.strictEqual(await getRamBlock(59), '⣶');
		});

		test('should return correct braille for very high RAM usage (60-80%)', async function() {
			assert.strictEqual(await getRamBlock(60), '⣷');
			assert.strictEqual(await getRamBlock(70), '⣷');
			assert.strictEqual(await getRamBlock(79), '⣷');
		});

		test('should return correct braille for maximum RAM usage (80-100%)', async function() {
			assert.strictEqual(await getRamBlock(80), '⣿');
			assert.strictEqual(await getRamBlock(90), '⣿');
			assert.strictEqual(await getRamBlock(100), '⣿');
		});

		test('should handle edge cases correctly', async function() {
			assert.strictEqual(await getRamBlock(0), '⣀');
			assert.strictEqual(await getRamBlock(100), '⣿');
		});
	});

	suite('RAM Usage Calculation', function() {
		test('should return valid RAM usage data', async function() {
			let ramInfo = await calculateRamUsage();
			
			// Validate structure
			assert.ok(typeof ramInfo.usagePercent === 'number', 'usagePercent should be a number');
			assert.ok(typeof ramInfo.availableGB === 'number', 'availableGB should be a number');
			assert.ok(typeof ramInfo.totalGB === 'number', 'totalGB should be a number');
			
			// Validate ranges
			assert.ok(ramInfo.usagePercent >= 0 && ramInfo.usagePercent <= 100, 'usagePercent should be between 0-100');
			assert.ok(ramInfo.availableGB >= 0, 'availableGB should be positive');
			assert.ok(ramInfo.totalGB > 0, 'totalGB should be positive');
			assert.ok(ramInfo.availableGB <= ramInfo.totalGB, 'availableGB should not exceed totalGB');
		});

		test('should handle different OS platforms', async function() {
			let platform = os.platform();
			let ramInfo = await calculateRamUsage();
			
			// Should work on any platform
			assert.ok(ramInfo.totalGB > 0, `Should work on ${platform}`);
			
			// On macOS, should provide more realistic usage than raw os.freemem()
			if (platform === 'darwin') {
				let rawUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
				// Our calculation should generally be lower than raw calculation on macOS
				// (accounting for cached memory)
				assert.ok(ramInfo.usagePercent <= rawUsage + 5, 'macOS calculation should account for cached memory');
			}
		});

		test('should provide consistent total RAM', async function() {
			let ramInfo1 = await calculateRamUsage();
			let ramInfo2 = await calculateRamUsage();
			
			// Total RAM should be consistent between calls
			assert.strictEqual(ramInfo1.totalGB, ramInfo2.totalGB, 'Total RAM should be consistent');
		});
	});

	suite('Integration Tests', function() {
		test('should provide meaningful system monitoring data', async function() {
			let ramInfo = await calculateRamUsage();
			let ramBlock = await getRamBlock(ramInfo.usagePercent);
			
			// Should provide a valid braille character
			let validBraille = ['⣀', '⣄', '⣤', '⣶', '⣷', '⣿'];
			assert.ok(validBraille.includes(ramBlock), 'Should return valid braille character');
			
			// Usage should correlate with braille intensity
			if (ramInfo.usagePercent < 10) {
				assert.strictEqual(ramBlock, '⣀', 'Low usage should show minimal braille');
			} else if (ramInfo.usagePercent >= 80) {
				assert.strictEqual(ramBlock, '⣿', 'High usage should show full braille');
			}
		});
	});
});
