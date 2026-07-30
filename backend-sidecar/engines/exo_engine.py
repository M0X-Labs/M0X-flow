"""
Exo Engine Wrapper
==================
Placeholder for Exo (P2P multi-device cluster) integration.
Manages the exo daemon subprocess and proxies chat requests to its
OpenAI-compatible API at http://localhost:52415/v1/chat/completions.
"""

import subprocess
import sys
from typing import Optional


class ExoEngine:
    """Manages the Exo P2P daemon subprocess."""

    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.api_base = "http://localhost:52415"

    async def start_daemon(self):
        """Start the exo daemon as a background subprocess."""
        # TODO: Implement cross-platform exo daemon launch
        # self.process = subprocess.Popen(
        #     [sys.executable, "-m", "exo"],
        #     stdout=subprocess.PIPE,
        #     stderr=subprocess.PIPE,
        # )
        raise NotImplementedError("Exo daemon launch not yet implemented")

    async def stop_daemon(self):
        """Gracefully stop the exo daemon."""
        if self.process:
            self.process.terminate()
            self.process.wait(timeout=10)
            self.process = None

    async def get_cluster_state(self):
        """Fetch the current cluster topology from Exo's /state endpoint."""
        # TODO: HTTP GET to self.api_base + "/state"
        raise NotImplementedError("Exo cluster state not yet implemented")

    async def chat_completion(self, messages: list, model: str = "default"):
        """Proxy a chat completion request to Exo's OpenAI-compatible API."""
        # TODO: HTTP POST to self.api_base + "/v1/chat/completions"
        raise NotImplementedError("Exo chat completion not yet implemented")
