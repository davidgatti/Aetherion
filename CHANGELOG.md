# Change Log

All notable changes to the "Aetherion CPU Monitor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-09-11

### ✨ New Features

- **Swap Usage Monitoring**: Added real-time swap/virtual memory monitoring with braille display
  - Cross-platform support (macOS, Linux, Windows) without requiring root permissions
  - Smart detection - only shows swap indicator when swap is actually configured
  - Uses native OS commands: `sysctl vm.swapusage` (macOS), `/proc/meminfo` (Linux), `wmic pagefile` (Windows)
  - Integrated into status bar display format: `CPU RAM SWAP DISK NETWORK`
  - Enhanced tooltip with swap usage details

### 🧪 Testing Improvements

- Added comprehensive swap functionality test suite (6 new tests)
- Enhanced UI integration tests for status bar monitoring
- Cross-platform swap detection validation
- Total test count increased to 52 tests

### 📁 Code Organization

- New swap monitor module: `01_monitors/05_swap-monitor.js`
- Updated status bar display logic to conditionally include swap
- Enhanced file organization with leading zero numbering for framework compatibility
- Organized codebase into logical subfolders by purpose

## [1.6.1] - 2025-09-08

### Added

- Extension logo for VS Code marketplace display

## [1.6.0] - 2025-09-04

### ✨ New Features

- **Dedicated System Monitor Sidebar**: Added standalone activity bar panel with dashboard icon
- **Static System Information Tree View**: Platform, architecture, CPU details, and uptime display
- **Manual Refresh Control**: Tree view updates on demand to eliminate visual noise
- **Emoji Icons in Tree View**: Clean visual indicators for system information categories
- **Activity Bar Integration**: Separate system monitor panel independent of Explorer

### 🔧 Improvements

- **Optimized Tree Refresh Strategy**: Removed auto-refresh to prevent progress bar flashing
- **Enhanced UI Organization**: Clear separation between live status bar and detailed sidebar
- **Updated Documentation**: README accurately reflects current UI implementation
- **Improved User Experience**: Click status bar to focus system monitor sidebar

### 🛠️ Technical Changes

- **Tree Provider Refactoring**: Simplified to show only system information
- **Status Bar Click Handler**: Integrated focus command for seamless navigation
- **Package Configuration**: Updated viewsContainers for activity bar integration

## [1.4.0] - 2025-09-03

### ✨ New Features

- **Network traffic monitoring**: Added real-time network in/out traffic visualization
- **Interface detection**: Automatically detects active network interface (e.g., en0, eth0)
- **Capacity-based percentages**: Network usage calculated based on interface maximum capacity
- **Enhanced status bar**: Display now shows CPU cores + RAM + Disk + Network In/Out
- **Cross-platform network support**: Works on macOS and Linux with platform-specific commands

### 🔧 Improvements

- **Expanded test coverage**: Added 12 new tests for network functionality (53 total tests)
- **Consistent braille progression**: Network traffic uses the same visual patterns as other metrics
- **Enhanced tooltip**: Now includes network interface and traffic information
- **Smart interface selection**: Automatically selects the most active non-loopback interface

### 📊 Status Bar Format

The status bar now displays: `[CPU_cores] [RAM] [Disk] [Network_In][Network_Out]`

Example: `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤ ⣀ ⣶⣄` shows 8 CPU cores, moderate RAM usage, low disk usage, and high network in/low network out traffic.

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
