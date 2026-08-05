import { useState, useEffect, useCallback } from "react";

export interface HostedModel {
  id: string;
  name: string;
  engineMode: "standard" | "airllm" | "exo";
  port?: number;
  hostIp?: string;
  cloudflareActive?: boolean;
  cloudflareUrl?: string | null;
}

export interface HardwareMetrics {
  isRunning: boolean;
  tokensPerSec: number;
  vramUsedGB: number;
  vramTotalGB: number;
  ramUsedGB: number;
  ramTotalGB: number;
  activeEngine: string;
  temperature: string;
  gpuModel?: string;
}

const DEFAULT_METRICS: HardwareMetrics = {
  isRunning: false,
  tokensPerSec: 0.0,
  vramUsedGB: 0.0,
  vramTotalGB: 0.0,
  ramUsedGB: 0.0,
  ramTotalGB: 0.0,
  activeEngine: "Idle (No Model Loaded)",
  temperature: "--",
  gpuModel: "",
};

// Global reactive state listeners
let globalHostedModel: HostedModel | null = null;
let globalIsGenerating = false;
let globalEngineMode: "standard" | "airllm" | "exo" = "standard";
let globalMetrics: HardwareMetrics = DEFAULT_METRICS;
let globalIsLoaded = false;
let globalCloudflareUrl: string | null = null;
let globalCloudflareActive = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useRuntimeStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Poll metrics from sidecar API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("http://localhost:14321/api/system/metrics").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          globalMetrics = {
            isRunning: data.is_running || false,
            tokensPerSec: data.tokens_per_sec || 0.0,
            vramUsedGB: data.vram_used_gb || 0.0,
            vramTotalGB: data.vram_total_gb || 16.0,
            ramUsedGB: data.ram_used_gb || 0.0,
            ramTotalGB: data.ram_total_gb || 0.0,
            activeEngine: data.active_engine || "Idle (No Model Loaded)",
            temperature: data.is_running ? "48°C" : "38°C",
            gpuModel: data.gpu_model || "GPU Device",
          };
          globalIsLoaded = true;

          if (data.hosted_model?.is_hosted) {
            globalHostedModel = {
              id: data.hosted_model.model_id,
              name: data.hosted_model.model_name,
              engineMode: data.hosted_model.engine_mode,
              port: data.hosted_model.port,
              hostIp: data.hosted_model.host_ip,
              cloudflareActive: data.hosted_model.cloudflare_active,
              cloudflareUrl: data.hosted_model.cloudflare_url,
            };
            if (data.hosted_model.cloudflare_active) {
              globalCloudflareActive = true;
              if (data.hosted_model.cloudflare_url) {
                globalCloudflareUrl = data.hosted_model.cloudflare_url;
              }
            } else {
              globalCloudflareActive = false;
              globalCloudflareUrl = null;
            }
          } else if (!globalIsGenerating && !globalHostedModel?.id) {
            globalHostedModel = null;
          }
          notify();
        }
      } catch {
        // keep local state
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1500);
    return () => clearInterval(interval);
  }, []);

  const hostModel = useCallback(async (
    id: string,
    name: string,
    engineMode: "standard" | "airllm" | "exo" = "standard",
    port: number = 8080,
    hostIp: string = "127.0.0.1",
    cloudflareActive: boolean = false,
    config: any = {},
    serverSettings: any = {}
  ) => {
    globalHostedModel = {
      id,
      name,
      engineMode,
      port,
      hostIp,
      cloudflareActive,
      cloudflareUrl: cloudflareActive ? globalCloudflareUrl : null,
    };
    globalEngineMode = engineMode;
    globalMetrics = {
      ...globalMetrics,
      isRunning: true,
      activeEngine: engineMode === "exo" ? `Exo Pods Mesh (${name}) — Loading...` : engineMode === "airllm" ? `AirLLM (${name}) — Loading...` : `Standard (${name}) — Loading...`,
    };
    notify();

    fetch("http://localhost:14321/api/model/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model_id: id, 
        model_name: name, 
        engine_mode: engineMode, 
        port, 
        host_ip: hostIp, 
        cloudflare_active: cloudflareActive,
        config,
        server_settings: serverSettings
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") {
          globalHostedModel = null;
          const errorMsg = data.error || "Failed to host model";
          const hint = data.install_hint ? `\n\n💡 ${data.install_hint}` : "";
          alert(`⚠️ Hosting Error: ${errorMsg}${hint}`);

          globalMetrics = {
            ...globalMetrics,
            isRunning: false,
            activeEngine: `${engineMode === "exo" ? "Exo Pods" : engineMode === "airllm" ? "AirLLM" : "Standard"} (${name}) — Failed`,
          };
          notify();
          return;
        }

        // Update engine label based on actual load result
        const loadStatus = data?.engine_load?.status || "unknown";
        const engineLabel = loadStatus === "error"
          ? `${engineMode === "exo" ? "Exo Pods" : engineMode === "airllm" ? "AirLLM" : "Standard"} (${name}) — Error`
          : engineMode === "exo" ? `Exo Pods Mesh (${name})` : engineMode === "airllm" ? `AirLLM (${name})` : `Standard (${name})`;

        globalMetrics = {
          ...globalMetrics,
          isRunning: loadStatus !== "error",
          activeEngine: engineLabel,
        };

        const realUrl = data?.tunnel?.url || data?.state?.cloudflare_url || null;
        if (cloudflareActive && realUrl) {
          globalCloudflareUrl = realUrl;
          if (globalHostedModel) {
            globalHostedModel = { ...globalHostedModel, cloudflareActive: true, cloudflareUrl: realUrl };
          }
        } else if (!cloudflareActive) {
          globalCloudflareUrl = null;
          if (globalHostedModel) {
            globalHostedModel = { ...globalHostedModel, cloudflareActive: false, cloudflareUrl: null };
          }
        }
        notify();
      })
      .catch(() => null);
  }, []);

  const unhostModel = useCallback(async () => {
    globalHostedModel = null;
    globalIsGenerating = false;
    globalMetrics = DEFAULT_METRICS;
    globalCloudflareUrl = null;
    globalCloudflareActive = false;
    notify();

    fetch("http://localhost:14321/api/model/unhost", {
      method: "POST",
    }).catch(() => null);
  }, []);

  const setGenerating = useCallback((isGen: boolean, speed?: number, modelName?: string, engine?: "standard" | "airllm" | "exo") => {
    globalIsGenerating = isGen;
    if (isGen) {
      const mode = engine || globalEngineMode;
      globalMetrics = {
        ...globalMetrics,
        isRunning: true,
        tokensPerSec: speed || globalMetrics.tokensPerSec,
        activeEngine: mode === "exo" ? `Exo Pods Mesh (${modelName || "Generating..."})` : mode === "airllm" ? `AirLLM (${modelName || "Generating..."})` : `Standard (${modelName || "Generating..."})`,
      };
    } else {
      if (!globalHostedModel) {
        globalMetrics = DEFAULT_METRICS;
      } else {
        globalMetrics = {
          ...globalMetrics,
          tokensPerSec: 0.0,
        };
      }
    }
    notify();
  }, []);

  const updateNetworkConfig = useCallback((port: number, hostIp: string, cloudflareActive: boolean) => {
    if (globalHostedModel) {
      globalHostedModel = {
        ...globalHostedModel,
        port,
        hostIp,
        cloudflareActive,
        cloudflareUrl: cloudflareActive ? globalCloudflareUrl : null,
      };
      notify();
      fetch("http://localhost:14321/api/model/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: globalHostedModel.id,
          model_name: globalHostedModel.name,
          engine_mode: globalHostedModel.engineMode,
          port,
          host_ip: hostIp,
          cloudflare_active: cloudflareActive,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const realUrl = data?.tunnel?.url || data?.state?.cloudflare_url || null;
          if (cloudflareActive && realUrl) {
            globalCloudflareUrl = realUrl;
            if (globalHostedModel) {
              globalHostedModel = { ...globalHostedModel, cloudflareActive: true, cloudflareUrl: realUrl };
            }
          } else if (!cloudflareActive) {
            globalCloudflareUrl = null;
            if (globalHostedModel) {
              globalHostedModel = { ...globalHostedModel, cloudflareActive: false, cloudflareUrl: null };
            }
          }
          notify();
        })
        .catch(() => null);
    }
  }, []);

  const toggleCloudflare = useCallback(async (enabled: boolean, port: number = 8080, hostIp: string = "127.0.0.1") => {
    globalCloudflareActive = enabled;
    if (!enabled) {
      globalCloudflareUrl = null;
    }
    if (globalHostedModel) {
      globalHostedModel = {
        ...globalHostedModel,
        cloudflareActive: enabled,
        cloudflareUrl: enabled ? globalCloudflareUrl : null,
      };
    }
    notify();

    fetch("http://localhost:14321/api/tunnel/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, port, host_ip: hostIp }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (enabled && data.url) {
          globalCloudflareUrl = data.url;
          globalCloudflareActive = true;
          if (globalHostedModel) {
            globalHostedModel = { ...globalHostedModel, cloudflareActive: true, cloudflareUrl: data.url };
          }
        } else if (!enabled) {
          globalCloudflareUrl = null;
          globalCloudflareActive = false;
          if (globalHostedModel) {
            globalHostedModel = { ...globalHostedModel, cloudflareActive: false, cloudflareUrl: null };
          }
        }
        notify();
      })
      .catch(() => null);
  }, []);

  return {
    hostedModel: globalHostedModel,
    isGenerating: globalIsGenerating,
    engineMode: globalEngineMode,
    metrics: globalMetrics,
    isLoaded: globalIsLoaded,
    cloudflareUrl: globalCloudflareUrl,
    cloudflareActive: globalCloudflareActive,
    hostModel,
    unhostModel,
    setGenerating,
    updateNetworkConfig,
    toggleCloudflare,
  };
}
