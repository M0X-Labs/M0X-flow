"""
Download & Setup Official Llama.cpp CUDA Binary for Windows GPU Acceleration
===========================================================================
Downloads pre-compiled llama-server.exe and CUDA runtime DLLs from ggml-org/llama.cpp
so models execute directly on NVIDIA GPUs (e.g. RTX 5080) with full VRAM allocation.
"""

import io
import zipfile
import urllib.request
from pathlib import Path

BIN_DIR = Path(__file__).parent / "bin"


def setup_llama_binary():
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    server_exe = BIN_DIR / "llama-server.exe"

    if server_exe.exists():
        print(f"[setup_llama_bin] llama-server.exe already present in {BIN_DIR}", flush=True)
        return str(server_exe)

    base_url = "https://github.com/ggml-org/llama.cpp/releases/download/b10199"
    zips = [
        "llama-b10199-bin-win-cuda-13.3-x64.zip",
        "cudart-llama-bin-win-cuda-13.3-x64.zip"
    ]

    for zip_name in zips:
        url = f"{base_url}/{zip_name}"
        print(f"[setup_llama_bin] Downloading {zip_name}...", flush=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                print(f"[setup_llama_bin] Downloaded {len(data)} bytes. Extracting to {BIN_DIR}...", flush=True)
                with zipfile.ZipFile(io.BytesIO(data)) as z:
                    z.extractall(BIN_DIR)
        except Exception as e:
            print(f"[setup_llama_bin] Error downloading {zip_name}: {e}", flush=True)

    if server_exe.exists():
        print(f"[setup_llama_bin] Successfully installed llama-server CUDA binary at {server_exe}", flush=True)
        return str(server_exe)
    else:
        print("[setup_llama_bin] Warning: llama-server.exe installation not completed.", flush=True)
        return None


if __name__ == "__main__":
    setup_llama_binary()
