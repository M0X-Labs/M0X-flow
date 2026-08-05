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
except Exception:
    pass


class ExoEngine:
    """Manages the Exo P2P daemon subprocess and proxies inference requests.
    
    Exo creates a distributed mesh of devices on the same LAN, pooling their
    VRAM/RAM to run large models across multiple machines.
    
    The daemon exposes an OpenAI-compatible API at http://localhost:52415.
    """

    DEFAULT_PORT = 52415
    STARTUP_TIMEOUT = 15  # seconds to wait for daemon to become ready

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
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _check_external_exo(self) -> bool:
        """Check if an externally-running Exo daemon is already available."""
        return self._check_api_ready()

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
            model_identifier: Model to prepare for inference
            port: API port (default 52415)
            config: Additional configuration
            peers: List of peer IP addresses to pair with
        """
        self.stop_daemon()

        if port:
            self.api_port = port
            self.api_base = f"http://localhost:{self.api_port}"

        self.model_name = model_identifier

        # Check if an external Exo daemon is already running
        if self._check_external_exo():
            self.is_running = True
            self._log("info", f"Connected to existing Exo daemon at {self.api_base}")
            return {
                "status": "connected",
                "backend": "exo_pods",
                "model": model_identifier,
                "api_base": self.api_base,
                "note": "Connected to externally running Exo daemon",
            }

        # Try to start Exo daemon
        if not EXO_AVAILABLE and not EXO_CLI_AVAILABLE:
            self._log("error", f"Exo not installed. Error: {_EXO_IMPORT_ERROR}")
            self._log("info", "Install with: pip install exo-explore")
            return {
                "status": "error",
                "backend": "exo_pods",
                "error": f"Exo not installed: {_EXO_IMPORT_ERROR}",
                "install_hint": "pip install exo-explore",
            }

        self._log("info", "Starting Exo P2P cluster daemon across network...")

        try:
            # Determine the command to launch exo
            if EXO_CLI_AVAILABLE:
                cmd = ["exo", "run"]
            else:
                cmd = [sys.executable, "-m", "exo", "run"]

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
            import os
            env = os.environ.copy()
            env["EXO_HOST"] = "0.0.0.0"
            if clean_peers:
                env["EXO_PEERS"] = ",".join(clean_peers)

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

            # Start background log reader thread
            def log_reader():
                try:
                    if self.process and self.process.stdout:
                        for line in iter(self.process.stdout.readline, ""):
                            if line:
                                stripped = line.strip()
                                if stripped:
                                    lvl = "error" if "error" in stripped.lower() or "fail" in stripped.lower() else "info"
                                    self._log(lvl, stripped)
                except Exception:
                    pass

            self._log_thread = threading.Thread(target=log_reader, daemon=True)
            self._log_thread.start()

            # Wait for the daemon API to become ready
            ready = False
            start_time = time.time()
            while time.time() - start_time < self.STARTUP_TIMEOUT:
                if self.process.poll() is not None:
                    # Process exited prematurely
                    self._log("error", "Exo daemon exited prematurely")
                    break
                if self._check_api_ready():
                    ready = True
                    break
                time.sleep(0.5)

            if ready:
                self.is_running = True
                self._log("info", f"Exo P2P daemon is READY at {self.api_base}")
                return {
                    "status": "loaded",
                    "backend": "exo_pods",
                    "model": model_identifier,
                    "api_base": self.api_base,
                }
            else:
                self._log("warn", "Exo daemon started but API not ready within timeout. It may still be initializing.")
                self.is_running = True  # Optimistic — daemon may still be starting
                return {
                    "status": "starting",
                    "backend": "exo_pods",
                    "model": model_identifier,
                    "api_base": self.api_base,
                    "note": "Daemon started but API not yet ready — may need more time for peer discovery",
                }

        except Exception as e:
            self._log("error", f"Failed to start Exo daemon: {e}")
            self.stop_daemon()
            return {
                "status": "error",
                "backend": "exo_pods",
                "error": str(e),
            }

    def stop_daemon(self):
        """Gracefully stop the Exo daemon subprocess."""
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

            with urllib.request.urlopen(req, timeout=120) as resp:
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
        }


# Global singleton instance
exo_engine_instance = ExoEngine()
