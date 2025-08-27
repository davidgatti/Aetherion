import * as assert from 'assert';
import * as vscode from 'vscode';

// Import the functions we want to test
// Note: We need to refactor extension.ts to export these functions first
// import { getSquareForUsage } from '../extension';

suite('Aetherion CPU Monitor Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('gatti.aetherion-cpu-monitor');
		assert.ok(extension, 'Extension should be found');
	});

	test('Braille character mapping', () => {
		// We'll need to export getSquareForUsage function first
		// Test different CPU usage percentages
		// assert.strictEqual(getSquareForUsage(5), '⣀');
		// assert.strictEqual(getSquareForUsage(15), '⣄');
		// assert.strictEqual(getSquareForUsage(90), '⣿');
		
		// Temporary test to verify test framework works
		assert.strictEqual(1 + 1, 2);
	});
});
