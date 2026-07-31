"""
Download & Setup Official Cloudflared Binary Auto-Stored inside m0x-flow
========================================================================
Ensures cloudflared.exe is automatically bundled and stored in backend-sidecar/bin/
so the application can run zero-configuration, properly working Cloudflare Tunnels anywhere.
"""

import os
import sys
import urllib.request
from pathlib import Path

BIN_DIR = Path(__file__).parent / "bin"
CLOUDFLARED_EXE = BIN_DIR / "cloudflared.exe"
EMPTY_CONFIG_YML = BIN_DIR / "empty_config.yml"


def setup_cloudflared_binary(log_callback=None):
    BIN_DIR.mkdir(parents=True, exist_ok=True)

    def _log(msg):
        print(msg, flush=True)
        if log_callback:
            log_callback(msg)

    # Ensure empty_config.yml exists to bypass any local ~/.cloudflared/config.yml 404 rules
    if not EMPTY_CONFIG_YML.exists():
        with open(EMPTY_CONFIG_YML, "w", encoding="utf-8") as f:
            f.write("# Empty configuration file to bypass default config.yml 404 catch-all rules for quick tunnels\n")

    if CLOUDFLARED_EXE.exists() and CLOUDFLARED_EXE.stat().st_size > 1000000:
        _log(f"[setup_cloudflared] cloudflared.exe is ready in {CLOUDFLARED_EXE}")
        return str(CLOUDFLARED_EXE)

    url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    _log(f"[setup_cloudflared] Downloading official cloudflared binary from {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
            with open(CLOUDFLARED_EXE, "wb") as f:
                f.write(data)
        _log(f"[setup_cloudflared] Successfully auto-stored cloudflared.exe ({len(data)} bytes) at {CLOUDFLARED_EXE}")
        return str(CLOUDFLARED_EXE)
    except Exception as e:
        _log(f"[setup_cloudflared] Error downloading cloudflared.exe: {e}")
        # Check system fallback
        if os.path.exists(r"C:\Program Files (x86)\cloudflared\cloudflared.exe"):
            return r"C:\Program Files (x86)\cloudflared\cloudflared.exe"
        return None

if __name__ == "__main__":
    setup_cloudflared_binary()
