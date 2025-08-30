# Configuration Files

This folder contains development tool configurations to keep the project root clean.

## Files

- **`eslint.config.mjs`** - ESLint configuration for JavaScript linting
- **`prettier.config.js`** - Prettier configuration for code formatting  
- **`.prettierignore`** - Files to ignore during formatting
- **`.markdownlint-cli2.jsonc`** - Markdownlint configuration for Markdown linting
- **`.markdownlintignore`** - Files to ignore during Markdown linting

## Usage

These configurations are automatically referenced by npm scripts in `package.json`:

```bash
npm run lint           # Runs both JavaScript and Markdown linting
npm run lint:js        # JavaScript linting only (ESLint)
npm run lint:md        # Markdown linting only (markdownlint)
npm run lint:fix       # Auto-fix both JavaScript and Markdown issues
npm run format         # Code formatting (Prettier)
```

## Individual Commands

```bash
# JavaScript linting
npm run lint:js        # Check JavaScript files
npm run lint:js:fix    # Fix JavaScript issues

# Markdown linting  
npm run lint:md        # Check Markdown files
npm run lint:md:fix    # Fix Markdown issues

# Combined
npm run lint           # Check all files
npm run lint:fix       # Fix all auto-fixable issues
```

## Files Remaining in Root

Some configuration files must remain in the project root due to tool limitations:

- `.editorconfig` - EditorConfig only searches root/parent directories
- `.gitignore` - Git requires this in repository root
- `.vscodeignore` - VS Code packaging requires this in root
- `.vscode-test.mjs` - VS Code test CLI requires this in project root
