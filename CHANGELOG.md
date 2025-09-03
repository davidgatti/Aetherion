# Change Log

All notable changes to the "Aetherion CPU Monitor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-09-03

### ✨ New Features

- **Disk space monitoring**: Added real-time disk usage tracking for the main disk
- **Enhanced status bar**: Display now shows CPU cores + RAM + Disk space usage
- **Cross-platform disk support**: Works on macOS, Linux, and Windows with platform-specific commands
- **Comprehensive tooltip**: Now includes disk usage information alongside CPU and RAM data

### 🔧 Improvements

- **Expanded test coverage**: Added 11 new tests for disk functionality (40 total tests)
- **Consistent braille progression**: Disk usage uses the same visual patterns as CPU and RAM
- **Better fallback handling**: Robust error handling for disk space calculation across platforms

### 🐛 Bug Fixes

- **Accurate macOS disk usage**: Fixed disk calculation to use APFS container data instead of just root filesystem, providing accurate readings that match System Settings (e.g., 82.7% vs previous incorrect 4.4%)

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
