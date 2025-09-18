# Aetherion CPU Monitor

A comprehensive real-time system monitoring extension for VS Code that displays CPU, memory, swap, disk, and network usage in your status bar using animated braille characters, plus a dedicated Panel Area with live graph visualizations for detailed performance analysis.

## 🎯 Why Aetherion?

When developing on **remote hosts via SSH or cloud environments**, you lose access to native system monitoring tools like Activity Monitor (Mac) or Task Manager (Windows). Aetherion brings comprehensive system monitoring directly into your VS Code interface, giving you instant awareness of system performance without leaving your development environment.

## ✨ Features

- **Real-time status bar monitoring** - Animated braille characters update every 200ms for ultra-smooth performance feedback
- **Live graph visualizations** - 6 dedicated Panel Area views with real-time charts for detailed analysis
- **Multi-metric monitoring** - CPU, RAM, swap, disk space, disk I/O, and network traffic visualization
- **Panel Area integration** - Bottom panel with tabbed views alongside Terminal, Problems, etc.
- **Braille character animation** - Progressive visual indicators for different usage levels
- **Static system information** - Platform, architecture, CPU details, and uptime display
- **Always visible status bar** - Integrated into VS Code's status bar (right side, high priority)
- **Zero configuration** - Works immediately upon installation
- **Lightweight** - Minimal performance impact on your system
- **Cross-platform** - Works on Windows, macOS, and Linux

## 🎨 User Interface

### Status Bar Display

Aetherion uses progressive braille characters in the status bar to show system usage levels:

- `⣀` - Very low usage (0-10%)
- `⣄` - Low usage (10-20%)
- `⣤` - Moderate usage (20-40%)
- `⣶` - High usage (40-60%)
- `⣷` - Very high usage (60-80%)
- `⣿` - Maximum usage (80-100%)

**Example Status Bar:** `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤ ⣠ ⣀ ⣶⣄` represents:

- **CPU cores** (8 cores): `⣀⣄⣤⣶⣷⣿⣀⣄` - varying load per core
- **RAM usage**: `⣤` - moderate memory usage (20-40%)
- **Swap usage**: `⣠` - low swap usage (10-20%) - *only shown when swap is enabled*
- **Disk usage**: `⣀` - low disk usage (0-10%)
- **Network traffic**: `⣶⣄` - high incoming (40-60%), low outgoing (10-20%)

### System Monitor Panel Area

Click the status bar to open the dedicated **System Monitor** Panel Area (bottom panel) featuring 6 tabbed views:

1. **System Monitor** - Static system information and overview dashboard
2. **CPU Live Graph** - Real-time per-core CPU usage visualization  
3. **RAM Live Graph** - Live memory usage tracking with visual charts
4. **Swap Live Graph** - Virtual memory usage monitoring (*when swap is available*)
5. **Disk Space Live Graph** - Real-time disk usage visualization
6. **Disk I/O Mirror Graph** - Live disk read/write activity monitoring  
7. **Network I/O Mirror Graph** - Real-time network traffic in/out visualization

**Panel Area Integration:** All views are located in VS Code's bottom Panel Area alongside Terminal, Problems, and Output panels, providing easy access without disrupting your workflow.

## 🚀 Perfect For

- **Remote development** on servers and cloud instances
- **Docker development** environments
- **SSH-based development** workflows
- **Build process monitoring** - see CPU impact during compilation
- **Network-intensive development** - monitor upload/download during large transfers
- **Performance-conscious development** - monitor resource usage while coding
- **System administrators** managing remote hosts through VS Code
- **DevOps workflows** - monitor system performance during deployments

## 📦 Installation

1. **From VS Code Marketplace:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Aetherion CPU Monitor"
   - Click Install

2. **From Command Line:**

   ```bash
   code --install-extension gatti.aetherion-cpu-monitor
   ```

No configuration needed - it just works!

## 📋 Requirements

- VS Code 1.103.0 or higher
- Node.js runtime (for system CPU monitoring)

---

**Tip:** Aetherion is especially valuable when working on resource-constrained remote hosts where you need to monitor CPU, memory, disk, and network usage during builds, tests, large file transfers, or intensive development tasks.
