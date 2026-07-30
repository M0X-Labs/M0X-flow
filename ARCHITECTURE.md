# System Architecture: m0x-flow

m0x-flow utilizes a **Three-Tier Architecture** to maintain a lightweight UI while handling heavy Python-based AI workloads.

## 1. Frontend (Tauri + React/TypeScript)
* **Role:** User interface, state management, and configuration.
* **Why Tauri?** Traditional Electron apps consume too much RAM. Tauri uses the system's native webview, keeping memory available for LLM inference.

## 2. Backend Orchestrator (Python Sidecar)
* **Role:** Acts as the bridge between the React frontend and the complex Python AI ecosystem.
* **Functions:**
  * Manages model downloads via Hugging Face/MLX formats.
  * Translates UI commands into execution commands for the inference engines.
  * Handles API routing and Server-Sent Events (SSE) for token streaming.

## 3. Inference Engines (The Workers)
m0x-flow dynamically switches between two underlying execution environments based on user configuration:

| Mode | Engine | How it works | Best for |
| :--- | :--- | :--- | :--- |
| **Single Device** | `airllm` | Swaps layers from Disk to VRAM sequentially. | Users with one low-RAM machine testing huge models. |
| **Exo Pods** | `exo` | Uses Ring Memory-Weighted Partitioning to shard layers across network devices. | Users with multiple devices (Macs, PCs) on the same Wi-Fi. |

## 📁 Directory Structure
* `~/.m0x-flow/models/`: Shared model weight storage.
* `~/.m0x-flow/env/`: Isolated Python virtual environment.