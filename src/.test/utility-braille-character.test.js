let assert = require('assert');
let get_braille_character = require('../.utility/get_braille_character.js');

suite('Braille Character Utility Tests', function() {

    suite('Input Validation', function() {
        test('should throw error for non-number input', async function() {
            await assert.rejects(
                async() => await get_braille_character('50'),
                /percentage-must-be-number/
            );
            await assert.rejects(
                async() => await get_braille_character(null),
                /percentage-must-be-number/
            );
            await assert.rejects(
                async() => await get_braille_character(undefined),
                /percentage-must-be-number/
            );
        });

        test('should throw error for out-of-range input', async function() {
            await assert.rejects(
                async() => await get_braille_character(-1),
                /percentage-out-of-range/
            );
            await assert.rejects(
                async() => await get_braille_character(101),
                /percentage-out-of-range/
            );
        });
    });

    suite('8-Level Braille Character Progression', function() {
        test('should return correct braille for very low usage (0-12.5%)', async function() {
            assert.strictEqual(await get_braille_character(0), '⡀');
            assert.strictEqual(await get_braille_character(5), '⡀');
            assert.strictEqual(await get_braille_character(12), '⡀');
            assert.strictEqual(await get_braille_character(12.4), '⡀');
        });

        test('should return correct braille for low usage (12.5-25%)', async function() {
            assert.strictEqual(await get_braille_character(12.5), '⣀');
            assert.strictEqual(await get_braille_character(13), '⣀');
            assert.strictEqual(await get_braille_character(20), '⣀');
            assert.strictEqual(await get_braille_character(24.9), '⣀');
        });

        test('should return correct braille for low-moderate usage (25-37.5%)', async function() {
            assert.strictEqual(await get_braille_character(25), '⣠');
            assert.strictEqual(await get_braille_character(30), '⣠');
            assert.strictEqual(await get_braille_character(37), '⣠');
            assert.strictEqual(await get_braille_character(37.4), '⣠');
        });

        test('should return correct braille for moderate usage (37.5-50%)', async function() {
            assert.strictEqual(await get_braille_character(37.5), '⣤');
            assert.strictEqual(await get_braille_character(38), '⣤');
            assert.strictEqual(await get_braille_character(45), '⣤');
            assert.strictEqual(await get_braille_character(49.9), '⣤');
        });

        test('should return correct braille for moderate-high usage (50-62.5%)', async function() {
            assert.strictEqual(await get_braille_character(50), '⣦');
            assert.strictEqual(await get_braille_character(55), '⣦');
            assert.strictEqual(await get_braille_character(62), '⣦');
            assert.strictEqual(await get_braille_character(62.4), '⣦');
        });

        test('should return correct braille for high usage (62.5-75%)', async function() {
            assert.strictEqual(await get_braille_character(62.5), '⣶');
            assert.strictEqual(await get_braille_character(63), '⣶');
            assert.strictEqual(await get_braille_character(70), '⣶');
            assert.strictEqual(await get_braille_character(74.9), '⣶');
        });

        test('should return correct braille for very high usage (75-87.5%)', async function() {
            assert.strictEqual(await get_braille_character(75), '⣾');
            assert.strictEqual(await get_braille_character(80), '⣾');
            assert.strictEqual(await get_braille_character(87), '⣾');
            assert.strictEqual(await get_braille_character(87.4), '⣾');
        });

        test('should return correct braille for maximum usage (87.5-100%)', async function() {
            assert.strictEqual(await get_braille_character(87.5), '⣿');
            assert.strictEqual(await get_braille_character(88), '⣿');
            assert.strictEqual(await get_braille_character(95), '⣿');
            assert.strictEqual(await get_braille_character(100), '⣿');
        });
    });

    suite('Boundary Value Testing', function() {
        test('should handle exact boundary values correctly', async function() {
            // Test exact boundaries between levels
            assert.strictEqual(await get_braille_character(12.4999), '⡀');
            assert.strictEqual(await get_braille_character(12.5), '⣀');

            assert.strictEqual(await get_braille_character(24.9999), '⣀');
            assert.strictEqual(await get_braille_character(25), '⣠');

            assert.strictEqual(await get_braille_character(37.4999), '⣠');
            assert.strictEqual(await get_braille_character(37.5), '⣤');

            assert.strictEqual(await get_braille_character(49.9999), '⣤');
            assert.strictEqual(await get_braille_character(50), '⣦');

            assert.strictEqual(await get_braille_character(62.4999), '⣦');
            assert.strictEqual(await get_braille_character(62.5), '⣶');

            assert.strictEqual(await get_braille_character(74.9999), '⣶');
            assert.strictEqual(await get_braille_character(75), '⣾');

            assert.strictEqual(await get_braille_character(87.4999), '⣾');
            assert.strictEqual(await get_braille_character(87.5), '⣿');
        });

        test('should handle edge cases correctly', async function() {
            assert.strictEqual(await get_braille_character(0), '⡀');
            assert.strictEqual(await get_braille_character(100), '⣿');
        });
    });

    suite('Progression Validation', function() {
        test('should maintain consistent character progression', async function() {
            // Test that the progression follows logical order (4-dot height braille)
            let expectedProgression = ['⡀', '⣀', '⣠', '⣤', '⣦', '⣶', '⣾', '⣿'];
            let testValues = [5, 15, 30, 40, 55, 70, 80, 95];

            for (let i = 0; i < testValues.length; i++) {
                let result = await get_braille_character(testValues[i]);
                assert.strictEqual(result, expectedProgression[i],
                    `Value ${testValues[i]}% should map to ${expectedProgression[i]}, got ${result}`);
            }
        });

        test('should return valid Unicode braille characters', async function() {
            let testValues = [0, 15, 30, 45, 60, 75, 90, 100];

            for (let value of testValues) {
                let result = await get_braille_character(value);

                // Should be exactly one character
                assert.strictEqual(result.length, 1, `Result should be single character for ${value}%`);

                // Should be in valid braille Unicode range (U+2800-U+28FF)
                let codePoint = result.codePointAt(0);
                assert.ok(codePoint >= 0x2800 && codePoint <= 0x28FF,
                    `Character ${result} (U+${codePoint.toString(16).toUpperCase()}) should be valid braille Unicode`);
            }
        });
    });
});
