# Aetherion CPU Monitor

A real-time CPU monitoring extension for VS Code that displays per-core CPU usage directly in your status bar. Perfect for developers working on remote hosts where traditional system monitors aren't available.

## 🎯 Why Aetherion?

When developing on **remote hosts via SSH or cloud environments**, you lose access to native system monitoring tools like Activity Monitor (Mac) or Task Manager (Windows). Aetherion brings CPU monitoring directly into your VS Code interface, giving you instant awareness of system performance without leaving your development environment.

## ✨ Features

- **Real-time CPU monitoring** - Updates every 200ms for live performance feedback
- **Per-core visualization** - Each CPU core gets its own visual representation  
- **Braille character display** - Compact, elegant visualization using Unicode braille patterns
- **Always visible** - Integrated into VS Code's status bar (right side, high priority)
- **Zero configuration** - Works immediately upon installation
- **Lightweight** - Minimal performance impact on your system
- **Cross-platform** - Works on Windows, macOS, and Linux

## 📊 Visual Representation

Aetherion uses progressive braille characters to show CPU usage levels:

**Example Display:** `⣀⣄⣤⣶⣷⣿⣀⣄ ⣤` represents an 8-core system with varying load per core, followed by RAM usage as only one bar.

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
2. **Look at the status bar** - You'll see braille characters on the right side representing each CPU core
3. **Monitor in real-time** - Display updates every 200ms

No configuration needed - it just works!

## 📋 Requirements

- VS Code 1.103.0 or higher
- Node.js runtime (for system CPU monitoring)

## �️ Development

### Building Releases

This project uses organized release management with all `.vsix` files stored in the `.releases/` folder:

```bash
# Create a patch release (1.1.0 → 1.1.1)
npm run package:patch

# Create a minor release (1.1.0 → 1.2.0)  
npm run package:minor

# Create a major release (1.1.0 → 2.0.0)
npm run package:major

# Package current version without bumping
npm run package
```

All generated `.vsix` files are automatically placed in the `.releases/` folder and ignored by git.

## �📜 License

This project is licensed under the MIT License.

---

**Tip:** Aetherion is especially valuable when working on resource-constrained remote hosts where you need to monitor CPU usage during builds, tests, or intensive development tasks.
