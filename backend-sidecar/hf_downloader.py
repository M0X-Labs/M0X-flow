"""
Hugging Face Real Model Downloader Module for m0x-flow Sidecar.
Handles real streaming file downloads from Hugging Face Hub with progress tracking.
"""

import os
import sys
import time
import json
import shutil
import urllib.request
import urllib.error
import threading
from pathlib import Path
from typing import Dict, Any, Optional

try:
    from huggingface_hub import hf_hub_download
    HF_HUB_AVAILABLE = True
except ImportError:
    HF_HUB_AVAILABLE = False

DOWNLOAD_JOBS: Dict[str, Dict[str, Any]] = {}
CANCEL_REQUESTS: Dict[str, bool] = {}


def get_hf_model_files(model_id: str) -> list:
    """Fetch file list from Hugging Face Hub API for a given model repository."""
    url = f"https://huggingface.co/api/models/{model_id}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) m0x-flow/0.1",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return [f["rfilename"] for f in data.get("siblings", [])]
    except Exception as e:
        print(f"[m0x-sidecar] Warning: Could not fetch HF repo files for {model_id}: {e}", flush=True)
    return []


def select_download_target_file(model_id: str, quantization: str, files: list) -> tuple:
    """
    Select best target file to download based on model type and quantization variant.
    Returns (filename, is_gguf).
    """
    quant_clean = quantization.strip().lower().replace("-", "_")

    # Look for GGUF files
    gguf_files = [f for f in files if f.endswith(".gguf")]
    if gguf_files:
        for f in gguf_files:
            if quant_clean in f.lower().replace("-", "_"):
                return f, True
        for key in ["q4_k_m", "q4_k_s", "q4", "iq4", "q5_k_m", "q5", "q8_0", "q8", "iq2", "iq3", "bf16"]:
            if key in quant_clean:
                for f in gguf_files:
                    if key in f.lower().replace("-", "_"):
                        return f, True
        return gguf_files[0], True

    safetensors_files = [f for f in files if f.endswith(".safetensors")]
    if safetensors_files:
        return safetensors_files[0], False

    if files:
        return files[0], False

    return f"{model_id.split('/')[-1]}.bin", False


def execute_download_worker(model_id: str, quantization: str, dest_dir: Path):
    """Background worker thread executing real streaming download from Hugging Face Hub."""
    safe_name = model_id.replace("/", "--")
    model_path = dest_dir / safe_name
    model_path.mkdir(parents=True, exist_ok=True)

    DOWNLOAD_JOBS[model_id] = {
        "model_id": model_id,
        "status": "downloading",
        "progress": 5.0,
        "speed": "Initializing...",
        "downloaded_bytes": 0,
        "total_bytes": 100 * 1024 * 1024,
        "file_name": "metadata",
        "error": None,
    }

    CANCEL_REQUESTS[model_id] = False

    try:
        files = get_hf_model_files(model_id)
        target_file, is_gguf = select_download_target_file(model_id, quantization, files)
        filename_only = target_file.split("/")[-1]
        save_file_path = model_path / filename_only

        DOWNLOAD_JOBS[model_id]["file_name"] = filename_only

        # Method A: Use huggingface_hub for resilient download if available
        if HF_HUB_AVAILABLE and is_gguf:
            print(f"[m0x-sidecar] Downloading via huggingface_hub: {model_id}/{target_file}", flush=True)
            DOWNLOAD_JOBS[model_id]["speed"] = "Downloading..."
            DOWNLOAD_JOBS[model_id]["progress"] = 30.0

            dl_path = hf_hub_download(repo_id=model_id, filename=target_file)
            shutil.copy(dl_path, save_file_path)

            file_size = save_file_path.stat().st_size
            DOWNLOAD_JOBS[model_id]["downloaded_bytes"] = file_size
            DOWNLOAD_JOBS[model_id]["total_bytes"] = file_size
        else:
            # Method B: HTTP Streaming Download with User-Agent & Redirect Handling
            download_url = f"https://huggingface.co/{model_id}/resolve/main/{target_file}"
            print(f"[m0x-sidecar] Downloading HTTP stream: {download_url} -> {save_file_path}", flush=True)

            req = urllib.request.Request(
                download_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) m0x-flow/0.1"},
            )

            resp = urllib.request.urlopen(req, timeout=30)
            content_length = resp.headers.get("Content-Length")
            total_bytes = int(content_length) if content_length and content_length.isdigit() else 500 * 1024 * 1024

            DOWNLOAD_JOBS[model_id]["total_bytes"] = total_bytes
            downloaded_bytes = 0
            start_time = time.time()
            chunk_size = 2 * 1024 * 1024  # 2MB chunks

            with open(save_file_path, "wb") as f_out:
                while True:
                    if CANCEL_REQUESTS.get(model_id, False):
                        print(f"[m0x-sidecar] Download cancelled for {model_id}", flush=True)
                        DOWNLOAD_JOBS[model_id]["status"] = "cancelled"
                        f_out.close()
                        if save_file_path.exists():
                            save_file_path.unlink()
                        return

                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break

                    f_out.write(chunk)
                    downloaded_bytes += len(chunk)

                    elapsed = time.time() - start_time
                    speed_mbps = (downloaded_bytes / (1024 * 1024)) / elapsed if elapsed > 0 else 0
                    pct = min(round((downloaded_bytes / total_bytes) * 100, 1), 99.9)

                    DOWNLOAD_JOBS[model_id]["downloaded_bytes"] = downloaded_bytes
                    DOWNLOAD_JOBS[model_id]["progress"] = pct
                    DOWNLOAD_JOBS[model_id]["speed"] = f"{speed_mbps:.1f} MB/s"

        # Write ready model_info.json marker
        info_file = model_path / "model_info.json"
        with open(info_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "id": model_id,
                    "status": "ready",
                    "quantization": quantization,
                    "download_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "engine": "m0x-flow",
                },
                f,
                indent=2,
            )

        DOWNLOAD_JOBS[model_id]["status"] = "completed"
        DOWNLOAD_JOBS[model_id]["progress"] = 100.0
        DOWNLOAD_JOBS[model_id]["speed"] = "Done"
        print(f"[m0x-sidecar] Successfully completed download for {model_id}", flush=True)

    except Exception as e:
        print(f"[m0x-sidecar] Error downloading model {model_id}: {e}", flush=True)
        DOWNLOAD_JOBS[model_id]["status"] = "failed"
        DOWNLOAD_JOBS[model_id]["error"] = str(e)


def trigger_hf_download(model_id: str, quantization: str, dest_dir: Path) -> Dict[str, Any]:
    """Start background download thread for a given model repository."""
    t = threading.Thread(
        target=execute_download_worker,
        args=(model_id, quantization, dest_dir),
        daemon=True,
    )
    t.start()
    return {"model_id": model_id, "quantization": quantization, "status": "started"}


def get_download_status(model_id: str) -> Dict[str, Any]:
    """Return real-time download status for a given model ID."""
    if model_id in DOWNLOAD_JOBS:
        return DOWNLOAD_JOBS[model_id]
    return {"model_id": model_id, "status": "not_started", "progress": 0.0, "speed": "0 MB/s"}


def cancel_hf_download(model_id: str) -> Dict[str, Any]:
    """Flag a download job for cancellation."""
    CANCEL_REQUESTS[model_id] = True
    return {"model_id": model_id, "status": "cancellation_requested"}
