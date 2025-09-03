# Aetherion CPU Monitor

A real-time system monitoring extension for VS Code that displays per-core CPU usage, memory usage, disk space, and network traffic directly in your status bar. Perfect for developers working on remote hosts where traditional system monitors aren't available.

## 🎯 Why Aetherion?

When developing on **remote hosts via SSH or cloud environments**, you lose access to native system monitoring tools like Activity Monitor (Mac) or Task Manager (Windows). Aetherion brings comprehensive system monitoring directly into your VS Code interface, giving you instant awareness of CPU, memory, disk, and network performance without leaving your development environment.

## ✨ Features

- **Real-time system monitoring** - Updates every 200ms for live performance feedback
- **Per-core CPU visualization** - Each CPU core gets its own visual representation  
- **Memory usage monitoring** - Real-time RAM usage display with platform-specific accuracy
- **Disk space monitoring** - Main disk usage tracking with cross-platform support
- **Network traffic monitoring** - Real-time in/out traffic visualization based on interface capacity
- **Braille character display** - Compact, elegant visualization using Unicode braille patterns
- **Always visible** - Integrated into VS Code's status bar (right side, high priority)
- **Zero configuration** - Works immediately upon installation
- **Lightweight** - Minimal performance impact on your system
- **Cross-platform** - Works on Windows, macOS, and Linux

## 📊 Visual Representation

Aetherion uses progressive braille characters to show system usage levels:

- `⣀` - Very low usage (0-10%)
- `⣄` - Low usage (10-20%)
- `⣤` - Moderate usage (20-40%)
- `⣶` - High usage (40-60%)
- `⣷` - Very high usage (60-80%)
- `⣿` - Maximum usage (80-100%)

**Example Display:** `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤ ⣀ ⣶⣄` represents:

- **CPU cores** (8 cores): `⣀⣄⣤⣶⣷⣿⣀⣄` - varying load per core
- **RAM usage**: `⣤` - moderate memory usage (20-40%)
- **Disk usage**: `⣀` - low disk usage (0-10%)
- **Network traffic**: `⣶⣄` - high incoming (40-60%), low outgoing (10-20%)

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
