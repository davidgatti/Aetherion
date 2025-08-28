# Contributing to Aetherion CPU Monitor

## Code Style Guidelines

This project follows strict coding standards to ensure consistency and maintainability.

### Indentation and Spacing

- **Use spaces, not tabs**
- **4 spaces for indentation** in JavaScript files
- **2 spaces for indentation** in JSON and Markdown files
- **No trailing whitespace**
- **Always include final newline**

### JavaScript Code Style

- Use single quotes for strings: `'example'`
- Always use semicolons to end statements
- Maximum line length: 100 characters
- Use camelCase for variables and functions
- Use descriptive variable names
- Add spaces around operators: `a + b`, not `a+b`
- Use consistent brace style (1TBS)

### File Organization

Files should be organized and named following this pattern:
- `01_calculate_cpu_usage.js` - CPU usage calculation logic
- `02_get_cpu_braille_character.js` - CPU braille character mapping
- `03_calculate_ram_usage.js` - RAM usage calculation logic
- `04_get_ram_braille_character.js` - RAM braille character mapping
- `05_update_status_bar_display.js` - Status bar display updates
- `06_show_system_info_command.js` - System info command handler

### Code Structure

Each file should follow this structure:
1. Require statements at the top
2. Clear function definitions with descriptive names
3. Proper error handling with meaningful error messages
4. Detailed comments explaining the logic
5. Module exports at the bottom

### Comments

- Use clear, descriptive comments
- Explain the "why" not just the "what"
- Use consistent comment formatting:
  ```javascript
  //
  //  Description of what this section does
  //
  ```

### Testing

- All code must pass the test suite: `npm test`
- Tests should cover edge cases and error conditions
- Maintain 100% test coverage where possible

## Formatting Tools

### Automatic Formatting

The project includes several tools to maintain code consistency:

1. **EditorConfig** (`.editorconfig`) - Basic editor settings
2. **ESLint** (`eslint.config.mjs`) - Code quality and style rules
3. **Prettier** (`.prettierrc`) - Code formatting
4. **VS Code Settings** (`.vscode/settings.json`) - Editor-specific settings

### Available Scripts

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check

# Run tests
npm test
```

### Pre-commit Checklist

Before committing code:
1. Run `npm run lint:fix` to fix linting issues
2. Run `npm run format` to format code consistently
3. Run `npm test` to ensure all tests pass
4. Verify changes follow the established patterns

## Module Architecture

Each module should:
- Export a single async function
- Handle errors gracefully
- Have clear input validation
- Return consistent data structures
- Be testable in isolation

Example module structure:
```javascript
let dependency = require('./other-module.js');

//
//  Description of what this module does
//
async function module_function(parameter) {
    
    //
    //  Validate input parameters
    //
    if (!parameter) {
        throw new Error('parameter-required');
    }
    
    //
    //  Main logic here
    //
    let result = await dependency(parameter);
    
    //
    //  --> return processed result
    //
    return result;
}

module.exports = module_function;
```

Following these guidelines ensures the codebase remains clean, consistent, and maintainable.
