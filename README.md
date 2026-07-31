# m0x-flow ⚡

> **Lightweight desktop application for running and orchestrating large language models locally across single devices and distributed P2P clusters.**

[![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg?style=flat-square&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg?style=flat-square&logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 🌟 Overview

**m0x-flow** is a high-performance, low-footprint desktop client built on Tauri v2 and React 19, backed by an isolated Python sidecar. It enables seamless execution of massive AI models (70B+ parameters) on consumer hardware by dynamically switching between single-device layer swapping and local peer-to-peer cluster inference.

---

## ✨ Key Features

- **⚡ Triple Engine Architecture**:
  - **Standard Mode (llama.cpp / GGUF)**: ⭐ **Best Cross-Device Compatibility**. Direct GPU/CPU KV-cache execution with native support for Windows, macOS (Metal), Linux, NVIDIA (CUDA), AMD (Vulkan), Intel (Vulkan/SYCL), and CPU.
  - **AirLLM Mode (Single Device)**: Swaps transformer layers from disk to VRAM sequentially to execute 70B+ models on single low-VRAM machines.
  - **Exo Pods Mode (Cluster Mode)**: Uses Ring Memory-Weighted Partitioning to shard LLM layers across multiple devices (Macs, PCs, GPUs) on the local Wi-Fi network.
- **🌐 Interactive Pods Visualizer**: Real-time canvas powered by `@xyflow/react` visualizing cluster node topologies, device memory usage, ping latency, and active tensor flow.
- **📦 Model Hub**: One-click Hugging Face model downloads, local weight management, and disk storage analytics.
- **📊 Real-time Hardware HUD**: Live token streaming throughput counter ($tokens/sec$) and system VRAM monitoring.
- **🎨 Obsidian Dark Theme**: Minimalist high-contrast dark UI designed for zero distraction and maximum responsiveness.

---

## 🏗️ System Architecture

m0x-flow follows a decoupled **Three-Tier Architecture**:

```text
┌─────────────────────────────────────────────────────────┐
│              Frontend (Tauri + React 19)               │
│        UI, State Management, SSE Stream Consumer        │
└──────────────────────────┬──────────────────────────────┘
                           │ IPC / HTTP Server-Sent Events
┌──────────────────────────▼──────────────────────────────┐
│             Backend Orchestrator (Python Sidecar)       │
│      FastAPI Server, Process Control, HuggingFace Hub    │
└──────────────────────────┬──────────────────────────────┘
                           │ Process Dispatch
           ┌───────────────┴───────────────┐
           ▼                               ▼
 ┌───────────────────┐           ┌───────────────────┐
 │   AirLLM Engine   │           │    Exo Engine     │
 │ Layer-wise Disk   │           │ P2P Cluster Mesh  │
 │ VRAM Swapping     │           │ Network Inference │
 └───────────────────┘           └───────────────────┘
```

For detailed architectural specifications, read [ARCHITECTURE.md](ARCHITECTURE.md) and [TECH_STACK.md](TECH_STACK.md).

---

## 🛠️ Tech Stack

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend Shell** | Tauri v2 (Rust) | Native window management, low RAM footprint, sidecar process lifecycle |
| **UI Framework** | React 19 + TypeScript | Interface components, routing, SSE client, React Flow canvas |
| **Styling** | Tailwind CSS v4 + Base UI | Component styling, animations, monochromatic dark design |
| **Backend Sidecar** | Python 3.10+ (FastAPI) | Model downloading, engine process orchestration, SSE token streaming |
| **Inference Engines**| `airllm`, `exo-explore` | Layer-wise VRAM swapping & P2P distributed cluster inference |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: `v18+` (LTS recommended)
- **Rust**: `v1.75+` (with `cargo`)
- **Python**: `v3.10+`
- **Tauri Prerequisites**: See [Tauri Setup Guide](https://v2.tauri.app/start/prerequisites/) for platform-specific dependencies.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/m0x-labs/m0x-flow.git
   cd m0x-flow
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Python Sidecar Dependencies**:
   ```bash
   cd backend-sidecar
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   cd ..
   ```

---

## 💻 Development & Building

### Run in Development Mode

Starts the Vite frontend server and spawns the Tauri app window with hot-reloading enabled:

```bash
npm run tauri dev
```

### Build for Production

Compiles the frontend assets, builds the Python sidecar bundle, and packages the standalone native application:

```bash
npm run tauri build
```

### 🚀 Automated GitHub Releases

This project features a fully automated **GitHub Actions Workflow** ([.github/workflows/release.yml](file:///.github/workflows/release.yml)) that compiles the standalone React frontend, PyInstaller Python sidecar, and Tauri Windows native installers (`.exe` / `.msi`) whenever a new version tag is pushed.

To automatically publish a new version release:

```powershell
# Method 1: Using the release helper script
.\release.ps1 -Version 0.2.0

# Method 2: Manual Git Tagging
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions will build the app and upload the `.exe` setup installer, `.msi` package, and release notes directly to your repository's **Releases** tab!

---

## 📂 Project Structure

```text
m0x-flow/
├── backend-sidecar/      # Python FastAPI orchestrator & inference engines 
│   ├── engines/          # AirLLM and Exo process wrappers
│   ├── main.py           # Sidecar API endpoints & SSE streaming handler
│   └── requirements.txt  # Python sidecar dependencies
├── src/                  # React + TypeScript frontend
│   ├── components/       # UI elements (chat, hub, pods, layout)
│   ├── pages/            # Application view pages
│   ├── lib/              # Zustand stores, API clients, hooks
│   └── main.tsx          # React application entry point
├── src-tauri/            # Tauri native shell & Rust configurations
│   ├── tauri.conf.json   # Tauri window & sidecar definitions
│   └── src/main.rs       # Rust app entry point & lifecycle management
├── ARCHITECTURE.md       # High-level architecture documentation
├── DESIGN.md             # UI/UX & design system specification
├── SPECIFICATION.md      # Functional specifications & API contracts
└── TECH_STACK.md         # Technology rules & developer reference guide
```

---

## 📖 Related Documentation

- 📐 [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow diagrams.
- 🎨 [DESIGN.md](DESIGN.md) - UI design system and component breakdown.
- 📋 [SPECIFICATION.md](SPECIFICATION.md) - Features, API contracts, and requirements.
- 🛠️ [TECH_STACK.md](TECH_STACK.md) - Layer responsibilities and quick-reference guide.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
