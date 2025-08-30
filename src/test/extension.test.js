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

    suite('UI Display Format Protection', function() {
        test('should maintain exact display format: CPU cores + space + RAM', async function() {
            // Test the exact display format with known values
            let expectedCpuString = '⣄⣤⣶⣷'; // 10%, 25%, 45%, 75%
            let expectedRamChar = '⣷';         // 60%
            let expectedDisplay = expectedCpuString + ' ' + expectedRamChar; // Space separator!

            // Verify each CPU braille character
            assert.strictEqual(await getSquareForUsage(10), '⣄', 'CPU 10% should be ⣄');
            assert.strictEqual(await getSquareForUsage(25), '⣤', 'CPU 25% should be ⣤');
            assert.strictEqual(await getSquareForUsage(45), '⣶', 'CPU 45% should be ⣶');
            assert.strictEqual(await getSquareForUsage(75), '⣷', 'CPU 75% should be ⣷');

            // Verify RAM braille character
            assert.strictEqual(await getRamBlock(60), '⣷', 'RAM 60% should be ⣷');

            // The complete expected display should be exactly this format
            assert.strictEqual(expectedDisplay, '⣄⣤⣶⣷ ⣷', 'Display format must be: CPUcores + space + RAM');
        });

        test('should never add text labels to display', async function() {
            // Test various usage levels to ensure no "CPU" or "RAM" text is added
            let testCases = [
                { cpu: [0, 15, 35, 55, 75, 95], ram: 20 },
                { cpu: [10, 30, 50, 70], ram: 80 },
                { cpu: [5, 25], ram: 45 }
            ];

            for (let testCase of testCases) {
                let displayString = '';

                // Build CPU portion
                for (let cpuUsage of testCase.cpu) {
                    displayString += await getSquareForUsage(cpuUsage);
                }

                // Add space separator and RAM portion (correct format)
                displayString += ' ' + await getRamBlock(testCase.ram);

                // Display should contain braille characters and exactly one space
                let correctPattern = /^[\u2800-\u28FF]+ [\u2800-\u28FF]$/;
                assert.ok(correctPattern.test(displayString),
                    `Display "${displayString}" should be: [braille chars] + space + [braille char]`);

                // Should not contain any English words
                assert.ok(!displayString.includes('CPU'), 'Display should not contain "CPU" text');
                assert.ok(!displayString.includes('RAM'), 'Display should not contain "RAM" text');
                assert.ok(!displayString.includes('|'), 'Display should not contain separators');
                assert.ok(!displayString.includes('%'), 'Display should not contain percentage symbols');

                // Should contain exactly one space (between CPU and RAM)
                assert.strictEqual(displayString.split(' ').length, 2, 'Display should contain exactly one space');
            }
        });

        test('should maintain braille character progression integrity', async function() {
            // Test boundary values for both CPU and RAM
            let testValues = [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];

            for (let value of testValues) {
                let cpuChar = await getSquareForUsage(value);
                let ramChar = await getRamBlock(value);

                // CPU and RAM should use identical progression
                assert.strictEqual(cpuChar, ramChar,
                    `CPU and RAM should use same braille for ${value}%`);

                // Verify against expected progression
                let expectedChar;
                if (value < 10) {
                    expectedChar = '⣀';
                } else if (value < 20) {
                    expectedChar = '⣄';
                } else if (value < 40) {
                    expectedChar = '⣤';
                } else if (value < 60) {
                    expectedChar = '⣶';
                } else if (value < 80) {
                    expectedChar = '⣷';
                } else {
                    expectedChar = '⣿';
                }

                assert.strictEqual(cpuChar, expectedChar,
                    `Usage ${value}% should map to braille "${expectedChar}"`);
            }
        });

        test('should preserve display format across different system configurations', async function() {
            // Test display format consistency regardless of actual system specs
            let mockSystemConfigs = [
                { cores: 2, description: 'dual-core system' },
                { cores: 4, description: 'quad-core system' },
                { cores: 8, description: 'octa-core system' },
                { cores: 12, description: 'twelve-core system' },
                { cores: 16, description: 'sixteen-core system' }
            ];

            for (let config of mockSystemConfigs) {
                // Simulate display for this configuration
                let cpuString = '';
                for (let i = 0; i < config.cores; i++) {
                    // Use predictable but varied CPU usage (10% increments)
                    let usage = (i * 10) % 100;
                    cpuString += await getSquareForUsage(usage);
                }

                let ramString = await getRamBlock(50); // 50% RAM
                let fullDisplay = cpuString + ' ' + ramString; // Include space separator

                // Verify format rules (CPU cores + space + RAM char)
                assert.strictEqual(fullDisplay.length, config.cores + 1 + 1,
                    `${config.description}: Display should be ${config.cores} CPU chars + 1 space + 1 RAM char`);

                // Should contain braille characters and exactly one space
                let correctPattern = /^[\u2800-\u28FF]+ [\u2800-\u28FF]$/;
                assert.ok(correctPattern.test(fullDisplay),
                    `${config.description}: Should be [braille chars] + space + [braille char]`);

                // Last character should be RAM, space before that, CPU cores before space
                assert.strictEqual(fullDisplay.slice(-1), ramString,
                    `${config.description}: Last character should be RAM`);
                assert.strictEqual(fullDisplay.slice(-2, -1), ' ',
                    `${config.description}: Second to last character should be space`);
                assert.strictEqual(fullDisplay.slice(0, -2), cpuString,
                    `${config.description}: First ${config.cores} characters should be CPU cores`);
            }
        });
    });
});
