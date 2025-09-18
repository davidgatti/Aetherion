# Change Log

All notable changes to the "Aetherion CPU Monitor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-09-18

### 🚀 Major Features

- **Complete Live Graph Suite**: Added 5 new Panel Area views for comprehensive system monitoring
  - **RAM Live Graph**: Real-time memory usage visualization with historical trends
  - **Swap Live Graph**: Virtual memory usage monitoring (when swap is available)
  - **Disk Space Live Graph**: Real-time disk usage visualization across all drives
  - **Disk I/O Mirror Graph**: Live disk read/write activity monitoring with mirror visualization
  - **Network I/O Mirror Graph**: Real-time network traffic in/out visualization with mirror charts

### 🎨 UI/UX Improvements

- **Panel Area Architecture**: Complete migration from sidebar to VS Code's Panel Area
  - **6 Tabbed Views**: System Monitor, CPU Graph, RAM Graph, Swap Graph, Disk Graph, Disk I/O Graph, Network I/O Graph
  - **Professional Layout**: Stretch alignment and minimum height for consistent visualization
  - **Improved Visual Consistency**: Updated background colors across all views for better theme integration

### 🔧 Technical Improvements

- **Performance-First Architecture**: All monitoring functions use async exec for non-blocking execution
  - **RAM Monitor Refactor**: Converted to async exec with improved error handling
  - **Parallel Data Collection**: All metrics collected simultaneously for optimal performance
  - **Status Bar Precision**: Fixed update interval documentation (200ms, not 2 seconds)

### 📚 Documentation

- **README Overhaul**: Updated documentation to reflect new Panel Area architecture
  - **Accurate Feature List**: Updated to describe all 6 live graph views
  - **Correct Timing Information**: Fixed status bar update frequency (200ms)
  - **Panel Area Integration**: Updated usage instructions for new tabbed interface

## [2.0.0] - 2025-09-12

### 🚀 Major Features

- **Per-Core CPU Graph Visualization**: Professional real-time CPU monitoring with individual core graphs
  - **Windows Task Manager Style Grid**: Each CPU core displays as a separate compact graph
  - **Real-Time Performance**: Live updates every 2 seconds, synchronized with status bar data
  - **Chart.js Integration**: Professional, smooth line graphs with VS Code theme integration
  - **Scrollable Grid Layout**: Supports any number of CPU cores with automatic scrolling
  - **Minimal Design**: No legends, labels, or visual clutter - pure data visualization
  - **Performance Optimized**: Only renders when visible, zero impact when tab is not active
  - **Theme-Aware Colors**: Automatically matches VS Code theme colors for seamless integration

### 🎨 UI/UX Improvements

- **Clean Interface Design**: Removed headers and buttons from all panel views for minimal, distraction-free interface
  - **System Info**: Removed header and refresh button - information loads automatically
  - **CPU Graph**: Removed header and clear button - focus purely on data visualization
- **Full VS Code Theme Integration**: All UI elements now use VS Code theme variables
  - **Dynamic Color Adaptation**: Automatically adapts to Light, Dark, and High Contrast themes
  - **Professional Typography**: Uses VS Code's font family and sizing throughout

### 🔧 Technical Improvements

- **Data Sharing Architecture**: CPU graph reuses status bar calculation for perfect consistency
- **Visibility-Based Rendering**: Graphs pause updates when not visible, optimizing performance
- **Memory Management**: Automatic cleanup of old data points prevents memory leaks
- **Zero Animation Overhead**: Disabled Chart.js animations for maximum performance

### 🧪 Testing Enhancements

- **Performance Test Suite**: New tests ensure UI rendering stays under performance thresholds
- **High Core Count Validation**: Tested with 16+ cores to ensure scalability
- **Webview Performance Monitoring**: Validates that panel loading doesn't impact status bar updates

## [1.9.0] - 2025-09-11

### 🔧 UX Improvements

- **Consistent Status Bar Layout**: Swap section now always appears in status bar for predictable positioning
  - **Always Show Swap**: Swap section displays even on systems without swap configuration
  - **Clear No-Swap Indication**: Uses ⣛ braille character when swap is not configured
  - **Consistent Tooltip**: Always includes swap information with "Not configured" message when appropriate
  - **Predictable Learning**: Users can now rely on consistent section positioning across all systems

### 🐛 Bug Fixes

- **Cross-Platform Consistency**: Eliminates status bar layout differences between systems with and without swap
- **UI Stability**: Prevents status bar sections from shifting position based on system configuration

## [1.8.0] - 2025-09-11

### 🎯 Major Features

- **TPS-Based Disk Activity Monitoring**: Revolutionary modernization of classic 90s PC case LED experience
  - **Dual Read/Write Activity Display**: Separate braille characters for read and write operations
  - **TPS (Transfers Per Second) Focus**: Measures drive "busyness" like original hardware LEDs, not just raw throughput
  - **Intelligent I/O Pattern Detection**: Estimates read/write ratios based on transfer sizes
    - Small transfers (<8KB): 70% reads, 30% writes (typical random I/O)
    - Large transfers (>32KB): 50% reads, 50% writes (sequential I/O)
    - Medium transfers: Blended ratio based on actual transfer size
  - **Realistic Activity Thresholds**:
    - Idle: 0-5 TPS, Light: 5-25 TPS, Moderate: 25-100 TPS
    - Busy: 100-300 TPS, Very Busy: 300-800 TPS, Extreme: 800+ TPS
  - **Enhanced Status Bar Format**: `CPU RAM SWAP DISK READ WRITE NETWORK_IN NETWORK_OUT`
  - **Detailed Activity Tooltip**: Shows TPS breakdown, MB/s, and read/write distribution

### 🔧 Technical Improvements

- **Drive-Agnostic Performance**: Works equally well on HDDs, SATA SSDs, NVMe SSDs, and enterprise drives
- **Authentic 90s LED Feel**: Captures the "crunchy" random I/O that made classic LEDs flicker rapidly
- **Backwards Compatibility**: Maintains all existing APIs while adding new TPS-based functionality
- **Cross-Platform iostat Integration**: Uses native disk statistics without requiring elevated permissions

### 🧪 Testing Enhancements

- **Comprehensive Disk Activity Test Suite**: 8 new tests covering TPS monitoring, read/write estimation, and activity level calculation
- **TPS Validation**: Tests ensure accurate activity descriptions based on actual transfer rates
- **Enhanced Integration Testing**: Validates new dual-character display format
- **Total Test Coverage**: 58 passing tests ensuring robust functionality

### 📁 Architecture Updates

- **New Disk Activity Monitor**: `utility/metrics/live/disk-activity-monitor.js` with TPS-based calculations
- **Extended Extension API**: Added `getDiskReadActivityBlock()` and `getDiskWriteActivityBlock()` functions
- **Enhanced Status Bar Logic**: Updated display formatting for dual activity indicators
- **Improved Module Exports**: Extended API surface for new read/write activity functions

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

- New swap monitor module: `utility/metrics/live/swap-monitor.js`
- Updated status bar display logic to conditionally include swap
- Enhanced file organization with logical folder structure
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
