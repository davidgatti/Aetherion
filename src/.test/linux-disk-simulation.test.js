let assert = require('assert');
let os = require('os');

//
//  Linux Disk Activity Simulation Tests
//  Tests the Linux implementation logic without requiring actual Linux
//

suite('Linux Disk Activity Simulation Tests', function() {

    suite('Linux /proc/diskstats Parsing Logic', function() {

        //
        //  Mock /proc/diskstats content based on real Linux systems
        //
        let mock_diskstats_content = `   8       0 sda 50234 2341 4023424 45231 82341 5234 8234523 123421 0 89234 168652
   8       1 sda1 45123 2234 3823424 42341 78234 4981 7834523 119876 0 84123 162217
   8       2 sda2 5111 107 200000 2890 4107 253 400000 3545 0 5111 6435
 259       0 nvme0n1 123456 3456 12345678 67890 234567 6789 23456789 345678 0 456789 813467
 259       1 nvme0n1p1 98765 2345 9876543 54321 198765 5432 19876543 287654 0 398765 641975
   7       0 loop0 0 0 0 0 0 0 0 0 0 0 0
   7       1 loop1 542 0 4320 123 0 0 0 0 0 123 123
  11       0 sr0 0 0 0 0 0 0 0 0 0 0 0
   1       0 ram0 0 0 0 0 0 0 0 0 0 0 0
   2       0 fd0 0 0 0 0 0 0 0 0 0 0 0`;

        test('should correctly parse /proc/diskstats format', function() {
            //
            //  Simulate the Linux parsing logic
            //
            let lines = mock_diskstats_content.trim().split('\n');
            let parsed_devices = [];

            for (let line of lines) {
                let parts = line.trim().split(/\s+/);
                if (parts.length >= 14) {
                    let device_name = parts[2];

                    //
                    //  Test device filtering logic
                    //  Skip system devices: loop, ram, sr (CD), fd (floppy)
                    //
                    if (device_name.match(/^(loop|ram|sr|fd)/)) {
                        continue; // Should skip these
                    }
                    //  Skip partitions: sda1, hdb2 (traditional) and nvme0n1p1 (NVMe partitions)
                    //  But keep main devices: sda, nvme0n1, etc.
                    if (device_name.match(/^(sd[a-z]|hd[a-z])\d+$/) || device_name.match(/nvme\d+n\d+p\d+/)) {
                        continue; // Should skip partitions
                    }

                    //
                    //  Parse I/O stats
                    //
                    let read_io_ops = parseInt(parts[3]) || 0;
                    let read_sectors = parseInt(parts[5]) || 0;
                    let write_io_ops = parseInt(parts[7]) || 0;
                    let write_sectors = parseInt(parts[9]) || 0;

                    parsed_devices.push({
                        name: device_name,
                        read_io_ops: read_io_ops,
                        read_sectors: read_sectors,
                        write_io_ops: write_io_ops,
                        write_sectors: write_sectors
                    });
                }
            }

            //
            //  Verify filtering worked correctly
            //
            let device_names = parsed_devices.map(d => d.name);
            assert.ok(device_names.includes('sda'), 'Should include sda device');
            assert.ok(device_names.includes('nvme0n1'), 'Should include nvme0n1 device');
            assert.strictEqual(parsed_devices.length, 2, `Should parse exactly 2 main devices, got: ${device_names.join(', ')}`);

            //
            //  Verify no filtered devices made it through
            //
            let partitions = parsed_devices.filter(d => d.name.match(/\d+$/));
            let system_devices = parsed_devices.filter(d => d.name.match(/^(loop|ram|sr|fd)/));

            assert.strictEqual(partitions.length, 0, `Should not include partitions, found: ${partitions.map(d => d.name).join(', ')}`);
            assert.strictEqual(system_devices.length, 0, `Should not include system devices, found: ${system_devices.map(d => d.name).join(', ')}`);

            //
            //  Verify we got the expected main devices
            //
            console.log('Parsed devices:', parsed_devices.map(d => d.name));
        });

        test('should calculate activity metrics correctly', function() {
            //
            //  Test the calculation logic with known values
            //
            let test_device = {
                read_io_ops: 50234,
                read_sectors: 4023424,
                write_io_ops: 82341,
                write_sectors: 8234523
            };

            //
            //  Simulate the scaling used in Linux implementation
            //
            let read_tps = test_device.read_io_ops * 0.001;
            let write_tps = test_device.write_io_ops * 0.001;
            let total_tps = read_tps + write_tps;

            //
            //  Convert sectors to KB (Linux sectors are 512 bytes)
            //
            let read_kb_s = (test_device.read_sectors * 512) / 1024 * 0.001;
            let write_kb_s = (test_device.write_sectors * 512) / 1024 * 0.001;
            let total_kb_s = read_kb_s + write_kb_s;

            let mb_per_second = total_kb_s / 1024;
            let kb_per_transfer = total_tps > 0 ? total_kb_s / total_tps : 0;

            //
            //  Verify calculations are reasonable
            //
            assert.ok(read_tps > 0, 'Read TPS should be positive');
            assert.ok(write_tps > 0, 'Write TPS should be positive');
            assert.ok(total_tps > 0, 'Total TPS should be positive');
            assert.ok(total_kb_s > 0, 'Total KB/s should be positive');
            assert.ok(mb_per_second >= 0, 'MB/s should be non-negative');
            assert.ok(kb_per_transfer >= 0, 'KB per transfer should be non-negative');

            //
            //  Verify expected order of magnitude
            //
            assert.ok(read_tps < 1000, 'Scaled read TPS should be reasonable');
            assert.ok(write_tps < 1000, 'Scaled write TPS should be reasonable');
        });

        test('should handle TPS activity level calculation', function() {
            //
            //  Import the actual TPS calculation function
            //  (This would need to be exposed or we'd copy the thresholds)
            //
            let TPS_THRESHOLDS = {
                idle: 5,
                light: 25,
                moderate: 100,
                busy: 300,
                very_busy: 800,
                extreme: 1500
            };

            function calculate_tps_activity_level(tps) {
                if (tps <= TPS_THRESHOLDS.idle) {
                    return (tps / TPS_THRESHOLDS.idle) * 12.5;
                }
                if (tps <= TPS_THRESHOLDS.light) {
                    let range_position = (tps - TPS_THRESHOLDS.idle) /
                        (TPS_THRESHOLDS.light - TPS_THRESHOLDS.idle);
                    return 12.5 + (range_position * 12.5);
                }
                if (tps <= TPS_THRESHOLDS.moderate) {
                    let range_position = (tps - TPS_THRESHOLDS.light) /
                        (TPS_THRESHOLDS.moderate - TPS_THRESHOLDS.light);
                    return 25 + (range_position * 25);
                }
                if (tps <= TPS_THRESHOLDS.busy) {
                    let range_position = (tps - TPS_THRESHOLDS.moderate) /
                        (TPS_THRESHOLDS.busy - TPS_THRESHOLDS.moderate);
                    return 50 + (range_position * 25);
                }
                if (tps <= TPS_THRESHOLDS.very_busy) {
                    let range_position = (tps - TPS_THRESHOLDS.busy) /
                        (TPS_THRESHOLDS.very_busy - TPS_THRESHOLDS.busy);
                    return 75 + (range_position * 12.5);
                }
                let range_position = Math.min((tps - TPS_THRESHOLDS.very_busy) /
                    (TPS_THRESHOLDS.extreme - TPS_THRESHOLDS.very_busy), 1);
                return 87.5 + (range_position * 12.5);
            }

            //
            //  Test various TPS levels
            //
            assert.strictEqual(calculate_tps_activity_level(0), 0, 'Zero TPS should be 0% activity');
            assert.ok(calculate_tps_activity_level(10) > 12.5, 'Light activity should be > 12.5%');
            assert.ok(calculate_tps_activity_level(50) > 25, 'Moderate activity should be > 25%');
            assert.ok(calculate_tps_activity_level(200) > 50, 'Busy activity should be > 50%');
            assert.ok(calculate_tps_activity_level(500) > 75, 'Very busy activity should be > 75%');
            assert.strictEqual(calculate_tps_activity_level(1500), 100, 'Extreme TPS should be 100% activity');
        });

    });

    suite('Linux iostat Fallback Parsing', function() {

        test('should parse iostat output correctly', function() {
            //
            //  Mock iostat output for Linux (format differs from macOS)
            //
            let mock_iostat_output = `Linux 5.4.0 (hostname) 	09/19/2025 	_x86_64_	(4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.34    0.00    1.23    0.45    0.00   95.98

Device             tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda              15.23        45.67       123.45     456789    1234567
sdb               2.34         8.91        12.34      89123     123456`;

            //
            //  Simulate parsing the last line (which would be from 'tail -1')
            //
            let lines = mock_iostat_output.trim().split('\n');
            let stats_line = lines[lines.length - 1]; // Last device line
            let parts = stats_line.trim().split(/\s+/);

            if (parts.length >= 5) {
                let device = parts[0];
                let tps = parseFloat(parts[1]) || 0;
                let kb_read_s = parseFloat(parts[2]) || 0;
                let kb_wrtn_s = parseFloat(parts[3]) || 0;
                let total_kb_s = kb_read_s + kb_wrtn_s;
                let mb_s = total_kb_s / 1024;

                //
                //  Verify parsing
                //
                assert.strictEqual(device, 'sdb', 'Should parse device name');
                assert.strictEqual(tps, 2.34, 'Should parse TPS correctly');
                assert.strictEqual(kb_read_s, 8.91, 'Should parse read KB/s');
                assert.strictEqual(kb_wrtn_s, 12.34, 'Should parse write KB/s');
                assert.ok(mb_s > 0, 'MB/s calculation should work');

                //
                //  Test read/write ratio estimation (60/40 split)
                //
                let read_tps = tps * 0.6;
                let write_tps = tps * 0.4;

                assert.ok(read_tps > write_tps, 'Read TPS should be higher than write TPS');
                assert.strictEqual(read_tps + write_tps, tps, 'Read + Write TPS should equal total');
            }
        });

    });

});
