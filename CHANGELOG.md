# Change Log

All notable changes to the "Aetherion CPU Monitor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-08-30

### � Critical Fixes

- **Fixed memory calculation bug**: Now shows realistic 70-80% usage instead of incorrect 99%+
- **Fixed tooltip flickering** that was interrupting VS Code workflow

### ✨ Improvements

- **Better accuracy**: Memory readings now match Activity Monitor (macOS) and htop (Linux)
- **Cross-platform reliability**: Enhanced testing across macOS, Linux, and Windows
- **Smoother performance**: No impact on VS Code startup or runtime

## [1.1.0] - Previous Release

### Added

- Real-time CPU and RAM monitoring with braille character visualization
- Status bar integration with hover tooltips
- Multi-core CPU monitoring support
- Configurable update intervals
- Cross-platform compatibility (macOS, Linux, Windows)

### Features

- Braille character progression for visual system load representation
- Per-core CPU monitoring with individual braille characters
- RAM usage monitoring with matching braille visualization
- Hover tooltips showing detailed system information
- Lightweight and efficient monitoring with minimal resource usage
