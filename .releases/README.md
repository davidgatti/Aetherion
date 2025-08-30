# Release History

This folder contains all packaged `.vsix` files for the Aetherion CPU Monitor extension.

## Current Releases

- `v1.0.0` - Initial release
- `v1.0.1` - Bug fixes and improvements  
- `v1.1.0` - Enhanced features and stability

## Release Commands

Use these npm scripts to create new releases:

```bash
npm run package:patch  # Patch version bump (1.1.0 → 1.1.1)
npm run package:minor  # Minor version bump (1.1.0 → 1.2.0)
npm run package:major  # Major version bump (1.1.0 → 2.0.0)
npm run package       # Package current version
```

All `.vsix` files in this folder are automatically ignored by git.
