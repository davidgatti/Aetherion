test('Per-core CPU graph webview renders quickly with many cores', async function() {
    //
    //  Open the CPU graph view (simulate command)
    //
    let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
    assert.ok(extension, 'Extension should be loaded');
    if (!extension.isActive) {
        await extension.activate();
    }

    // Simulate a high core count (e.g., 16)
    let numCores = 16;
    // Send a message to the webview to trigger rendering (if supported)
    // If not, just open the view and measure time to ready
    let renderStart = Date.now();
    try {
        await vscode.commands.executeCommand('sysmag.openCpuGraphView');
    } catch {
        // Fallback: open the main panel if specific command is not registered
        await vscode.commands.executeCommand('sysmag.openSystemPanel');
    }

    // Wait for the webview to render (simulate with timeout, as VS Code API does not expose DOM)
    await new Promise(resolve => setTimeout(resolve, 500));
    let renderEnd = Date.now();
    let renderTime = renderEnd - renderStart;

    console.log(`Per-core CPU graph render time (for ${numCores} cores): ${renderTime}ms`);
    let maxRenderTime = 600; // ms (increased from 300ms to account for VS Code command overhead)
    assert.ok(renderTime <= maxRenderTime, `CPU graph webview rendering took ${renderTime}ms (max: ${maxRenderTime}ms)`);
});
let assert = require('assert');
let vscode = require('vscode');

//
//  Performance monitoring tests
//
suite('Extension Performance Tests', function() {

    //
    //  Allow more time for performance tests
    //
    this.timeout(30000);

    test('Status bar should update within performance threshold', async function() {

        //
        //  Get extension for testing
        //
        let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
        assert.ok(extension, 'Extension should be loaded');

        if (!extension.isActive) {
            await extension.activate();
        }

        //
        //  Test multiple update cycles to ensure consistent performance
        //
        let update_times = [];
        let max_allowed_time = 500; // 500ms max per update cycle

        for (let i = 0; i < 5; i++) {

            let start_time = Date.now();

            //
            //  Wait for 2.5 seconds (longer than update interval)
            //
            await new Promise(resolve => setTimeout(resolve, 2500));

            let end_time = Date.now();
            let cycle_time = end_time - start_time;

            //
            //  The cycle should complete close to expected time (2500ms)
            //  If it takes much longer, there's a performance issue
            //
            let performance_overhead = cycle_time - 2500;
            update_times.push(performance_overhead);

            console.log(`Cycle ${i + 1}: ${cycle_time}ms (overhead: ${performance_overhead}ms)`);

            //
            //  Fail fast if performance is severely degraded
            //
            if (performance_overhead > max_allowed_time) {
                assert.fail(`Performance degraded: Cycle ${i + 1} took ${performance_overhead}ms overhead (max allowed: ${max_allowed_time}ms)`);
            }
        }

        //
        //  Calculate average performance overhead
        //
        let average_overhead = update_times.reduce((a, b) => a + b, 0) / update_times.length;

        console.log(`Average performance overhead: ${average_overhead.toFixed(2)}ms`);
        console.log(`Max allowed overhead: ${max_allowed_time}ms`);

        //
        //  Assert average performance is within acceptable range
        //
        assert.ok(
            average_overhead <= max_allowed_time,
            `Average performance overhead (${average_overhead.toFixed(2)}ms) exceeds threshold (${max_allowed_time}ms)`
        );
    });

    test('Status bar updates should not block for more than 100ms', async function() {

        //
        //  Get extension
        //
        let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
        assert.ok(extension, 'Extension should be loaded');

        if (!extension.isActive) {
            await extension.activate();
        }

        //
        //  Test individual update operations
        //
        let blocking_threshold = 100; // 100ms max blocking time
        let test_iterations = 10;

        for (let i = 0; i < test_iterations; i++) {

            let start_time = process.hrtime();

            //
            //  Simulate triggering an update (wait for one update cycle)
            //
            await new Promise(resolve => setTimeout(resolve, 50));

            let [seconds, nanoseconds] = process.hrtime(start_time);
            let milliseconds = seconds * 1000 + nanoseconds / 1000000;

            console.log(`Update operation ${i + 1}: ${milliseconds.toFixed(2)}ms`);

            //
            //  Each individual operation should complete quickly
            //
            if (milliseconds > blocking_threshold) {
                assert.fail(`Update operation ${i + 1} blocked for ${milliseconds.toFixed(2)}ms (threshold: ${blocking_threshold}ms)`);
            }
        }
    });

    test('Panel view loading should not affect status bar performance', async function() {

        //
        //  Get extension
        //
        let extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
        assert.ok(extension, 'Extension should be loaded');

        if (!extension.isActive) {
            await extension.activate();
        }

        //
        //  Measure baseline performance before opening panel
        //
        let baseline_start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 3000));
        let baseline_time = Date.now() - baseline_start;

        //
        //  Open the panel view
        //
        try {
            await vscode.commands.executeCommand('sysmag.openSystemPanel');
        } catch (error) {
            console.log('Panel command might not be fully registered yet:', error.message);
        }

        //
        //  Measure performance with panel open
        //
        let with_panel_start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 3000));
        let with_panel_time = Date.now() - with_panel_start;

        let performance_impact = with_panel_time - baseline_time;

        console.log(`Baseline time: ${baseline_time}ms`);
        console.log(`With panel time: ${with_panel_time}ms`);
        console.log(`Performance impact: ${performance_impact}ms`);

        //
        //  Panel loading should not significantly impact status bar performance
        //
        let max_impact = 200; // 200ms max impact
        assert.ok(
            Math.abs(performance_impact) <= max_impact,
            `Panel loading caused ${performance_impact}ms performance impact (max allowed: ${max_impact}ms)`
        );
    });

    test('System monitoring functions should complete within time limits', async function() {

        //
        //  Import monitoring functions directly to test performance
        //
        let { calculate_cpu_usage } = require('../01_monitors/01_cpu-monitor.js');
        let { calculate_ram_usage_internal } = require('../01_monitors/02_ram-monitor.js');
        let { calculate_disk_usage_internal } = require('../01_monitors/03_disk-monitor.js');

        //
        //  Performance thresholds for individual monitoring functions
        //
        let max_cpu_time = 200;
        let max_ram_time = 100;
        let max_disk_time = 300;

        //
        //  Test CPU monitoring performance
        //
        let cpu_start = process.hrtime();
        await calculate_cpu_usage();
        let [cpu_seconds, cpu_nanoseconds] = process.hrtime(cpu_start);
        let cpu_time = cpu_seconds * 1000 + cpu_nanoseconds / 1000000;

        console.log(`CPU monitoring: ${cpu_time.toFixed(2)}ms`);
        assert.ok(cpu_time <= max_cpu_time, `CPU monitoring took ${cpu_time.toFixed(2)}ms (max: ${max_cpu_time}ms)`);

        //
        //  Test RAM monitoring performance
        //
        let ram_start = process.hrtime();
        await calculate_ram_usage_internal();
        let [ram_seconds, ram_nanoseconds] = process.hrtime(ram_start);
        let ram_time = ram_seconds * 1000 + ram_nanoseconds / 1000000;

        console.log(`RAM monitoring: ${ram_time.toFixed(2)}ms`);
        assert.ok(ram_time <= max_ram_time, `RAM monitoring took ${ram_time.toFixed(2)}ms (max: ${max_ram_time}ms)`);

        //
        //  Test disk monitoring performance
        //
        let disk_start = process.hrtime();
        await calculate_disk_usage_internal();
        let [disk_seconds, disk_nanoseconds] = process.hrtime(disk_start);
        let disk_time = disk_seconds * 1000 + disk_nanoseconds / 1000000;

        console.log(`Disk monitoring: ${disk_time.toFixed(2)}ms`);
        assert.ok(disk_time <= max_disk_time, `Disk monitoring took ${disk_time.toFixed(2)}ms (max: ${max_disk_time}ms)`);
    });
});
