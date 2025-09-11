# Aetherion CPU Monitor

A real-time system monitoring extension for VS Code that displays CPU, memory, swap, disk, and network usage directly in your status bar using animated braille characters, with a dedicated sidebar showing detailed system information.

## 🎯 Why Aetherion?

When developing on **remote hosts via SSH or cloud environments**, you lose access to native system monitoring tools like Activity Monitor (Mac) or Task Manager (Windows). Aetherion brings comprehensive system monitoring directly into your VS Code interface, giving you instant awareness of system performance without leaving your development environment.

## ✨ Features

- **Real-time status bar monitoring** - Animated braille characters update every 200ms for live performance feedback
- **Dedicated system monitor sidebar** - Standalone activity bar panel with detailed system information
- **Multi-metric monitoring** - CPU, RAM, swap, disk space, and network traffic visualization
- **Braille character animation** - Progressive visual indicators for different usage levels
- **Static system information** - Platform, architecture, CPU details, and uptime in tree view
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

### System Monitor Sidebar

Click the status bar to open the dedicated **System Monitor** sidebar panel featuring:

```text
System Info
├── 🖥️ Platform: darwin
├── ⚙️ Architecture: x64
├── 🔧 CPU Cores: 8
├── 💻 CPU Model: Apple M1 Pro...
└── ⏱️ Uptime: 2d 14h 32m
```

**Static System Information:** The sidebar displays detailed system specifications and uptime, refreshed manually via the refresh button to prevent visual noise from constant updates.

**Activity Bar Integration:** Standalone system monitor panel with dashboard icon in VS Code's activity bar.

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

## 🔧 Usage

1. **Install the extension** - System monitoring starts automatically
2. **Look at the status bar** - You'll see braille characters on the right side representing:
   - Each CPU core usage
   - Memory usage
   - Disk space usage  
   - Network traffic (in/out)
3. **Monitor in real-time** - Display updates every 200ms

No configuration needed - it just works!

## 📋 Requirements

- VS Code 1.103.0 or higher
- Node.js runtime (for system CPU monitoring)

---

**Tip:** Aetherion is especially valuable when working on resource-constrained remote hosts where you need to monitor CPU, memory, disk, and network usage during builds, tests, large file transfers, or intensive development tasks.
