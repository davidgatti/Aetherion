# Aetherion CPU Monitor

A real-time system monitoring extension for VS Code that displays per-core CPU usage, memory usage, and disk space directly in your status bar. Perfect for developers working on remote hosts where traditional system monitors aren't available.

## 🎯 Why Aetherion?

When developing on **remote hosts via SSH or cloud environments**, you lose access to native system monitoring tools like Activity Monitor (Mac) or Task Manager (Windows). Aetherion brings comprehensive system monitoring directly into your VS Code interface, giving you instant awareness of CPU, memory, and disk performance without leaving your development environment.

## ✨ Features

- **Real-time system monitoring** - Updates every 200ms for live performance feedback
- **Per-core CPU visualization** - Each CPU core gets its own visual representation  
- **Memory usage monitoring** - Real-time RAM usage display with platform-specific accuracy
- **Disk space monitoring** - Main disk usage tracking with cross-platform support
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

**Example Display:** `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤ ⣀` represents an 8-core system with varying load per core, followed by RAM usage, and then disk space usage.

## 🚀 Perfect For

- **Remote development** on servers and cloud instances
- **Docker development** environments
- **SSH-based development** workflows
- **Build process monitoring** - see CPU impact during compilation
- **Performance-conscious development** - monitor resource usage while coding
- **System administrators** managing remote hosts through VS Code

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

1. **Install the extension** - CPU monitoring starts automatically
2. **Look at the status bar** - You'll see braille characters on the right side representing each CPU core, followed by memory usage, and disk space
3. **Monitor in real-time** - Display updates every 200ms

No configuration needed - it just works!

## 📋 Requirements

- VS Code 1.103.0 or higher
- Node.js runtime (for system CPU monitoring)

---

**Tip:** Aetherion is especially valuable when working on resource-constrained remote hosts where you need to monitor CPU usage during builds, tests, or intensive development tasks.
