# Configuration Files

This folder contains development tool configurations to keep the project root clean.

## Files

- **`eslint.config.mjs`** - ESLint configuration for code linting
- **`prettier.config.js`** - Prettier configuration for code formatting  
- **`.prettierignore`** - Files to ignore during formatting

## Files Remaining in Root

Some configuration files must remain in the project root due to tool limitations:

- `.editorconfig` - EditorConfig only searches root/parent directories
- `.gitignore` - Git requires this in repository root
- `.vscodeignore` - VS Code packaging requires this in root
- `.vscode-test.mjs` - VS Code test CLI requires this in project root
