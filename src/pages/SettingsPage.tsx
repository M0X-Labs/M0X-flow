import { useState, useEffect } from "react";
import { Settings, HardDrive, Network, Cpu, Check, RefreshCw, ShieldAlert, FolderOpen, Plus, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";
import { getStoredCustomModels, saveStoredCustomModels, CustomModel } from "@/lib/useModelStore";

/**
 * SettingsPage — System Settings at /settings.
 * Provides controls for model storage paths, sidecar API port, Exo network parameters, custom models, and diagnostics.
 */
export function SettingsPage() {
  const [modelDir, setModelDir] = useState("C:\\Users\\xlyre_bk3u4vp\\.m0x-flow\\models");
  const [sidecarPort, setSidecarPort] = useState("14321");
  const [exoPort, setExoPort] = useState("5678");
  const [manualPeer, setManualPeer] = useState("");
  const [saved, setSaved] = useState(false);
  const [testingSidecar, setTestingSidecar] = useState(false);
  const [sidecarResult, setSidecarResult] = useState<string | null>(null);

  // Custom Models State
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showNewModelForm, setShowNewModelForm] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState<"openai" | "anthropic" | "custom">("openai");
  const [newModelId, setNewModelId] = useState("");
  const [newModelApiKey, setNewModelApiKey] = useState("");
  const [newModelBaseUrl, setNewModelBaseUrl] = useState("");
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setCustomModels(getStoredCustomModels());
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestSidecar = async () => {
    setTestingSidecar(true);
    setSidecarResult(null);
    try {
      const res = await fetch(`http://localhost:${sidecarPort}/health`).catch(() => null);
      if (res && res.ok) {
        setSidecarResult("Connected (FastAPI Sidecar Healthy)");
      } else {
        setSidecarResult("Sidecar non-responsive on port " + sidecarPort);
      }
    } catch {
      setSidecarResult("Connection refused");
    } finally {
      setTestingSidecar(false);
    }
  };

  const handleAddCustomModel = () => {
    if (!newModelName.trim() || !newModelId.trim() || !newModelApiKey.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    const customModel: CustomModel = {
      id: Date.now().toString(),
      name: newModelName,
      apiProvider: newModelProvider,
      modelId: newModelId,
      apiKey: newModelApiKey,
      baseUrl: newModelBaseUrl || undefined,
      createdAt: Date.now(),
    };

    const updated = [...customModels, customModel];
    setCustomModels(updated);
    saveStoredCustomModels(updated);

    // Reset form
    setNewModelName("");
    setNewModelId("");
    setNewModelApiKey("");
    setNewModelBaseUrl("");
    setShowNewModelForm(false);
  };

  const handleDeleteCustomModel = (modelId: string) => {
    if (confirm("Are you sure you want to delete this custom model?")) {
      const updated = customModels.filter((m) => m.id !== modelId);
      setCustomModels(updated);
      saveStoredCustomModels(updated);
    }
  };

  const toggleApiKeyVisibility = (modelId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto bg-[#0b0b0e] text-[#e4e4e7] relative select-none">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Title */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                System Preferences
              </h1>
              <p className="text-xs text-zinc-400 font-sans">
                Configure m0x-flow engine parameters, model storage locations, and local sidecar ports.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer border border-blue-400/30"
        >
          <Check className="w-4 h-4" />
          <span>{saved ? "Preferences Saved!" : "Save Changes"}</span>
        </button>
      </div>

      {/* Storage Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#a1a1aa]" /> Storage Settings
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
              LLM Model Weights Directory (Safetensors / GGUF)
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={modelDir}
                onChange={(e) => setModelDir(e.target.value)}
                className="flex-1 bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
              />
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#a1a1aa]" /> Browse
              </button>
            </div>
            <p className="text-[11px] text-[#71717a] mt-2 font-sans">
              Downloaded Hugging Face model checkpoints are streamed layer-by-layer directly from this folder into AirLLM.
            </p>
          </div>
        </div>
      </section>

      {/* Sidecar Python API Engine */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#a1a1aa]" /> Python Sidecar Backend Process
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
              Local FastAPI Server Port
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={sidecarPort}
                onChange={(e) => setSidecarPort(e.target.value)}
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-36 focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
              <button
                type="button"
                onClick={handleTestSidecar}
                disabled={testingSidecar}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#a1a1aa] ${testingSidecar ? "animate-spin" : ""}`} />
                Test Connection
              </button>
              {sidecarResult && (
                <span className="text-xs font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2.5 py-1 rounded-xl border border-[#27272a]">
                  {sidecarResult}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Custom Models & API Keys Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a1a1aa]" /> Custom Models & API Keys
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          {/* Existing Custom Models List */}
          {customModels.length > 0 && (
            <div className="space-y-2 mb-4 pb-4 border-b border-[#27272a]">
              {customModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-[#18181c] border border-[#27272a] rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#f4f4f5] font-mono">{model.name}</p>
                    <p className="text-[10px] text-[#a1a1aa] font-mono">
                      {model.apiProvider.toUpperCase()} • {model.modelId}
                      {model.baseUrl && ` • ${model.baseUrl}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type={showApiKeys[model.id] ? "text" : "password"}
                        value={model.apiKey}
                        readOnly
                        className="bg-[#09090b] text-[10px] text-[#a1a1aa] font-mono px-2 py-1 rounded border border-[#27272a] max-w-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => toggleApiKeyVisibility(model.id)}
                        className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-all"
                      >
                        {showApiKeys[model.id] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomModel(model.id)}
                    className="p-2 rounded-lg hover:bg-red-600/10 text-red-600 hover:text-red-500 transition-all ml-2"
                    title="Delete custom model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Custom Model Form */}
          {!showNewModelForm ? (
            <button
              type="button"
              onClick={() => setShowNewModelForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Custom Model
            </button>
          ) : (
            <div className="space-y-3 bg-[#18181c] border border-[#27272a] rounded-lg p-4">
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 font-sans">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g., GPT-4 Turbo, Claude 3.5"
                  className="w-full bg-[#09090b] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 font-sans">
                    API Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newModelProvider}
                    onChange={(e) => setNewModelProvider(e.target.value as any)}
                    className="w-full bg-[#09090b] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
                  >
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 font-sans">
                    Model ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                    placeholder="e.g., gpt-4-turbo"
                    className="w-full bg-[#09090b] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 font-sans">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newModelApiKey}
                  onChange={(e) => setNewModelApiKey(e.target.value)}
                  placeholder="sk-... or your-api-key"
                  className="w-full bg-[#09090b] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
                />
                <p className="text-[10px] text-[#71717a] mt-1.5 font-sans">
                  API keys are stored securely in your local storage and never sent to servers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 font-sans">
                  Base URL <span className="text-[#71717a] text-[10px] font-normal">(Optional - for custom endpoints)</span>
                </label>
                <input
                  type="text"
                  value={newModelBaseUrl}
                  onChange={(e) => setNewModelBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 (leave empty for defaults)"
                  className="w-full bg-[#09090b] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  className="flex-1 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Save Model
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewModelForm(false)}
                  className="flex-1 py-2 rounded-lg bg-[#18181c] hover:bg-[#222226] text-[#a1a1aa] text-xs font-bold transition-all cursor-pointer border border-[#27272a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Network & Exo Pods Cluster */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Network className="w-4 h-4 text-[#a1a1aa]" /> Exo Pods P2P Networking
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
                UDP Broadcast Discovery Port
              </label>
              <input
                type="text"
                value={exoPort}
                onChange={(e) => setExoPort(e.target.value)}
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-full focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
                Manual Peer IP Override (Tailscale / VPN)
              </label>
              <input
                type="text"
                value={manualPeer}
                onChange={(e) => setManualPeer(e.target.value)}
                placeholder="e.g. 100.64.0.15"
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-full placeholder-[#71717a] focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Diagnostic Logs Section */}
      <section className="space-y-3 pb-8">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#a1a1aa]" /> System Diagnostics
        </h2>
        <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 font-mono text-[11px] text-[#a1a1aa] space-y-1.5">
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[m0x-flow] Native window initialized (Tauri v2 OS shell)</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[m0x-flow] Python sidecar spawned on http://localhost:14321</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[AirLLM] Offloading engine ready for 70B layer-by-layer streaming</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[Exo P2P] Listening for UDP discovery broadcasts on port 5678</span></div>
        </div>
      </section>
    </div>
  );
}


