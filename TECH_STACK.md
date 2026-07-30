# Tech Stack & Language Specification: m0x-flow

To maintain a clean, performant, and maintainable codebase, **m0x-flow** strictly separates concerns across three distinct programming languages. This document defines what languages are used, what they are responsible for, and how they communicate.

## 1. The Golden Rule
**"The frontend is only a remote control; the backend is the engine."**
Never execute heavy file processing, ML model loading, or complex data transformation in TypeScript or Rust. All heavy lifting must be delegated to the Python sidecar.

---

## 2. Language Breakdown & Responsibilities

### A. TypeScript (React + Tailwind)
**Role:** The User Interface and Client-Side Logic.
**Where it lives:** `/src`

*   **What it does:**
    *   Renders the UI components (Chat window, Model Hub, Pods graph).
    *   Manages local application state (React Context/Zustand) like current chat history and active engine toggle.
    *   Listens for Server-Sent Events (SSE) to display text streaming from the AI in real-time.
    *   Calls Tauri IPC commands to trigger backend actions.
*   **Why TypeScript?** It provides a massive ecosystem of UI libraries (like React Flow for the Pods graph and standard Markdown renderers for chat) while ensuring type safety.

### B. Rust (Tauri Core)
**Role:** The OS-Level Shell and Window Manager.
**Where it lives:** `/src-tauri/src`

*   **What it does:**
    *   Initializes the native OS window (borderless, transparent, etc.).
    *   Spawns the Python executable as a "Sidecar" process when the app opens.
    *   Gracefully kills the Python process when the user closes the app.
    *   Provides secure access to the local file system (e.g., choosing where to save `~/.m0x-flow/models/`).
*   **Why Rust?** Tauri uses Rust to interact directly with the operating system without bundling a massive Chromium browser like Electron does. *Note: Developers will rarely need to write heavy Rust code; it acts purely as a secure middleman.*

### C. Python 3.10+ (Backend Sidecar & Inference)
**Role:** The Orchestrator and AI Worker.
**Where it lives:** `/backend-sidecar`

*   **What it does:**
    *   **AirLLM Execution:** Wraps the `airllm` library. Loads the model from disk to VRAM layer-by-layer and executes `model.generate()`.
    *   **Exo Management:** Uses `subprocess.Popen` to start the local `exo` daemon for P2P networking.
    *   **Local API Server:** Runs a lightweight local server (e.g., FastAPI) that the TypeScript frontend sends HTTP requests to.
    *   **Model Management:** Uses `huggingface_hub` to download and verify `.safetensors` model weights.
*   **Why Python?** The entire AI open-source ecosystem is built on Python. Rewriting tools like AirLLM or Exo in Rust or JS is impractical. We bundle a standalone Python environment inside the app installer so the user never has to touch `pip`.

---

## 3. Communication Bridge (How they talk)

Because we are using three different languages, they must communicate securely and instantly on the local machine.

1.  **App Launch (Rust -> Python):** 
    Tauri (Rust) uses the `@tauri-apps/plugin-shell` sidecar feature to launch the bundled Python API server silently on a random open localhost port (e.g., `http://localhost:14321`).
2.  **User Actions (TypeScript -> Python):** 
    When the user clicks "Download Model" or sends a chat message, TypeScript sends a standard HTTP POST request to the local Python API.
3.  **Chat Streaming (Python -> TypeScript):** 
    When generating text, the Python API streams the tokens back to TypeScript using HTTP Server-Sent Events (SSE). This prevents the UI from freezing and gives the user real-time feedback.
4.  **Cluster Discovery (Python -> Python):**
    If the Exo engine is running, the local Python process communicates with other computers running m0x-flow over the local Wi-Fi via UDP broadcasts and HTTP requests.

---

## 4. Developer Quick Reference Guide

If you are about to write a feature, use this checklist to know where the code goes:

| Feature / Task | Write it in... | Location |
| :--- | :--- | :--- |
| Adding a new button or visual animation | **TypeScript** | `/src/components` |
| Plotting a graph of connected devices | **TypeScript** | `/src/components/pods` |
| Changing the window frame color/style | **Rust** | `/src-tauri/tauri.conf.json` |
| Ensuring child processes die on app close | **Rust** | `/src-tauri/src/main.rs` |
| Downloading a model from Hugging Face | **Python** | `/backend-sidecar/api.py` |
| Executing the AirLLM layer-wise script | **Python** | `/backend-sidecar/engines/airllm.py` |
| Starting the Exo cluster subprocess | **Python** | `/backend-sidecar/engines/exo.py` |