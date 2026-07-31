import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip, Sparkles, ChevronDown, Download, Check, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredModels, RealModel, getStoredCustomModels, CustomModel } from "@/lib/useModelStore";

interface PromptInputProps {
  onSendMessage?: (text: string, model: string) => void;
  onStopGeneration?: () => void;
  isGenerating?: boolean;
}

/**
 * PromptInput — Clean Obsidian glass prompt box with model selector,
 * attachment trigger, stop controls, auto-expanding input, and click-outside dismissal.
 */
export function PromptInput({ onSendMessage, onStopGeneration, isGenerating = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [downloadedModels, setDownloadedModels] = useState<RealModel[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load real models and custom models from local storage / sidecar
  useEffect(() => {
    const models = getStoredModels();
    const custom = getStoredCustomModels();
    setDownloadedModels(models);
    setCustomModels(custom);
    
    // Prefer custom models first, then downloaded models, then default model
    if (custom.length > 0 && !selectedModelId) {
      setSelectedModelId(`custom-${custom[0].id}`);
    } else if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    } else if (!selectedModelId) {
      setSelectedModelId("unsloth/Qwen3.6-27B-MTP-GGUF");
    }
  }, [showModelMenu, selectedModelId]);

  // Click outside to close model dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };

    if (showModelMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModelMenu]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onSendMessage?.(prompt.trim(), selectedModelId || "huggingface/default");
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeModel = downloadedModels.find((m) => m.id === selectedModelId);
  const activeCustomModel = selectedModelId?.startsWith("custom-") 
    ? customModels.find((m) => m.id === selectedModelId.replace("custom-", ""))
    : null;

  const displayModelName = activeCustomModel 
    ? activeCustomModel.name 
    : activeModel?.name 
    ? activeModel.name 
    : "Select Model";

  return (
    <div className="p-4 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent z-20 relative select-none">
      <div className="relative max-w-4xl mx-auto rounded-2xl bg-[#121215] p-3.5 border border-[#27272a] focus-within:border-[#3f3f46] transition-all">
        {/* Model Selector Bar */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#27272a]">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-semibold text-[#f4f4f5] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a1a1aa]" />
              <span className="font-mono text-xs truncate max-w-[220px]">
                {displayModelName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#71717a] transition-transform duration-200 ${showModelMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {showModelMenu && (
              <div className="absolute left-0 bottom-full mb-2.5 w-84 rounded-2xl bg-[#121215] border border-[#27272a] py-2 z-50 shadow-2xl max-h-96 overflow-y-auto">
                {/* Custom Models Section */}
                {customModels.length > 0 && (
                  <>
                    <div className="px-3.5 py-1.5 text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wider border-b border-[#27272a] mb-1 flex items-center justify-between sticky top-0 bg-[#121215] z-10">
                      <span>Custom Models</span>
                      <span className="text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
                        {customModels.length}
                      </span>
                    </div>
                    <div className="space-y-0.5 px-1 mb-2">
                      {customModels.map((model) => (
                        <button
                          key={`custom-${model.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(`custom-${model.id}`);
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs rounded-xl flex items-center justify-between hover:bg-[#18181c] transition-all cursor-pointer ${
                            selectedModelId === `custom-${model.id}`
                              ? "text-white font-bold bg-[#27272a] border border-[#3f3f46]"
                              : "text-[#a1a1aa]"
                          }`}
                        >
                          <div>
                            <div className="font-mono truncate">{model.name}</div>
                            <div className="text-[9px] text-[#71717a]">{model.apiProvider.toUpperCase()}</div>
                          </div>
                          {selectedModelId === `custom-${model.id}` && <Check className="w-3.5 h-3.5 text-[#f4f4f5] shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-[#27272a] my-1 pt-1"></div>
                  </>
                )}

                {/* Downloaded Models Section */}
                <div className="px-3.5 py-1.5 text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wider border-b border-[#27272a] mb-1 flex items-center justify-between sticky top-12 bg-[#121215] z-10">
                  <span>Downloaded Models</span>
                  <span className="text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
                    {downloadedModels.length}
                  </span>
                </div>

                {downloadedModels.length === 0 && customModels.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-[#a1a1aa] mb-3 font-sans">No models configured yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelMenu(false);
                        navigate("/hub");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Models in Hub
                    </button>
                  </div>
                ) : downloadedModels.length > 0 ? (
                  <>
                    <div className="max-h-40 overflow-y-auto space-y-0.5 px-1">
                      {downloadedModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(model.id);
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs rounded-xl flex items-center justify-between hover:bg-[#18181c] transition-all cursor-pointer ${
                            selectedModelId === model.id
                              ? "text-white font-bold bg-[#27272a] border border-[#3f3f46]"
                              : "text-[#a1a1aa]"
                          }`}
                        >
                          <span className="truncate font-mono">{model.name}</span>
                          {selectedModelId === model.id && <Check className="w-3.5 h-3.5 text-[#f4f4f5] shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-[#27272a] mt-1 pt-1.5 px-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModelMenu(false);
                          navigate("/hub");
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#f4f4f5] hover:bg-[#18181c] rounded-xl transition-colors flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#a1a1aa]" /> Browse Hugging Face Hub...
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowModelMenu(false);
                          navigate("/settings");
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#f4f4f5] hover:bg-[#18181c] rounded-xl transition-colors flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#a1a1aa]" /> Add Custom Model...
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono text-[#71717a] hidden sm:inline-flex items-center gap-1.5">
            Press <kbd className="bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a] font-mono text-[10px] text-[#f4f4f5]">Enter ↵</kbd> to send
          </span>
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2.5">
          <button
            type="button"
            className="p-2.5 rounded-xl text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181c] border border-transparent transition-all shrink-0 cursor-pointer"
            title="Attach Context Document / Code file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask m0x-flow (AirLLM layer-by-layer or Exo P2P)..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#f4f4f5] placeholder-[#71717a] resize-none outline-none py-1.5 max-h-40 font-sans leading-relaxed select-text"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#27272a] hover:bg-red-600 text-white transition-all shrink-0 cursor-pointer"
              aria-label="Stop generation"
              title="Stop Generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white disabled:opacity-30 transition-all shrink-0 cursor-pointer border border-[#3f3f46]"
              aria-label="Send message"
              title="Send Message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}




