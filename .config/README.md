# Configuration Files

This folder contains development tool configurations to keep the project root clean.

## Files

- **`eslint.config.mjs`** - ESLint configuration for JavaScript and JSON linting
- **`prettier.config.js`** - Prettier configuration for code formatting  
- **`.prettierignore`** - Files to ignore during formatting
- **`.markdownlint-cli2.jsonc`** - Markdownlint configuration for Markdown linting
- **`.markdownlintignore`** - Files to ignore during Markdown linting
- **`.depcheckrc`** - Dependency check configuration for unused packages

## Usage

These configurations are automatically referenced by npm scripts in `package.json`:

```bash
npm run lint           # Runs all linting (JS + JSON + Markdown + Dependencies)
npm run lint:js        # JavaScript linting only (ESLint)
npm run lint:json      # JSON/JSONC linting only (ESLint)
npm run lint:md        # Markdown linting only (markdownlint)
npm run lint:deps      # Check for unused dependencies
npm run lint:security  # Security audit for vulnerabilities
npm run lint:outdated  # Check for outdated packages
npm run lint:fix       # Auto-fix all auto-fixable issues
npm run format         # Code formatting (Prettier)
```

## Comprehensive Quality Checks

### Code Quality

```bash
npm run lint:js        # JavaScript syntax, style, best practices
npm run lint:json      # JSON syntax validation
npm run lint:md        # Markdown formatting and style
```

### Project Health

```bash
npm run lint:deps      # Unused dependencies detection
npm run lint:security  # Security vulnerability scanning
npm run lint:outdated  # Outdated package detection
```

### Auto-Fixing

```bash
npm run lint:fix       # Auto-fix JavaScript, JSON, and Markdown issues
npm run lint:js:fix    # Fix JavaScript issues only
npm run lint:json:fix  # Fix JSON formatting issues only
npm run lint:md:fix    # Fix Markdown issues only
```

### Build Integration

```bash
npm run build         # Runs full lint + test suite
npm run vscode:prepublish  # Pre-publication checks
```

## Files Remaining in Root

Some configuration files must remain in the project root due to tool limitations:

- `.editorconfig` - EditorConfig only searches root/parent directories
- `.gitignore` - Git requires this in repository root
- `.vscodeignore` - VS Code packaging requires this in root
- `.vscode-test.mjs` - VS Code test CLI requires this in project root
