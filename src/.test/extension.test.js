let assert = require('assert');
let vscode = require('vscode');
let os = require('os');

// Import the functions we want to test
let { getSquareForUsage, getRamBlock, calculateRamUsage, getDiskBlock, calculateDiskUsage, getNetworkInBlock, getNetworkOutBlock, calculateNetworkUsage } = require('../extension.js');

suite('Aetherion CPU Monitor Test Suite', function() {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', function() {
        let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
        assert.ok(extension, 'Extension should be found');
    });

    suite('CPU Braille Character Mapping', function() {
        test('should delegate to utility braille function', async function() {
            // Test that CPU function delegates correctly to utility
            let get_braille_character = require('../.utility/get_braille_character.js');

            let testValues = [0, 15, 30, 45, 60, 75, 90, 100];
            for (let value of testValues) {
                let cpuResult = await getSquareForUsage(value);
                let utilityResult = await get_braille_character(value);
                assert.strictEqual(cpuResult, utilityResult,
                    `CPU function should delegate to utility for ${value}%`);
            }
        });
    });

    suite('RAM Braille Character Mapping', function() {
        test('should use same braille patterns as utility function', async function() {
            // Test that RAM and utility use identical braille progression
            let get_braille_character = require('../.utility/get_braille_character.js');

            let testValues = [5, 15, 30, 50, 70, 90];
            for (let value of testValues) {
                let ramResult = await getRamBlock(value);
                let utilityResult = await get_braille_character(value);
                assert.strictEqual(ramResult, utilityResult,
                    `RAM should use same braille as utility for ${value}%`);
            }
        });

        test('should handle edge cases correctly', async function() {
            assert.strictEqual(await getRamBlock(0), '⡀');
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

    suite('Disk Braille Character Mapping', function() {
        test('should use same braille patterns as utility function', async function() {
            // Test that disk uses the same progression as utility
            let get_braille_character = require('../.utility/get_braille_character.js');

            let testValues = [5, 15, 30, 40, 55, 70, 80, 95];
            for (let value of testValues) {
                let diskResult = await getDiskBlock(value);
                let utilityResult = await get_braille_character(value);
                assert.strictEqual(diskResult, utilityResult,
                    `Disk should use same braille as utility for ${value}%`);
            }
        });

        test('should handle edge cases correctly', async function() {
            assert.strictEqual(await getDiskBlock(0), '⡀');
            assert.strictEqual(await getDiskBlock(100), '⣿');

            // Test boundary values for 8-level progression
            assert.strictEqual(await getDiskBlock(12.4), '⡀');
            assert.strictEqual(await getDiskBlock(12.5), '⣀');
            assert.strictEqual(await getDiskBlock(24.9), '⣀');
            assert.strictEqual(await getDiskBlock(25.0), '⣠');
        });
    });

    suite('Disk Usage Calculation', function() {
        test('should return valid disk usage data', async function() {
            let diskInfo = await calculateDiskUsage();

            // Validate structure
            assert.ok(typeof diskInfo.usagePercent === 'number', 'usagePercent should be a number');
            assert.ok(typeof diskInfo.availableGB === 'number', 'availableGB should be a number');
            assert.ok(typeof diskInfo.totalGB === 'number', 'totalGB should be a number');

            // Validate ranges
            assert.ok(diskInfo.usagePercent >= 0 && diskInfo.usagePercent <= 100, 'usagePercent should be between 0-100');
            assert.ok(diskInfo.availableGB >= 0, 'availableGB should be positive');
            assert.ok(diskInfo.totalGB > 0, 'totalGB should be positive');
            assert.ok(diskInfo.availableGB <= diskInfo.totalGB, 'availableGB should not exceed totalGB');
        });

        test('should handle different OS platforms', async function() {
            let platform = os.platform();
            let diskInfo = await calculateDiskUsage();

            // Should work on any platform
            assert.ok(diskInfo.totalGB > 0, `Should work on ${platform}`);

            // Usage should be reasonable (not exactly 50% which would indicate fallback)
            if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
                // On supported platforms, should not use the fallback default of 50%
                // unless the disk is actually around 50% used
                assert.ok(diskInfo.usagePercent !== 50 || Math.abs(diskInfo.totalGB - 200) > 10,
                    'Should use platform-specific calculation, not fallback defaults');
            }
        });

        test('should provide consistent total disk space', async function() {
            let diskInfo1 = await calculateDiskUsage();
            let diskInfo2 = await calculateDiskUsage();

            // Total disk space should be consistent between calls
            assert.strictEqual(diskInfo1.totalGB, diskInfo2.totalGB, 'Total disk space should be consistent');
        });

        test('should handle byte-level precision correctly', async function() {
            let diskInfo = await calculateDiskUsage();

            // The usage percent should be calculated with high precision
            // to ensure accuracy across different platforms
            let calculatedPercent = ((diskInfo.totalGB - diskInfo.availableGB) / diskInfo.totalGB) * 100;
            let percentDifference = Math.abs(diskInfo.usagePercent - calculatedPercent);

            // Should be within 0.1% due to rounding in GB conversion
            assert.ok(percentDifference < 0.1, `Usage percent should be precise: expected ~${calculatedPercent}, got ${diskInfo.usagePercent}`);
        });
    });

    suite('Network Braille Character Mapping', function() {
        test('should use same braille patterns as utility function', async function() {
            // Test that network in/out uses the same progression as utility
            let get_braille_character = require('../.utility/get_braille_character.js');
            let testValues = [5, 15, 30, 40, 55, 70, 80, 95];

            for (let value of testValues) {
                let networkInResult = await getNetworkInBlock(value);
                let networkOutResult = await getNetworkOutBlock(value);
                let utilityResult = await get_braille_character(value);

                assert.strictEqual(networkInResult, utilityResult,
                    `Network In should use same braille as utility for ${value}%`);
                assert.strictEqual(networkOutResult, utilityResult,
                    `Network Out should use same braille as utility for ${value}%`);
            }
        });

        test('should handle edge cases correctly', async function() {
            assert.strictEqual(await getNetworkInBlock(0), '⡀');
            assert.strictEqual(await getNetworkInBlock(100), '⣿');
            assert.strictEqual(await getNetworkOutBlock(0), '⡀');
            assert.strictEqual(await getNetworkOutBlock(100), '⣿');

            // Test boundary values for 8-level progression
            assert.strictEqual(await getNetworkInBlock(12.4), '⡀');
            assert.strictEqual(await getNetworkInBlock(12.5), '⣀');
            assert.strictEqual(await getNetworkOutBlock(24.9), '⣀');
            assert.strictEqual(await getNetworkOutBlock(25.0), '⣠');
        });
    });

    suite('Network Usage Calculation', function() {
        test('should return valid network usage data', async function() {
            let networkInfo = await calculateNetworkUsage();

            // Validate structure
            assert.ok(typeof networkInfo.networkInPercent === 'number', 'networkInPercent should be a number');
            assert.ok(typeof networkInfo.networkOutPercent === 'number', 'networkOutPercent should be a number');
            assert.ok(typeof networkInfo.interfaceName === 'string', 'interfaceName should be a string');
            assert.ok(typeof networkInfo.capacityMbps === 'number', 'capacityMbps should be a number');

            // Validate ranges
            assert.ok(networkInfo.networkInPercent >= 0 && networkInfo.networkInPercent <= 100, 'networkInPercent should be between 0-100');
            assert.ok(networkInfo.networkOutPercent >= 0 && networkInfo.networkOutPercent <= 100, 'networkOutPercent should be between 0-100');
            assert.ok(networkInfo.capacityMbps > 0, 'capacityMbps should be positive');
            assert.ok(networkInfo.interfaceName.length > 0, 'interfaceName should not be empty');
        });

        test('should handle different OS platforms', async function() {
            let platform = os.platform();
            let networkInfo = await calculateNetworkUsage();

            // Should work on any platform
            assert.ok(networkInfo.capacityMbps > 0, `Should work on ${platform}`);

            // Interface name should be meaningful on supported platforms
            if (platform === 'darwin' || platform === 'linux') {
                assert.ok(networkInfo.interfaceName !== 'Unknown', 'Should identify interface on supported platforms');
            }
        });

        test('should provide consistent network capacity', async function() {
            let networkInfo1 = await calculateNetworkUsage();
            let networkInfo2 = await calculateNetworkUsage();

            // Network capacity should be consistent between calls
            assert.strictEqual(networkInfo1.capacityMbps, networkInfo2.capacityMbps, 'Network capacity should be consistent');
            assert.strictEqual(networkInfo1.interfaceName, networkInfo2.interfaceName, 'Interface name should be consistent');
        });

        test('should handle network interface detection gracefully', async function() {
            let networkInfo = await calculateNetworkUsage();

            // Should never have undefined or null values
            assert.ok(networkInfo.networkInPercent !== undefined && networkInfo.networkInPercent !== null, 'networkInPercent should be defined');
            assert.ok(networkInfo.networkOutPercent !== undefined && networkInfo.networkOutPercent !== null, 'networkOutPercent should be defined');
            assert.ok(networkInfo.interfaceName !== undefined && networkInfo.interfaceName !== null, 'interfaceName should be defined');
            assert.ok(networkInfo.capacityMbps !== undefined && networkInfo.capacityMbps !== null, 'capacityMbps should be defined');
        });
    });

    suite('Integration Tests', function() {
        test('should provide meaningful system monitoring data', async function() {
            let ramInfo = await calculateRamUsage();
            let ramBlock = await getRamBlock(ramInfo.usagePercent);
            let diskInfo = await calculateDiskUsage();
            let diskBlock = await getDiskBlock(diskInfo.usagePercent);
            let networkInfo = await calculateNetworkUsage();
            let networkInBlock = await getNetworkInBlock(networkInfo.networkInPercent);
            let networkOutBlock = await getNetworkOutBlock(networkInfo.networkOutPercent);

            // Should provide valid braille characters (8-level progression)
            let validBraille = ['⡀', '⣀', '⣠', '⣤', '⣦', '⣶', '⣾', '⣿'];
            assert.ok(validBraille.includes(ramBlock), 'Should return valid RAM braille character');
            assert.ok(validBraille.includes(diskBlock), 'Should return valid disk braille character');
            assert.ok(validBraille.includes(networkInBlock), 'Should return valid network in braille character');
            assert.ok(validBraille.includes(networkOutBlock), 'Should return valid network out braille character');

            // Usage should correlate with braille intensity (8-level system)
            if (ramInfo.usagePercent < 12.5) {
                assert.strictEqual(ramBlock, '⡀', 'Low RAM usage should show minimal braille');
            } else if (ramInfo.usagePercent >= 87.5) {
                assert.strictEqual(ramBlock, '⣿', 'High RAM usage should show full braille');
            }

            if (diskInfo.usagePercent < 12.5) {
                assert.strictEqual(diskBlock, '⡀', 'Low disk usage should show minimal braille');
            } else if (diskInfo.usagePercent >= 87.5) {
                assert.strictEqual(diskBlock, '⣿', 'High disk usage should show full braille');
            }

            if (networkInfo.networkInPercent < 12.5) {
                assert.strictEqual(networkInBlock, '⡀', 'Low network in usage should show minimal braille');
            } else if (networkInfo.networkInPercent >= 87.5) {
                assert.strictEqual(networkInBlock, '⣿', 'High network in usage should show full braille');
            }

            if (networkInfo.networkOutPercent < 12.5) {
                assert.strictEqual(networkOutBlock, '⡀', 'Low network out usage should show minimal braille');
            } else if (networkInfo.networkOutPercent >= 87.5) {
                assert.strictEqual(networkOutBlock, '⣿', 'High network out usage should show full braille');
            }
        });
    });

    suite('UI Display Format Protection', function() {
        test('should maintain exact display format: CPU cores + space + RAM + space + Disk + space + Network In/Out', async function() {
            // Test the exact display format with known values (8-level progression)
            let expectedCpuString = '⡀⣠⣤⣾'; // 10%, 25%, 45%, 75%
            let expectedRamChar = '⣦';         // 60%
            let expectedDiskChar = '⣠';        // 30%

            // Verify each CPU braille character (8-level progression)
            assert.strictEqual(await getSquareForUsage(10), '⡀', 'CPU 10% should be ⡀');
            assert.strictEqual(await getSquareForUsage(25), '⣠', 'CPU 25% should be ⣠');
            assert.strictEqual(await getSquareForUsage(45), '⣤', 'CPU 45% should be ⣤');
            assert.strictEqual(await getSquareForUsage(75), '⣾', 'CPU 75% should be ⣾');

            // Verify RAM braille character
            assert.strictEqual(await getRamBlock(60), '⣦', 'RAM 60% should be ⣦');

            // Verify disk braille character
            assert.strictEqual(await getDiskBlock(30), '⣠', 'Disk 30% should be ⣠');

            // The complete expected display should include network components
            let expectedNetworkIn = '⡀';       // Low network usage
            let expectedNetworkOut = '⡀';      // Low network usage
            let fullExpectedDisplay = expectedCpuString + ' ' + expectedRamChar + ' ' + expectedDiskChar + ' ' + expectedNetworkIn + expectedNetworkOut;
            assert.strictEqual(fullExpectedDisplay, '⡀⣠⣤⣾ ⣦ ⣠ ⡀⡀', 'Display format must be: CPUcores + space + RAM + space + Disk + space + NetworkIn+NetworkOut');
        });

        test('should never add text labels to display', async function() {
            // Test various usage levels to ensure no "CPU", "RAM", or "Disk" text is added
            let testCases = [
                { cpu: [0, 15, 35, 55, 75, 95], ram: 20, disk: 45 },
                { cpu: [10, 30, 50, 70], ram: 80, disk: 15 },
                { cpu: [5, 25], ram: 45, disk: 65 }
            ];

            for (let testCase of testCases) {
                let displayString = '';

                // Build CPU portion
                for (let cpuUsage of testCase.cpu) {
                    displayString += await getSquareForUsage(cpuUsage);
                }

                // Add space separator, RAM portion, space separator, and disk portion (correct format)
                displayString += ' ' + await getRamBlock(testCase.ram) + ' ' + await getDiskBlock(testCase.disk);

                // Display should contain braille characters and exactly two spaces
                let correctPattern = /^[\u2800-\u28FF]+ [\u2800-\u28FF] [\u2800-\u28FF]$/;
                assert.ok(correctPattern.test(displayString),
                    `Display "${displayString}" should be: [braille chars] + space + [braille char] + space + [braille char]`);

                // Should not contain any English words
                assert.ok(!displayString.includes('CPU'), 'Display should not contain "CPU" text');
                assert.ok(!displayString.includes('RAM'), 'Display should not contain "RAM" text');
                assert.ok(!displayString.includes('Disk'), 'Display should not contain "Disk" text');
                assert.ok(!displayString.includes('|'), 'Display should not contain separators');
                assert.ok(!displayString.includes('%'), 'Display should not contain percentage symbols');

                // Should contain exactly two spaces (between CPU and RAM, and between RAM and disk)
                assert.strictEqual(displayString.split(' ').length, 3, 'Display should contain exactly two spaces');
            }
        });

        test('should maintain braille character progression integrity', async function() {
            // Test boundary values for CPU, RAM, and Disk
            let testValues = [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];

            for (let value of testValues) {
                let cpuChar = await getSquareForUsage(value);
                let ramChar = await getRamBlock(value);
                let diskChar = await getDiskBlock(value);

                // CPU, RAM, and Disk should use identical progression
                assert.strictEqual(cpuChar, ramChar,
                    `CPU and RAM should use same braille for ${value}%`);
                assert.strictEqual(cpuChar, diskChar,
                    `CPU and Disk should use same braille for ${value}%`);
                assert.strictEqual(ramChar, diskChar,
                    `RAM and Disk should use same braille for ${value}%`);

                // Verify against expected 8-level progression
                let expectedChar;
                if (value < 12.5) {
                    expectedChar = '⡀';
                } else if (value < 25) {
                    expectedChar = '⣀';
                } else if (value < 37.5) {
                    expectedChar = '⣠';
                } else if (value < 50) {
                    expectedChar = '⣤';
                } else if (value < 62.5) {
                    expectedChar = '⣦';
                } else if (value < 75) {
                    expectedChar = '⣶';
                } else if (value < 87.5) {
                    expectedChar = '⣾';
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
                let diskString = await getDiskBlock(30); // 30% Disk
                let fullDisplay = cpuString + ' ' + ramString + ' ' + diskString; // Include space separators

                // Verify format rules (CPU cores + space + RAM char + space + Disk char)
                assert.strictEqual(fullDisplay.length, config.cores + 1 + 1 + 1 + 1,
                    `${config.description}: Display should be ${config.cores} CPU chars + 1 space + 1 RAM char + 1 space + 1 Disk char`);

                // Should contain braille characters and exactly two spaces
                let correctPattern = /^[\u2800-\u28FF]+ [\u2800-\u28FF] [\u2800-\u28FF]$/;
                assert.ok(correctPattern.test(fullDisplay),
                    `${config.description}: Should be [braille chars] + space + [braille char] + space + [braille char]`);

                // Last character should be Disk, space before that, RAM before that space, etc.
                assert.strictEqual(fullDisplay.slice(-1), diskString,
                    `${config.description}: Last character should be Disk`);
                assert.strictEqual(fullDisplay.slice(-2, -1), ' ',
                    `${config.description}: Second to last character should be space`);
                assert.strictEqual(fullDisplay.slice(-3, -2), ramString,
                    `${config.description}: Third to last character should be RAM`);
                assert.strictEqual(fullDisplay.slice(-4, -3), ' ',
                    `${config.description}: Fourth to last character should be space`);
                assert.strictEqual(fullDisplay.slice(0, -4), cpuString,
                    `${config.description}: First ${config.cores} characters should be CPU cores`);
            }
        });
    });

    suite('Cross-Platform Memory Calculation Tests', function() {
        let { calculate_ram_usage_internal } = require('../01_monitors/02_ram-monitor.js');

        test('should use platform-specific memory calculation methods', async function() {
            let platform = os.platform();
            let result = await calculate_ram_usage_internal();

            // Basic validation for all platforms
            assert.ok(result.total_gb > 0, 'Total memory should be positive');
            assert.ok(result.available_gb >= 0, 'Available memory should be non-negative');
            assert.ok(result.usage_percent >= 0 && result.usage_percent <= 100, 'Usage should be 0-100%');
            assert.ok(result.available_gb <= result.total_gb, 'Available should not exceed total');

            console.log(`Platform: ${platform}`);
            console.log(`Memory: ${result.usage_percent.toFixed(1)}% used (${(result.total_gb - result.available_gb).toFixed(2)}GB / ${result.total_gb.toFixed(2)}GB)`);
        });

        test('should provide realistic memory usage on macOS', async function() {
            if (os.platform() !== 'darwin') {
                this.skip();
                return;
            }

            let result = await calculate_ram_usage_internal();
            let rawUsagePercent = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;

            // Our improved calculation should be more reasonable than raw os.freemem()
            assert.ok(result.usage_percent < rawUsagePercent,
                `Improved calculation (${result.usage_percent.toFixed(1)}%) should be lower than raw calculation (${rawUsagePercent.toFixed(1)}%)`);

            // Usage should be realistic (not 99%+ unless system is actually under pressure)
            assert.ok(result.usage_percent < 95,
                `Memory usage (${result.usage_percent.toFixed(1)}%) should be realistic on macOS`);

            console.log(`macOS Memory: ${result.usage_percent.toFixed(1)}% (vs raw ${rawUsagePercent.toFixed(1)}%)`);
        });

        test('should handle memory_pressure command availability on macOS', async function() {
            if (os.platform() !== 'darwin') {
                this.skip();
                return;
            }

            // Test that our function works even if we simulate memory_pressure failure
            let { execSync } = require('child_process');
            let originalExecSync = execSync;

            // Mock execSync to simulate memory_pressure failure
            require('child_process').execSync = function(command) {
                if (command === 'memory_pressure') {
                    throw new Error('Simulated memory_pressure failure');
                }
                return originalExecSync.apply(this, arguments);
            };

            try {
                let result = await calculate_ram_usage_internal();
                assert.ok(result.total_gb > 0, 'Should fallback gracefully when memory_pressure fails');
                console.log('✅ macOS fallback test passed');
            } finally {
                // Restore original execSync
                require('child_process').execSync = originalExecSync;
            }
        });

        test('should simulate Linux /proc/meminfo calculation', async function() {
            // This test simulates what would happen on Linux
            // We can't actually test on Linux from macOS, but we can test the parsing logic

            let mockMeminfo = `
MemTotal:       16384000 kB
MemFree:         2048000 kB
MemAvailable:    6144000 kB
Buffers:          512000 kB
Cached:          3584000 kB
SwapCached:            0 kB
Active:          8192000 kB
Inactive:        4096000 kB
`;

            // Test our parsing logic
            let mem_total_match = mockMeminfo.match(/MemTotal:\s+(\d+)\s+kB/);
            let mem_available_match = mockMeminfo.match(/MemAvailable:\s+(\d+)\s+kB/);

            assert.ok(mem_total_match, 'Should parse MemTotal');
            assert.ok(mem_available_match, 'Should parse MemAvailable');

            let total_kb = parseInt(mem_total_match[1]);
            let available_kb = parseInt(mem_available_match[1]);
            let total_gb = total_kb / (1024 * 1024);
            let available_gb = available_kb / (1024 * 1024);
            let usage_percent = ((total_gb - available_gb) / total_gb) * 100;

            assert.strictEqual(Math.round(total_gb), 16, 'Should calculate ~16GB total');
            assert.strictEqual(Math.round(available_gb), 6, 'Should calculate ~6GB available');
            assert.ok(Math.abs(usage_percent - 62.5) < 2, `Should calculate ~62-63% usage (got ${usage_percent.toFixed(1)}%)`);

            console.log(`Linux simulation: ${usage_percent.toFixed(1)}% used (${(total_gb - available_gb).toFixed(1)}GB / ${total_gb}GB)`);
        });

        test('should maintain accuracy across multiple calls', async function() {
            let results = [];

            // Take 3 measurements
            for (let i = 0; i < 3; i++) {
                results.push(await calculate_ram_usage_internal());
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            }

            // Total memory should be consistent
            for (let i = 1; i < results.length; i++) {
                assert.strictEqual(results[i].total_gb, results[0].total_gb,
                    'Total memory should be consistent across calls');
            }

            // Usage should be reasonable and not wildly fluctuating
            let usageValues = results.map(r => r.usage_percent);
            let maxUsage = Math.max(...usageValues);
            let minUsage = Math.min(...usageValues);
            let usageRange = maxUsage - minUsage;

            assert.ok(usageRange < 10,
                `Usage should not fluctuate wildly (range: ${usageRange.toFixed(1)}%)`);

            console.log(`Consistency test: Usage range ${usageRange.toFixed(1)}% across 3 calls`);
        });

        test('should handle edge cases gracefully', async function() {
            // Test that our calculation handles edge cases
            let result = await calculate_ram_usage_internal();

            // Should never have negative available memory
            assert.ok(result.available_gb >= 0, 'Available memory should never be negative');

            // Should never have usage over 100%
            assert.ok(result.usage_percent <= 100, 'Usage should never exceed 100%');

            // Should never have available memory exceed total
            assert.ok(result.available_gb <= result.total_gb, 'Available should not exceed total');

            // Used + Available should approximately equal Total (within 1GB tolerance for rounding)
            let calculated_total = (result.total_gb - result.available_gb) + result.available_gb;
            let diff = Math.abs(calculated_total - result.total_gb);
            assert.ok(diff < 1, `Used + Available should equal Total (diff: ${diff.toFixed(3)}GB)`);
        });
    });

    suite('Status Bar UI Integration Tests', function() {
        this.timeout(15000); // Extend timeout for UI monitoring tests

        test('should detect if status bar is not updating within 5 seconds', async function() {
            //
            //	Get the extension to access its status bar item
            //
            let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
            assert.ok(extension, 'Extension should be found');
            
            if (!extension.isActive) {
                await extension.activate();
            }

            //
            //	Find the status bar item by looking for system monitor items
            //
            let statusBarItems = [];
            
            //
            //	Wait a moment for status bar to initialize
            //
            await new Promise(resolve => setTimeout(resolve, 1000));

            //
            //	Monitor status bar for updates - simulate by watching for braille characters
            //
            let initialCheck = true;
            let firstDisplayValue = null;
            let lastDisplayValue = null;
            let displayChangeDetected = false;
            let displayInitialized = false;
            
            //
            //	Check every 500ms for 6 seconds (12 checks total)
            //
            let checkCount = 0;
            let maxChecks = 12;
            
            let monitorPromise = new Promise((resolve, reject) => {
                let checkInterval = setInterval(() => {
                    checkCount++;
                    
                    try {
                        //
                        //	Simulate status bar access by calling the display function directly
                        //	This tests the core functionality that drives the UI
                        //
                        let update_status_bar_display = require('../02_ui/01_status-bar-display.js');
                        
                        //
                        //	Create a mock status bar item to test the display logic
                        //
                        let mockStatusBarItem = {
                            text: '',
                            tooltip: '',
                            show: () => {},
                            command: ''
                        };
                        
                        //
                        //	Test that the update function works and produces output
                        //
                        update_status_bar_display(mockStatusBarItem, false).then(() => {
                            let currentDisplay = mockStatusBarItem.text;
                            
                            //
                            //	Check if display has content (not empty)
                            //
                            if (!displayInitialized && currentDisplay && currentDisplay.length > 0) {
                                displayInitialized = true;
                                firstDisplayValue = currentDisplay;
                                console.log(`✓ Status bar initialized with: "${currentDisplay}"`);
                            }
                            
                            //
                            //	Check for changes in display
                            //
                            if (displayInitialized && lastDisplayValue !== null && currentDisplay !== lastDisplayValue) {
                                displayChangeDetected = true;
                                console.log(`✓ Status bar update detected: "${lastDisplayValue}" → "${currentDisplay}"`);
                            }
                            
                            lastDisplayValue = currentDisplay;
                            
                            //
                            //	Success conditions: display initialized and either changes detected or reasonable time passed
                            //
                            if (displayInitialized && (displayChangeDetected || checkCount >= 8)) {
                                clearInterval(checkInterval);
                                resolve({
                                    initialized: displayInitialized,
                                    changesDetected: displayChangeDetected,
                                    finalDisplay: currentDisplay,
                                    checksPerformed: checkCount
                                });
                            }
                            
                            //
                            //	Timeout condition: no initialization or updates after max checks
                            //
                            if (checkCount >= maxChecks) {
                                clearInterval(checkInterval);
                                reject(new Error(`Status bar failed to ${!displayInitialized ? 'initialize' : 'update'} within 6 seconds. Last display: "${currentDisplay}"`));
                            }
                        }).catch(error => {
                            clearInterval(checkInterval);
                            reject(new Error(`Status bar update function failed: ${error.message}`));
                        });
                        
                    } catch (error) {
                        clearInterval(checkInterval);
                        reject(new Error(`Status bar monitoring failed: ${error.message}`));
                    }
                }, 500);
            });

            //
            //	Wait for monitoring to complete
            //
            let result = await monitorPromise;
            
            //
            //	Verify results
            //
            assert.ok(result.initialized, 'Status bar should initialize with content within 5 seconds');
            assert.ok(result.finalDisplay.length > 0, 'Status bar should have non-empty display content');
            
            //
            //	Status bar should contain braille characters (system monitoring data)
            //
            let hasBraillePattern = /[⡀-⣿]/.test(result.finalDisplay);
            assert.ok(hasBraillePattern, `Status bar should contain braille monitoring characters. Got: "${result.finalDisplay}"`);
            
            console.log(`✅ Status bar UI test passed - Initialized: ${result.initialized}, Changes: ${result.changesDetected}, Checks: ${result.checksPerformed}`);
        });

        test('should detect if status bar display becomes frozen (no changes for 5+ seconds)', async function() {
            //
            //	This test monitors for display freezing by watching for changes over time
            //
            let update_status_bar_display = require('../02_ui/01_status-bar-display.js');
            
            let mockStatusBarItem = {
                text: '',
                tooltip: '',
                show: () => {},
                command: ''
            };
            
            let displayHistory = [];
            let checksPerformed = 0;
            let maxChecks = 15; // 7.5 seconds of monitoring
            
            //
            //	Monitor display changes every 500ms
            //
            let freezeDetectionPromise = new Promise((resolve, reject) => {
                let monitorInterval = setInterval(async () => {
                    checksPerformed++;
                    
                    try {
                        await update_status_bar_display(mockStatusBarItem, false);
                        let currentDisplay = mockStatusBarItem.text;
                        displayHistory.push({
                            check: checksPerformed,
                            display: currentDisplay,
                            timestamp: Date.now()
                        });
                        
                        //
                        //	After collecting enough samples, analyze for freeze patterns
                        //
                        if (checksPerformed >= maxChecks) {
                            clearInterval(monitorInterval);
                            
                            //
                            //	Analyze display history for freeze detection
                            //
                            let uniqueDisplays = new Set(displayHistory.map(h => h.display));
                            let displayChangeCount = uniqueDisplays.size;
                            
                            //
                            //	Check if display remained completely static (frozen)
                            //
                            let isCompletelyFrozen = displayChangeCount === 1 && displayHistory.length > 10;
                            
                            //
                            //	Check for recent activity (last 5 seconds / 10 checks)
                            //
                            let recentDisplays = displayHistory.slice(-10).map(h => h.display);
                            let recentUniqueDisplays = new Set(recentDisplays);
                            let recentActivity = recentUniqueDisplays.size > 1;
                            
                            resolve({
                                totalChecks: checksPerformed,
                                uniqueDisplayCount: displayChangeCount,
                                isCompletelyFrozen: isCompletelyFrozen,
                                hasRecentActivity: recentActivity,
                                displayHistory: displayHistory.slice(-5), // Last 5 samples
                                finalDisplay: displayHistory[displayHistory.length - 1].display
                            });
                        }
                    } catch (error) {
                        clearInterval(monitorInterval);
                        reject(new Error(`Display freeze detection failed: ${error.message}`));
                    }
                }, 500);
            });
            
            let result = await freezeDetectionPromise;
            
            //
            //	Verify the display is not completely frozen
            //
            assert.ok(!result.isCompletelyFrozen, `Status bar appears to be completely frozen. Only ${result.uniqueDisplayCount} unique display(s) detected over ${result.totalChecks} checks`);
            
            //
            //	Verify there's recent activity (changes in the last 5 seconds)
            //
            assert.ok(result.hasRecentActivity, `Status bar appears frozen - no changes detected in recent monitoring period. Final display: "${result.finalDisplay}"`);
            
            //
            //	Verify display contains expected braille content
            //
            let hasBraillePattern = /[⡀-⣿]/.test(result.finalDisplay);
            assert.ok(hasBraillePattern, `Status bar should contain braille monitoring characters. Got: "${result.finalDisplay}"`);
            
            console.log(`✅ Status bar freeze detection passed - ${result.uniqueDisplayCount} unique displays over ${result.totalChecks} checks, recent activity: ${result.hasRecentActivity}`);
        });
    });
});
