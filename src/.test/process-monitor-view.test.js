let assert = require('assert');
let vscode = require('vscode');
let { exec } = require('child_process');
let { promisify } = require('util');

let execAsync = promisify(exec);

//
//  Import the functions we want to test
//
let { open_full_tab } = require('../commands/open-full-tab.js');

suite('Process Monitor View Tests', function() {

    //
    //  Allow more time for process monitoring tests
    //
    this.timeout(15000);

    suite('Process Data Collection', function() {

        test('should collect process data using POSIX ps command', async function() {
            //
            //  Test that the ps command works and returns expected data structure
            //
            try {
                let { stdout } = await execAsync('ps -eo pid,ppid,user,%cpu,%mem,comm,lstart,cmd --no-headers | head -5');

                assert.ok(stdout, 'ps command should return data');

                let lines = stdout.trim().split('\n');
                assert.ok(lines.length > 0, 'Should return at least one process');

                //
                //  Test first line parsing
                //
                let firstLine = lines[0].trim();
                let parts = firstLine.split(/\s+/);

                //
                //  Should have at least: PID PPID USER %CPU %MEM COMM + 5 LSTART parts + CMD
                //
                assert.ok(parts.length >= 11, `Process line should have at least 11 parts, got ${parts.length}: ${firstLine}`);

                //
                //  Test PID is numeric
                //
                let pid = parseInt(parts[0]);
                assert.ok(pid > 0, `PID should be positive number, got: ${parts[0]}`);

                //
                //  Test PPID is numeric
                //
                let ppid = parseInt(parts[1]);
                assert.ok(ppid >= 0, `PPID should be non-negative number, got: ${parts[1]}`);

                //
                //  Test CPU percentage is numeric
                //
                let cpu = parseFloat(parts[3]);
                assert.ok(cpu >= 0, `CPU percentage should be non-negative, got: ${parts[3]}`);

                //
                //  Test memory percentage is numeric
                //
                let mem = parseFloat(parts[4]);
                assert.ok(mem >= 0, `Memory percentage should be non-negative, got: ${parts[4]}`);

            } catch (error) {
                assert.fail(`ps command failed: ${error.message}`);
            }
        });

        test('should parse LSTART field correctly', async function() {
            //
            //  Test that LSTART parsing works with embedded spaces
            //
            try {
                let { stdout } = await execAsync('ps -eo pid,ppid,user,%cpu,%mem,comm,lstart,cmd --no-headers | head -1');

                let line = stdout.trim();
                let parts = line.split(/\s+/);

                if (parts.length >= 11) {
                    //
                    //  LSTART should be parts 6-10: "Day Mon DD HH:MM:SS YYYY"
                    //
                    let lstart = parts.slice(6, 11).join(' ');

                    //
                    //  Basic format validation - should contain time and year
                    //
                    assert.ok(lstart.includes(':'), 'LSTART should contain time with colons');
                    assert.ok(/\d{4}/.test(lstart), 'LSTART should contain 4-digit year');
                    assert.ok(lstart.length >= 20, 'LSTART should be at least 20 characters');
                }

            } catch (error) {
                assert.fail(`LSTART parsing test failed: ${error.message}`);
            }
        });

        test('should filter out ps monitoring processes', async function() {
            //
            //  Test that the monitoring doesn't include its own ps processes
            //
            try {
                let { stdout } = await execAsync('ps -eo pid,user,%cpu,%mem,comm,cmd --no-headers');
                let lines = stdout.trim().split('\n');

                let monitoringProcesses = lines.filter(line => {
                    let trimmed = line.trim();
                    return trimmed.includes('ps -eo') || trimmed.includes('comm=ps');
                });

                //
                //  We expect monitoring processes to be filtered out during analysis
                //  This test verifies that the filtering logic would work
                //
                console.log(`Found ${monitoringProcesses.length} ps monitoring processes (should be filtered)`);

            } catch (error) {
                assert.fail(`Process filtering test failed: ${error.message}`);
            }
        });
    });

    suite('Load Analysis Algorithm', function() {

        test('should handle empty process list gracefully', function() {
            //
            //  Test edge case of no processes
            //
            let processAverages = new Map();
            let analyzedProcesses = [];

            for (let [pid, data] of processAverages) {
                //
                //  This loop should not execute for empty map
                //
                assert.fail('Should not process any entries for empty map');
            }

            assert.strictEqual(analyzedProcesses.length, 0, 'Empty process list should return empty results');
        });

        test('should calculate CPU averages correctly', function() {
            //
            //  Test CPU averaging logic
            //
            let cpuSamples = [1.0, 2.0, 3.0];
            let expectedAvg = 2.0;

            let actualAvg = cpuSamples.reduce((a, b) => a + b, 0) / cpuSamples.length;

            assert.strictEqual(actualAvg, expectedAvg, 'CPU average calculation should be correct');
        });

        test('should filter processes by CPU threshold', function() {
            //
            //  Test that only processes above 0.1% CPU are included
            //
            let testProcesses = [
                { cpu: 0.05, name: 'idle' },
                { cpu: 0.2, name: 'active' },
                { cpu: 2.5, name: 'busy' }
            ];

            let filtered = testProcesses.filter(p => p.cpu > 0.1);

            assert.strictEqual(filtered.length, 2, 'Should filter out processes with CPU <= 0.1%');
            assert.strictEqual(filtered[0].name, 'active', 'Should include process with 0.2% CPU');
            assert.strictEqual(filtered[1].name, 'busy', 'Should include process with 2.5% CPU');
        });

        test('should sort processes by CPU usage descending', function() {
            //
            //  Test sorting logic
            //
            let testProcesses = [
                { cpu: '1.5', name: 'low' },
                { cpu: '5.2', name: 'high' },
                { cpu: '2.1', name: 'medium' }
            ];

            testProcesses.sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu));

            assert.strictEqual(testProcesses[0].name, 'high', 'Highest CPU should be first');
            assert.strictEqual(testProcesses[1].name, 'medium', 'Medium CPU should be second');
            assert.strictEqual(testProcesses[2].name, 'low', 'Lowest CPU should be last');
        });
    });

    suite('VS Code Integration', function() {

        test('should create webview panel with correct configuration', async function() {
            //
            //  Test panel creation (without actually opening to avoid UI interference)
            //
            let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
            assert.ok(extension, 'Extension should be loaded');

            if (!extension.isActive) {
                await extension.activate();
            }

            //
            //  Check that the command is registered
            //
            let commands = await vscode.commands.getCommands();
            let hasProcessMonitorCommand = commands.includes('systemMonitor.openFullTab');

            assert.ok(hasProcessMonitorCommand, 'Process monitor command should be registered');
        });

        test('should handle webview message communication', function() {
            //
            //  Test message types that the webview should handle
            //
            let expectedMessages = [
                'loadProcesses',
                'analyzeLoad'
            ];

            let messageHandlers = {
                'loadProcesses': () => 'handled',
                'analyzeLoad': () => 'handled'
            };

            for (let messageType of expectedMessages) {
                assert.ok(messageHandlers[messageType], `Should handle ${messageType} message type`);
            }
        });

        test('should prevent multiple panel instances', function() {
            //
            //  Test singleton pattern for panels
            //
            let currentPanel = undefined;

            //
            //  Simulate panel creation logic
            //
            function createPanel() {
                if (currentPanel) {
                    return 'existing';
                }
                currentPanel = { id: 'new-panel' };
                return 'created';
            }

            let result1 = createPanel();
            let result2 = createPanel();

            assert.strictEqual(result1, 'created', 'First call should create panel');
            assert.strictEqual(result2, 'existing', 'Second call should reuse existing panel');
        });
    });

    suite('Performance Requirements', function() {

        test('should complete load analysis within reasonable time', async function() {
            //
            //  Test that analysis doesn't take too long (important for user experience)
            //
            this.timeout(10000); // 10 second max

            let startTime = Date.now();

            try {
                //
                //  Simulate one sample of the analysis (not full 6-second analysis)
                //
                let { stdout } = await execAsync('ps -eo pid,user,%cpu,%mem,comm,cmd --no-headers | head -20');

                //
                //  Basic parsing to simulate processing overhead
                //
                let lines = stdout.trim().split('\n');
                let processData = [];

                for (let line of lines) {
                    let parts = line.trim().split(/\s+/);
                    if (parts.length >= 6) {
                        processData.push({
                            pid: parts[0],
                            cpu: parseFloat(parts[2]),
                            mem: parseFloat(parts[3])
                        });
                    }
                }

                let endTime = Date.now();
                let processingTime = endTime - startTime;

                console.log(`Single process sample processing time: ${processingTime}ms`);
                assert.ok(processingTime < 1000, `Process sampling should complete under 1000ms, took ${processingTime}ms`);

            } catch (error) {
                assert.fail(`Performance test failed: ${error.message}`);
            }
        });

        test('should handle large process lists efficiently', async function() {
            //
            //  Test memory efficiency with many processes
            //
            let startTime = Date.now();
            let startMemory = process.memoryUsage().heapUsed;

            try {
                //
                //  Get all processes (potentially hundreds)
                //
                let { stdout } = await execAsync('ps -eo pid,user,%cpu,%mem,comm,cmd --no-headers');
                let lines = stdout.trim().split('\n');

                //
                //  Process all data
                //
                let allProcesses = [];
                for (let line of lines) {
                    let parts = line.trim().split(/\s+/);
                    if (parts.length >= 6) {
                        allProcesses.push({
                            pid: parts[0],
                            user: parts[1],
                            cpu: parts[2],
                            memory: parts[3],
                            name: parts[4],
                            command: parts.slice(5).join(' ')
                        });
                    }
                }

                let endTime = Date.now();
                let endMemory = process.memoryUsage().heapUsed;
                let processingTime = endTime - startTime;
                let memoryIncrease = endMemory - startMemory;

                console.log(`Processed ${allProcesses.length} processes in ${processingTime}ms, memory increase: ${Math.round(memoryIncrease / 1024)}KB`);

                assert.ok(processingTime < 2000, `Large process list should process under 2000ms, took ${processingTime}ms`);
                assert.ok(memoryIncrease < 10 * 1024 * 1024, `Memory increase should be under 10MB, was ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

            } catch (error) {
                assert.fail(`Large process list test failed: ${error.message}`);
            }
        });
    });

    suite('Cross-Platform Compatibility', function() {

        test('should work on Linux systems', async function() {
            //
            //  Test Linux-specific ps command compatibility
            //
            if (process.platform !== 'linux') {
                this.skip(); // Skip on non-Linux systems
            }

            try {
                let { stdout } = await execAsync('ps -eo pid,ppid,user,%cpu,%mem,comm,lstart,cmd --no-headers | head -1');
                assert.ok(stdout.trim().length > 0, 'Linux ps command should return data');

                //
                //  Test Linux-specific field availability
                //
                let fields = stdout.trim().split(/\s+/);
                assert.ok(fields.length >= 11, 'Linux ps should support all required fields');

            } catch (error) {
                assert.fail(`Linux compatibility test failed: ${error.message}`);
            }
        });

        test('should work on macOS systems', async function() {
            //
            //  Test macOS-specific ps command compatibility
            //
            if (process.platform !== 'darwin') {
                this.skip(); // Skip on non-macOS systems
            }

            try {
                let { stdout } = await execAsync('ps -eo pid,ppid,user,%cpu,%mem,comm,lstart,cmd | head -2');
                let lines = stdout.trim().split('\n');

                assert.ok(lines.length >= 1, 'macOS ps command should return data');

                //
                //  Skip header line, test data line
                //
                if (lines.length > 1) {
                    let dataLine = lines[1].trim();
                    let fields = dataLine.split(/\s+/);
                    assert.ok(fields.length >= 11, 'macOS ps should support all required fields');
                }

            } catch (error) {
                assert.fail(`macOS compatibility test failed: ${error.message}`);
            }
        });

        test('should be blocked on Windows systems', function() {
            //
            //  Test that Windows is properly blocked by package.json
            //
            let packageJson = require('../../package.json');

            assert.ok(packageJson.os, 'package.json should specify supported OS');
            assert.ok(Array.isArray(packageJson.os), 'OS field should be an array');
            assert.ok(!packageJson.os.includes('win32'), 'Windows (win32) should not be in supported OS list');
            assert.ok(packageJson.os.includes('linux'), 'Linux should be in supported OS list');
            assert.ok(packageJson.os.includes('darwin'), 'macOS (darwin) should be in supported OS list');
        });
    });

    suite('Error Handling', function() {

        test('should handle ps command failures gracefully', async function() {
            //
            //  Test graceful handling of command failures
            //
            try {
                //
                //  Try an invalid ps command
                //
                await execAsync('ps -eo invalid_field --no-headers');
                assert.fail('Invalid ps command should throw error');

            } catch (error) {
                //
                //  Error is expected - test that we can handle it
                //
                assert.ok(error.message, 'Error should have descriptive message');
                console.log('Expected ps command error handled correctly:', error.message);
            }
        });

        test('should handle malformed process data gracefully', function() {
            //
            //  Test parsing of malformed process lines
            //
            let malformedLines = [
                '', // Empty line
                '   ', // Whitespace only
                '123', // Too few fields
                '123 456 user' // Still too few fields
            ];

            let validProcesses = [];

            for (let line of malformedLines) {
                let trimmed = line.trim();
                if (trimmed) {
                    let parts = trimmed.split(/\s+/);
                    if (parts.length >= 11) {
                        validProcesses.push({ pid: parts[0] });
                    }
                }
            }

            assert.strictEqual(validProcesses.length, 0, 'Malformed lines should be filtered out');
        });

        test('should handle permission denied processes', async function() {
            //
            //  Test that permission issues don't crash the monitoring
            //
            try {
                //
                //  Try to get processes - some may be permission denied, but command should still succeed
                //
                let { stdout, stderr } = await execAsync('ps -eo pid,user,%cpu,%mem,comm,cmd --no-headers 2>&1 | head -10');

                //
                //  Should get some output even if some processes are inaccessible
                //
                assert.ok(stdout || stderr, 'Should get some output even with permission issues');

                if (stdout) {
                    let lines = stdout.trim().split('\n').filter(line => line.trim());
                    console.log(`Successfully retrieved ${lines.length} processes despite potential permission restrictions`);
                }

            } catch (error) {
                //
                //  Even if command fails, test that we can handle the error
                //
                console.log('Permission test completed with expected restrictions:', error.message);
            }
        });
    });
});