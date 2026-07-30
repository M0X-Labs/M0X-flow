import { useState, useEffect } from "react";

export interface RealModel {
  id: string;
  name: string;
  repo: string;
  likes?: number;
  downloads?: number;
  tags?: string[];
  downloaded: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  downloadSpeed?: string;
}

const STORAGE_KEY = "m0x_downloaded_models";

export function getStoredModels(): RealModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse stored models", e);
  }
  return [];
}

export function saveStoredModels(models: RealModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch (e) {
    console.error("Failed to save models to storage", e);
  }
}

export function useModelStore() {
  const [downloadedModels, setDownloadedModels] = useState<RealModel[]>(getStoredModels());

  useEffect(() => {
    // Sync with sidecar if online
    const syncWithSidecar = async () => {
      try {
        const res = await fetch("http://localhost:14321/api/models/downloaded").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models)) {
            const sidecarModels: RealModel[] = data.models.map((m: any) => ({
              id: m.id,
              name: m.name,
              repo: m.id,
              downloaded: true,
            }));
            setDownloadedModels(sidecarModels);
            saveStoredModels(sidecarModels);
          }
        }
      } catch (e) {
        // Fallback to local storage
      }
    };
    syncWithSidecar();
  }, []);

  const addDownloadedModel = (model: RealModel) => {
    setDownloadedModels((prev) => {
      const exists = prev.some((m) => m.id === model.id);
      const updated = exists
        ? prev.map((m) => (m.id === model.id ? { ...m, downloaded: true } : m))
        : [...prev, { ...model, downloaded: true }];
      saveStoredModels(updated);
      return updated;
    });
  };

  const removeDownloadedModel = (modelId: string) => {
    setDownloadedModels((prev) => {
      const updated = prev.filter((m) => m.id !== modelId);
      saveStoredModels(updated);
      return updated;
    });
  };

  return {
    downloadedModels,
    addDownloadedModel,
    removeDownloadedModel,
  };
}
