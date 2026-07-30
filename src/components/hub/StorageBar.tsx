import { useState, useEffect } from "react";
import { HardDrive, Folder, Check, RefreshCw, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StorageBarProps {
  usedGb?: number;
  totalGb?: number;
  freeGb?: number;
  modelsDir?: string;
  modelCount?: number;
  onPathChange?: (newPath: string) => void;
  onRefresh?: () => void;
}

/**
 * StorageBar — Displays real system disk metrics and allows updating model download directory path.
 */
export function StorageBar({
  usedGb: initialUsedGb,
  totalGb: initialTotalGb,
  freeGb: initialFreeGb,
  modelsDir: initialModelsDir,
  modelCount: initialModelCount,
  onPathChange,
  onRefresh,
}: StorageBarProps) {
  const [storage, setStorage] = useState({
    usedGb: initialUsedGb || 0,
    totalGb: initialTotalGb || 0,
    freeGb: initialFreeGb || 0,
    driveLabel: "",
    modelsDir: initialModelsDir || "Loading...",
    modelCount: initialModelCount || 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputPath, setInputPath] = useState(storage.modelsDir);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStorageInfo = async () => {
    try {
      const res = await fetch("http://localhost:14321/api/storage/info").catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setStorage({
          usedGb: data.used_gb || 0,
          totalGb: data.total_gb || 0,
          freeGb: data.free_gb || 0,
          driveLabel: data.drive_label || "",
          modelsDir: data.models_dir || "~/.m0x-flow/models",
          modelCount: data.model_count || 0,
        });
        setInputPath(data.models_dir || "");
      }
    } catch (e) {
      console.error("Failed to fetch storage info", e);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, [initialUsedGb, initialModelsDir]);

  const handleSavePath = async (targetPath: string) => {
    const trimmed = targetPath.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:14321/api/storage/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models_dir: trimmed }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.storage) {
          setStorage({
            usedGb: data.storage.used_gb || 0,
            totalGb: data.storage.total_gb || 0,
            freeGb: data.storage.free_gb || 0,
            driveLabel: data.storage.drive_label || "",
            modelsDir: data.storage.models_dir,
            modelCount: data.storage.model_count || 0,
          });
          setInputPath(data.storage.models_dir);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
        onPathChange?.(trimmed);
        onRefresh?.();
      } else {
        const errJson = res ? await res.json().catch(() => null) : null;
        setErrorMsg(errJson?.detail || "Could not set model directory.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to connect to backend sidecar.");
    } finally {
      setIsSaving(false);
    }
  };

  const percentage = storage.totalGb > 0 ? Math.min((storage.usedGb / storage.totalGb) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 bg-[#121215] border border-[#27272a] rounded-xl">
      {/* Top Header: Real Storage Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#f4f4f5] font-bold tracking-tight">Host Model Storage</span>
                {storage.modelsDir === "Loading..." ? (
                  <div className="w-36 h-4 bg-[#18181c] rounded animate-pulse" />
                ) : (
                  <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a] truncate max-w-[280px]">
                    {storage.modelsDir}
                  </span>
                )}
              </div>
              {storage.totalGb === 0 ? (
                <div className="w-40 h-4 bg-[#18181c] rounded animate-pulse" />
              ) : (
                <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
                  {storage.usedGb.toFixed(1)} GB Used / {storage.freeGb.toFixed(1)} GB Free {storage.totalGb > 0 ? `(${storage.totalGb.toFixed(1)} GB Total Drive ${storage.driveLabel})` : ""}
                </span>
              )}
            </div>

            <div className="h-2 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a] p-0.5">
              {storage.totalGb === 0 ? (
                <div className="h-full w-full bg-[#27272a] animate-pulse rounded-full" />
              ) : (
                <div
                  className="h-full bg-[#f4f4f5] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(percentage, 1)}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Path Change & Installed Models Controls */}
        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-[#27272a] pt-2.5 md:pt-0 md:pl-4">
          <span className="text-xs font-mono font-semibold text-[#f4f4f5] bg-[#18181c] px-3 py-1.5 rounded-xl border border-[#27272a] shrink-0">
            {storage.modelCount} Installed
          </span>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isEditing
                ? "bg-[#27272a] text-white border-[#3f3f46]"
                : "bg-[#18181c] hover:bg-[#222226] text-[#a1a1aa] hover:text-[#f4f4f5] border-[#27272a]"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{isEditing ? "Close Path Editor" : "Change Path"}</span>
          </button>

          <button
            type="button"
            onClick={fetchStorageInfo}
            className="p-2 rounded-xl bg-[#18181c] hover:bg-[#222226] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-all cursor-pointer"
            title="Refresh Disk Storage Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Model Download Directory Editor Drawer */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#27272a] pt-3 mt-1 space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono font-semibold text-[#f4f4f5] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#a1a1aa]" /> Custom Model Download Directory Path:
              </label>
              <span className="text-[10px] text-[#71717a]">
                Model weights will be fetched into &amp; loaded from this directory.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  placeholder="e.g. D:\AI_Models or C:\Users\name\.m0x-flow\models"
                  className="w-full bg-[#18181c] border border-[#27272a] text-[#f4f4f5] px-3.5 py-1.5 rounded-xl text-xs font-mono focus:outline-none focus:border-[#3f3f46] transition-all"
                />
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSavePath(inputPath)}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold transition-all border border-[#3f3f46] cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved!
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5" /> Set Path
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-mono font-medium">{errorMsg}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
