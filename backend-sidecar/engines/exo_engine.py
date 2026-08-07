"""
Exo Engine — Real P2P Distributed Cluster Inference
=====================================================
Manages the Exo P2P daemon subprocess and proxies chat requests to its
OpenAI-compatible API at http://localhost:52415/v1/chat/completions.

Exo enables multi-device inference by clustering machines on the same LAN
and distributing model layers across pooled VRAM.

Falls back gracefully if the exo package is not installed.
"""

import sys
import os
import json
import time
import threading
import subprocess
import urllib.request
import urllib.error
from typing import Dict, Any, Optional


# Check if exo is available
EXO_AVAILABLE = False
_EXO_IMPORT_ERROR = None

try:
    import importlib
    importlib.import_module("exo")
    EXO_AVAILABLE = True
except ImportError as e:
    _EXO_IMPORT_ERROR = str(e)

# Also check if `exo` CLI binary is in PATH
EXO_CLI_AVAILABLE = False
EXO_CLI_PATH = None
try:
    result = subprocess.run(
        ["exo", "--help"],
        capture_output=True,
        text=True,
        timeout=3,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
    )
    if result.returncode == 0 or "exo" in (result.stdout + result.stderr).lower():
        EXO_CLI_AVAILABLE = True
        EXO_CLI_PATH = "exo"
except Exception:
    pass

# Check for exo in common install locations
if not EXO_CLI_AVAILABLE:
    common_paths = [
        os.path.join(os.environ.get("APPDATA", ""), "Python", "Python313", "Scripts", "exo.exe"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Python", "Python313", "Scripts", "exo.exe"),
    ]
    for p in common_paths:
        if os.path.isfile(p):
            EXO_CLI_AVAILABLE = True
            EXO_CLI_PATH = p
            break


class ExoEngine:
    """Manages the Exo P2P daemon subprocess and proxies inference requests.

    Exo creates a distributed mesh of devices on the same LAN, pooling their
    VRAM/RAM to run large models across multiple machines.

    The daemon exposes an OpenAI-compatible API at http://localhost:52415.
    """

    DEFAULT_PORT = 52415
    STARTUP_TIMEOUT = 45  # increased from 15s — Exo needs time to discover peers + load models
    HEALTH_CHECK_INTERVAL = 30  # seconds between health checks
    HEALTH_CHECK_MAX_RETRIES = 3  # consecutive failures before marking as dead

    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.api_port: int = self.DEFAULT_PORT
        self.api_base: str = f"http://localhost:{self.api_port}"
        self.is_running: bool = False
        self.is_generating: bool = False
        self.model_name: Optional[str] = None
        self.last_speed: float = 0.0
        self._log_callback = None
        self._log_thread: Optional[threading.Thread] = None
        self._health_thread: Optional[threading.Thread] = None
        self._health_stop_event = threading.Event()
        self._consecutive_failures = 0
        self._peers = []
        self._config = None

    def _log(self, level: str, message: str):
        """Send log message to the system log callback if registered."""
        if self._log_callback:
            self._log_callback(level, message, "exo")
        print(f"[Exo] [{level.upper()}] {message}", flush=True)

    def set_log_callback(self, callback):
        """Register a logging callback (typically add_system_log from llama_engine)."""
        self._log_callback = callback

    def _check_api_ready(self) -> bool:
        """Check if the Exo API is responding."""
        try:
            url = f"{self.api_base}/v1/models"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _check_external_exo(self) -> bool:
        """Check if an externally-running Exo daemon is already available."""
        return self._check_api_ready()

    def _health_monitor(self):
        """Background thread that monitors Exo daemon health and auto-restarts if needed."""
        while not self._health_stop_event.is_set():
            self._health_stop_event.wait(self.HEALTH_CHECK_INTERVAL)

            if not self.is_running or not self.process:
                continue

            # Check if process is still alive
            if self.process.poll() is not None:
                self._log("error", f"Exo daemon process died (exit code: {self.process.poll()}). Attempting restart...")
                self.is_running = False
                self._try_restart()
                continue

            # Check API responsiveness
            if not self._check_api_ready():
                self._consecutive_failures += 1
                self._log("warn", f"Exo API unresponsive (failure #{self._consecutive_failures}/{self.HEALTH_CHECK_MAX_RETRIES})")

                if self._consecutive_failures >= self.HEALTH_CHECK_MAX_RETRIES:
                    self._log("error", "Exo daemon unresponsive. Attempting restart...")
                    self.is_running = False
                    self._try_restart()
                    self._consecutive_failures = 0
            else:
                self._consecutive_failures = 0

    def _try_restart(self):
        """Attempt to restart the Exo daemon with previous configuration."""
        if not self._peers and not self.model_name:
            self._log("warn", "Cannot restart Exo — no previous model or peer config")
            return

        try:
            self.stop_daemon()
            time.sleep(2)

            result = self.start_daemon(
                model_identifier=self.model_name or "",
                peers=self._peers or None,
                config=self._config,
            )
            if result.get("status") in ["loaded", "connected"]:
                self._log("info", "Exo daemon restarted successfully")
            else:
                self._log("error", f"Exo daemon restart failed: {result.get('error', 'unknown')}")
        except Exception as e:
            self._log("error", f"Exo daemon restart exception: {e}")

    def start_daemon(
        self,
        model_identifier: str = "",
        model_path: str = None,
        port: int = None,
        config: Optional[dict] = None,
        peers: Optional[list] = None,
    ) -> Dict[str, Any]:
        # NOTE: exo CLI expects a HuggingFace model ID (e.g. 'mlx-community/Llama-3.3-70B'),
        # NOT a local filesystem path. We always use model_identifier as the HF repo ID.
        # model_path is accepted but ignored — exo auto-discovers its local HF cache.
        """Start the Exo P2P daemon as a background subprocess for multi-PC clustering.

        If an external Exo daemon is already running, connects to it instead.

        Args:
            model_identifier: Model to prepare for inference (HF repo ID)
            port: API port (default 52415)
            config: Additional configuration
            peers: List of peer IP addresses to pair with
        """
        self.stop_daemon()

        if port:
            self.api_port = port
            self.api_base = f"http://localhost:{self.api_port}"

        self.model_name = model_identifier
        self._peers = peers or []
        self._config = config

        # Check if an external Exo daemon is already running
        if self._check_external_exo():
            self.is_running = True
            self._log("info", f"Connected to existing Exo daemon at {self.api_base}")
            self._start_health_monitor()
            return {
                "status": "connected",
                "backend": "exo_pods",
                "model": model_identifier,
                "api_base": self.api_base,
                "note": "Connected to externally running Exo daemon",
            }

        # Try to start Exo daemon
        if not EXO_AVAILABLE and not EXO_CLI_AVAILABLE:
            win_note = " Exo requires macOS, Linux, or WSL (Windows Subsystem for Linux) due to Unix file-locking dependencies in exo-rs. On Windows, use Standard CUDA Engine for direct GPU execution." if sys.platform == "win32" else ""
            err_msg = f"Exo daemon not found in Python environment.{win_note}"
            self._log("error", err_msg)
            return {
                "status": "error",
                "backend": "exo_pods",
                "error": err_msg,
                "install_hint": "Use Standard CUDA Engine on Windows, or run Exo inside WSL (Windows Subsystem for Linux) / macOS.",
            }

        self._log("info", "Starting Exo P2P cluster daemon across network...")

        try:
            # Determine the command to launch exo
            cmd = None
            if EXO_CLI_AVAILABLE and EXO_CLI_PATH:
                # Try 'exo run' first, fallback to just 'exo'
                cmd = [EXO_CLI_PATH, "run"]
            elif EXO_AVAILABLE:
                # Try multiple module entry points
                cmd = [sys.executable, "-m", "exo.main"]

            if not cmd:
                err_msg = "No valid Exo entry point found"
                self._log("error", err_msg)
                return {
                    "status": "error",
                    "backend": "exo_pods",
                    "error": err_msg,
                }

            # Always pass the HuggingFace model ID (not local path)
            # exo expects IDs like 'mlx-community/Llama-3.3-70B-Instruct-4bit'
            if model_identifier:
                cmd.append(model_identifier)

            # Add port if non-default
            if self.api_port != self.DEFAULT_PORT:
                cmd.extend(["--chatgpt-api-port", str(self.api_port)])

            # Pass peer IP parameters if provided
            clean_peers = []
            if peers:
                for p in peers:
                    clean_ip = str(p).split()[0].strip()
                    if clean_ip and clean_ip not in ["127.0.0.1", "localhost", "0.0.0.0"]:
                        clean_peers.append(clean_ip)
                        cmd.extend(["--peer", clean_ip])

            # Prepare environment variables allowing inter-PC access
            env = os.environ.copy()
            env["EXO_HOST"] = "0.0.0.0"
            env["EXO_PORT"] = str(self.api_port)
            if clean_peers:
                env["EXO_PEERS"] = ",".join(clean_peers)
            # Disable Metal flush for better performance on Apple Silicon
            env["METAL_FLUSH_ON_SETMEM"] = "1"
            env["METAL_DEVICE_WRITE_COMBINE"] = "1"

            self._log("info", f"Launching Exo daemon: {' '.join(cmd)} (peers: {clean_peers or 'auto-discovery'})")

            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
            )

            recent_logs = []
            def log_reader():
                try:
                    if self.process and self.process.stdout:
                        for line in iter(self.process.stdout.readline, ""):
                            if line:
                                stripped = line.strip()
                                if stripped:
                                    lvl = "error" if "error" in stripped.lower() or "fail" in stripped.lower() else "info"
                                    self._log(lvl, stripped)
                                    recent_logs.append(stripped)
                                    if len(recent_logs) > 50:
                                        recent_logs.pop(0)
                except Exception:
                    pass

            self._log_thread = threading.Thread(target=log_reader, daemon=True)
            self._log_thread.start()

            # Wait for the daemon API to become ready
            ready = False
            start_time = time.time()
            exited_code = None
            while time.time() - start_time < self.STARTUP_TIMEOUT:
                exited_code = self.process.poll()
                if exited_code is not None:
                    # Process exited prematurely
                    break
                if self._check_api_ready():
                    ready = True
                    break
                time.sleep(1.0)

            if ready:
                self.is_running = True
                self._start_health_monitor()
                self._log("info", f"Exo P2P daemon is READY at {self.api_base}")
                return {
                    "status": "loaded",
                    "backend": "exo_pods",
                    "model": model_identifier,
                    "api_base": self.api_base,
                }
            else:
                exited_code = self.process.poll()
                self.stop_daemon()
                log_snippet = " ".join(recent_logs[-10:]) if recent_logs else "No log output captured."
                if exited_code is not None:
                    err_msg = f"Exo daemon process exited with code {exited_code}. Output: {log_snippet}"
                else:
                    err_msg = f"Exo daemon API did not respond within {self.STARTUP_TIMEOUT}s on port {self.api_port}."

                self._log("error", f"Exo daemon start failed: {err_msg}")
                return {
                    "status": "error",
                    "backend": "exo_pods",
                    "model": model_identifier,
                    "error": err_msg,
                    "install_hint": "Install Exo: pip install git+https://github.com/exo-explore/exo.git (requires macOS/Linux/WSL2)",
                }

        except Exception as e:
            self._log("error", f"Failed to start Exo daemon: {e}")
            self.stop_daemon()
            return {
                "status": "error",
                "backend": "exo_pods",
                "error": str(e),
                "install_hint": "Install Exo: pip install git+https://github.com/exo-explore/exo.git (requires macOS/Linux/WSL2)",
            }

    def _start_health_monitor(self):
        """Start the background health monitoring thread."""
        if self._health_thread and self._health_thread.is_alive():
            return

        self._health_stop_event.clear()
        self._health_thread = threading.Thread(target=self._health_monitor, daemon=True)
        self._health_thread.start()
        self._log("info", "Exo health monitor started")

    def stop_daemon(self):
        """Gracefully stop the Exo daemon subprocess."""
        # Stop health monitor first
        self._health_stop_event.set()
        if self._health_thread:
            self._health_thread.join(timeout=3)
            self._health_thread = None

        if self.process:
            self._log("info", "Stopping Exo P2P daemon...")
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            self.process = None

        # Also kill any orphaned exo processes on Windows
        if sys.platform == "win32":
            try:
                subprocess.run("taskkill /F /IM exo.exe", shell=True, capture_output=True)
            except Exception:
                pass

        self.is_running = False
        self.is_generating = False
        self.model_name = None
        self.last_speed = 0.0
        self._consecutive_failures = 0

    def chat_completion(
        self,
        prompt: str,
        model: str = "default",
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Proxy a chat completion request to Exo's OpenAI-compatible API.

        Exo distributes inference across all connected P2P nodes automatically.
        """
        if not self.is_running:
            # One more check — maybe an external daemon is running
            if self._check_external_exo():
                self.is_running = True
            else:
                return {
                    "content": "[Exo Pods Error] Exo daemon is not running. Please start the daemon first.",
                    "tokens_per_sec": 0.0,
                    "backend": "exo_pods",
                    "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                }

        self.is_generating = True
        start_time = time.time()
        self._log("info", f"Exo Pods inference starting: \"{prompt[:80]}...\"")

        try:
            url = f"{self.api_base}/v1/chat/completions"
            request_data = json.dumps({
                "model": model or self.model_name or "default",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }).encode("utf-8")

            req = urllib.request.Request(
                url,
                data=request_data,
                headers={"Content-Type": "application/json"},
            )

            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                response_text = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                completion_tokens = usage.get("completion_tokens", len(response_text.split()))
                prompt_tokens = usage.get("prompt_tokens", len(prompt.split()))

                elapsed = time.time() - start_time
                speed = round(completion_tokens / elapsed, 1) if elapsed > 0 else 30.0
                self.last_speed = speed

                self._log("info", f"Exo Pods inference complete: {completion_tokens} tokens in {elapsed:.1f}s ({speed} t/s)")

                self.is_generating = False
                return {
                    "content": response_text,
                    "tokens_per_sec": speed,
                    "backend": "exo_pods",
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                    },
                }

        except urllib.error.URLError as e:
            self.is_generating = False
            self._log("error", f"Exo API connection error: {e}")
            return {
                "content": f"[Exo Pods Error] Cannot reach Exo API at {self.api_base}: {e}",
                "tokens_per_sec": 0.0,
                "backend": "exo_pods",
                "usage": {"prompt_tokens": len(prompt.split()), "completion_tokens": 0},
            }
        except Exception as e:
            self.is_generating = False
            elapsed = time.time() - start_time
            self._log("error", f"Exo generation error after {elapsed:.1f}s: {e}")
            return {
                "content": f"[Exo Pods Error] Inference failed: {e}",
                "tokens_per_sec": 0.0,
                "backend": "exo_pods",
                "usage": {"prompt_tokens": len(prompt.split()), "completion_tokens": 0},
            }

    def get_cluster_state(self) -> Dict[str, Any]:
        """Fetch the current cluster topology from Exo's API."""
        if not self.is_running:
            return {"nodes": [], "status": "stopped"}

        # Try multiple endpoints that Exo may expose
        for endpoint in ["/topology", "/state", "/v1/cluster"]:
            try:
                url = f"{self.api_base}{endpoint}"
                req = urllib.request.Request(url, method="GET")
                with urllib.request.urlopen(req, timeout=3) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return {"nodes": data.get("nodes", []), "status": "connected", "raw": data}
            except Exception:
                continue

        # Fallback: try to get models list which at least confirms the API is alive
        try:
            url = f"{self.api_base}/v1/models"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = data.get("data", [])
                return {
                    "nodes": [],
                    "status": "connected",
                    "available_models": [m.get("id", "unknown") for m in models],
                }
        except Exception:
            pass

        return {"nodes": [], "status": "unreachable"}

    def get_status(self) -> Dict[str, Any]:
        """Return current engine status and metrics."""
        cluster = self.get_cluster_state() if self.is_running else {"nodes": [], "status": "stopped"}
        return {
            "engine": "exo_pods",
            "is_running": self.is_running,
            "is_generating": self.is_generating,
            "model_name": self.model_name,
            "api_base": self.api_base,
            "last_speed": self.last_speed,
            "cluster": cluster,
            "available": EXO_AVAILABLE or EXO_CLI_AVAILABLE,
            "cli_path": EXO_CLI_PATH,
        }


# Global singleton instance
exo_engine_instance = ExoEngine()