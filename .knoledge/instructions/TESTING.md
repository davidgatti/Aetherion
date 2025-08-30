# Testing

## Available Commands

```bash
npm test           # Run all tests
npm run build      # Run lint + tests  
npm run package    # Create .vsix file for testing
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

## Test Before Installing

**Quick workflow to verify the extension works:**

```bash
# 1. Open project in VS Code
# - Make sure the extension project folder is open in VS Code

# 2. Test the extension
# - Hit F5 to launch extension in debug mode
# - New VS Code window opens with extension loaded

# 3. Check status bar
# - Look for braille characters on the right side
# - Format should be: ⣀⣄⣤⣶ ⣿ (CPU cores + space + RAM)
```

**Note:** 
- No build needed before F5 (VS Code handles compilation)
- `npm run build` is for checking lint/tests manually
- `npm run package` is only for creating distribution files

## Expected Display

- **Format:** `[CPU cores] [space] [RAM]`
- **Example:** `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤` (8 cores + RAM)
- **Updates:** Every 200ms
- **Location:** VS Code status bar (right side)
