# Release History

This folder contains all packaged `.vsix` files for the Aetherion CPU Monitor extension.

## Current Releases

- `v1.7.0` - **Latest**: Added swap usage monitoring with cross-platform support
- `v1.6.1` - Extension logo for VS Code marketplace display
- `v1.6.0` - Dedicated system monitor sidebar and static system information tree view
- `v1.0.0` - Initial release with CPU, RAM, disk, and network monitoring

## Release Commands

Use these npm scripts to create new releases:

```bash
npm run package:patch  # Patch version bump (1.1.0 → 1.1.1)
npm run package:minor  # Minor version bump (1.1.0 → 1.2.0)
npm run package:major  # Major version bump (1.1.0 → 2.0.0)
npm run package       # Package current version
```

All `.vsix` files in this folder are automatically ignored by git.
