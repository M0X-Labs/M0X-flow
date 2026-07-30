# m0x-flow: Master AI Developer Specification

## 1. Project Overview
**Name:** m0x-flow (by m0x-labs)
**Purpose:** A unified desktop application that democratizes local AI inference by providing a GUI to run massive Large Language Models (LLMs) on resource-constrained hardware or across a cluster of everyday devices.
**Core Philosophy:** Break the hardware barrier. Zero manual configuration for users. A sleek, minimal footprint.

## 2. Core Execution Engines (The "Workers")
m0x-flow leverages two specific open-source Python frameworks. The software acts as an orchestrator and UI for these tools.

### A. AirLLM Mode (Single Device, Low VRAM)
*   **Target Repo:** `https://github.com/lyogavin/airllm`
*   **Mechanism:** Uses a "divide and conquer" strategy, swapping layers from Disk to VRAM sequentially.
*   **Use Case:** Running a 70B model on a single 4GB or 8GB GPU. 
*   **Implementation Note:** The backend will use standard `transformers` tokenization and wrap the `airllm` library. 

### B. Exo Pods Mode (Multi-Device P2P Cluster)
*   **Target Repo:** `https://github.com/exo-explore/exo`
*   **Mechanism:** Peer-to-Peer (P2P) dynamic model partitioning. Uses Ring Memory-Weighted Partitioning to shard a model across multiple devices on the same LAN/Wi-Fi.
*   **Use Case:** Combining the RAM of a MacBook, a PC, and an old Mac Mini to run a single massive model fast.
*   **Implementation Note:** The backend will start the `exo` daemon (e.g., via `uv run exo`). Exo handles automatic discovery via UDP/Zero-Conf. The backend will communicate with Exo via its local OpenAI-compatible HTTP API (`http://localhost:52415/v1/chat/completions`).

## 3. System Architecture & Tech Stack

The application uses a **Three-Tier Architecture**:

### Tier 1: Frontend (The UI)
*   **Framework:** Tauri (React with TypeScript).
*   **Why:** To maintain a minimal memory footprint. Standard Electron apps use too much RAM, which starves the local LLM.
*   **Responsibilities:** 
    *   Displaying the Model Hub (downloading weights from Hugging Face/MLX Community).
    *   Configuration toggles (AirLLM vs. Exo Pods).
    *   The Chat Interface.
    *   Displaying network topology (fetching `/state` from Exo).

### Tier 2: The Backend Orchestrator (Python Sidecar)
*   **Framework:** Python (FastAPI or standard Python subprocesses via Tauri).
*   **Responsibilities:**
    *   Managing local file systems (`~/.m0x-flow/models/` for weights).
    *   Translating Tauri UI commands into Python execution scripts for AirLLM.
    *   Starting and monitoring the Exo daemon subprocess.
    *   Proxying chat requests from Tauri to the local Exo HTTP endpoint and handling Server-Sent Events (SSE) for token streaming.

### Tier 3: Packaging (The Installer)
*   **Goal:** A "one-click install" for everyday users.
*   **Requirement:** The installer must bundle a standalone Python interpreter and all heavy dependencies (`torch`, `mlx`, CUDA libraries) using PyOxidizer, PyInstaller, or a bundled virtual environment. Users should *not* need to run `pip install`.

## 4. Expected System Behavior (User Flow)

1.  **Launch:** User opens m0x-flow. The Python sidecar starts silently in the background.
2.  **Download:** User browses models and clicks download. The sidecar uses `huggingface_hub` to pull `.safetensors` to the shared `~/.m0x-flow/models/` directory.
3.  **Mode Selection:** 
    *   If **AirLLM** is toggled: The backend prepares the Python script that imports `airllm` to read from the local cache.
    *   If **Exo Pods** is toggled: The backend runs the command to start the `exo` process. Exo automatically broadcasts on the local network to find other devices running m0x-flow.
4.  **Inference:** User types a prompt. 
    *   (AirLLM): Backend calls `model.generate()`.
    *   (Exo): Backend sends an HTTP POST request to `http://localhost:52415/v1/chat/completions`.
5.  **Streaming:** Output tokens are streamed back to the Tauri frontend chat window.

## 5. Instructions for the AI Assistant

**Context Loaded.** You now understand the full scope of the **m0x-flow** project. Your task is to act as the Senior Software Engineer and begin writing the actual codebase based on this architecture.

**Your First Task:**
Initialize the Python backend sidecar. 
1. Create a `main.py` using FastAPI that sets up the local API endpoints for the Tauri frontend to talk to.
2. Include the functions necessary to execute the `exo` daemon as a background subprocess (ensure you handle basic OS detection for the command).
3. Include a placeholder function for the AirLLM inference wrapper.
4. Provide the exact `requirements.txt` file needed for this backend environment. 

Please provide the code blocks ready for implementation.