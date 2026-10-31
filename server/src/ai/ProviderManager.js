/**
 * ProviderManager.js
 * Tracks telemetry, connection health, and provider routing between
 * local Gemma 4 runtime and backup intelligence engines.
 */

class ProviderManager {
  constructor() {
    this.orchestratorUrl = process.env.AI_ORCHESTRATOR_URL || 'http://127.0.0.1:8000';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    this.modelName = process.env.OLLAMA_MODEL || 'gemma4:e2b';

    // Measured Runtime Telemetry
    this.telemetry = {
      modelName: this.modelName,
      orchestratorUrl: this.orchestratorUrl,
      ollamaUrl: this.ollamaUrl,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackCount: 0,
      totalLatencyMs: 0,
      averageLatencyMs: 0,
      lastCheckedAt: null,
      ollamaOnline: false,
      orchestratorOnline: false
    };
  }

  recordRequest(latencyMs, isFallback, isSuccess = true) {
    this.telemetry.totalRequests += 1;
    if (isSuccess && !isFallback) {
      this.telemetry.successfulRequests += 1;
      this.telemetry.totalLatencyMs += latencyMs;
      this.telemetry.averageLatencyMs = Number(
        (this.telemetry.totalLatencyMs / this.telemetry.successfulRequests).toFixed(2)
      );
    } else {
      this.telemetry.failedRequests += 1;
      this.telemetry.fallbackCount += 1;
    }
  }

  async checkStatus() {
    let orchestratorOnline = false;
    let ollamaOnline = false;
    let details = {};

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const resp = await fetch(`${this.orchestratorUrl}/ollama/status`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        orchestratorOnline = true;
        const data = await resp.json();
        ollamaOnline = Boolean(data.online);
        details = data;
      }
    } catch (err) {
      orchestratorOnline = false;
      ollamaOnline = false;
      details = { error: err.message };
    }

    this.telemetry.orchestratorOnline = orchestratorOnline;
    this.telemetry.ollamaOnline = ollamaOnline;
    this.telemetry.lastCheckedAt = new Date().toISOString();

    return {
      orchestratorOnline,
      ollamaOnline,
      modelName: this.modelName,
      telemetry: { ...this.telemetry },
      details
    };
  }

  getTelemetry() {
    return { ...this.telemetry };
  }
}

module.exports = new ProviderManager();
