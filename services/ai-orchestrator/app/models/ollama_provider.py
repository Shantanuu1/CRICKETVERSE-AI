"""
Ollama Provider for Google Gemma 4 (gemma4:e2b).
Handles local model inference, health check probes, latency measurement,
and real telemetry collection.
"""

import os
import time
import requests
from typing import Dict, Any, Optional


class OllamaProvider:
    """Manages communication with local Ollama runtime hosting Gemma 4."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 8.0,
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "gemma4:e2b")
        self.timeout_seconds = timeout_seconds

        # Measured Telemetry
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.fallback_count = 0
        self.total_latency_ms = 0.0

    def check_health(self) -> Dict[str, Any]:
        """Checks whether the Ollama server is running and the target model is available."""
        try:
            start_time = time.perf_counter()
            resp = requests.get(f"{self.base_url}/api/tags", timeout=1.5)
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            if resp.status_code == 200:
                models = [m.get("name", "") for m in resp.json().get("models", [])]
                model_found = any(self.model_name in m for m in models)
                return {
                    "online": True,
                    "model_available": model_found,
                    "model_name": self.model_name,
                    "available_models": models,
                    "ping_latency_ms": round(elapsed_ms, 2),
                    "error": None if model_found else f"Model '{self.model_name}' not in Ollama library. Run: ollama pull {self.model_name}",
                }
            else:
                return {
                    "online": False,
                    "model_available": False,
                    "model_name": self.model_name,
                    "error": f"Ollama HTTP error status: {resp.status_code}",
                }
        except Exception as e:
            return {
                "online": False,
                "model_available": False,
                "model_name": self.model_name,
                "error": f"Cannot connect to Ollama at {self.base_url}: {str(e)}",
            }

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """
        Sends prompt to Ollama /api/generate endpoint.
        Returns actual measured response and telemetry or marks as fallback.
        """
        self.total_requests += 1
        start_time = time.perf_counter()

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout_seconds,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            if resp.status_code == 200:
                data = resp.json()
                response_text = data.get("response", "").strip()
                self.successful_requests += 1
                self.total_latency_ms += elapsed_ms

                return {
                    "text": response_text,
                    "is_fallback": False,
                    "model": self.model_name,
                    "latency_ms": round(elapsed_ms, 2),
                    "error": None,
                }
            else:
                self.failed_requests += 1
                self.fallback_count += 1
                return {
                    "text": "",
                    "is_fallback": True,
                    "model": self.model_name,
                    "latency_ms": round(elapsed_ms, 2),
                    "error": f"Ollama responded with HTTP {resp.status_code}",
                }
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            self.failed_requests += 1
            self.fallback_count += 1
            return {
                "text": "",
                "is_fallback": True,
                "model": self.model_name,
                "latency_ms": round(elapsed_ms, 2),
                "error": f"Ollama request error: {str(e)}",
            }

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns accurate runtime telemetry without any fabricated values."""
        avg_latency = (
            round(self.total_latency_ms / self.successful_requests, 2)
            if self.successful_requests > 0
            else 0.0
        )
        return {
            "model_name": self.model_name,
            "ollama_endpoint": self.base_url,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "fallback_count": self.fallback_count,
            "average_latency_ms": avg_latency,
        }
