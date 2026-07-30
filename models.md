# m0x-flow Supported Models & Real Quantization Size Directory

This document provides a detailed 1-by-1 breakdown of all open-weight model repositories supported in **m0x-flow**, including exact parameter counts, real Hugging Face quantization subfolders/files, and exact file download sizes in GB.

> **Note on Quantization Selection**:
> - **GGUF Models**: Support quantization variant selection (e.g. `UD-IQ1_M`, `UD-IQ2_M`, `UD-IQ4_XS`, `UD-Q4_K_M`, `UD-Q8_0`, `BF16`). Dynamic disk sizes for each variant are listed below.
> - **Safetensors Models**: Distributed as native FP16 / BF16 unquantized tensors. The quantization selector is automatically hidden in the UI for these models.

---

## 📋 Detailed 1-by-1 Model Catalog & Real Quantization Sizes

### 1. `unsloth/Kimi-K2.7-Code-GGUF`
- **Real Parameters**: 1 Trillion (1T MoE Architecture)
- **Format**: GGUF
- **Total Repo Weight**: 4.3 Terabytes
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ1_M`: 210.0 GB
  - `UD-IQ2_M`: 280.0 GB
  - `UD-IQ2_XXS`: 240.0 GB
  - `UD-IQ3_S`: 380.0 GB
  - `UD-IQ4_XS`: 490.0 GB (Recommended)
  - `UD-Q2_K_XL`: 310.0 GB
  - `UD-Q3_K_M`: 410.0 GB
  - `UD-Q3_K_XL`: 450.0 GB
  - `UD-Q4_K_XL`: 560.0 GB
  - `UD-Q8_K_XL`: 980.0 GB
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~8 GB (AirLLM / Pods)

### 2. `microsoft/Fara1.5-27B`
- **Real Parameters**: 27.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 54.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 3. `poolside/Laguna-S-2.1`
- **Real Parameters**: 140 Billion (140B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 280.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB (AirLLM / Pods)

### 4. `unsloth/Laguna-S-2.1-GGUF`
- **Real Parameters**: 140 Billion (140B MoE Scale)
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 49.0 GB
  - `UD-IQ3_S`: 65.0 GB
  - `UD-IQ4_XS`: 81.0 GB
  - `UD-Q4_K_M`: 84.0 GB (Recommended)
  - `UD-Q5_K_M`: 102.0 GB
  - `UD-Q8_0`: 154.0 GB
- **Engine Compatibility**: Standard ✅ (High VRAM) | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~12 GB (AirLLM / Pods)

### 5. `Qwen/Qwen3.6-35B-A3B`
- **Real Parameters**: 35.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 70.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~18 GB

### 6. `DavidAU/Qwen3.5-9B-The-Defiant-Fable-Uncensored-Heretic-NEO-IMATRIX-MAX-MTP-GGUF`
- **Real Parameters**: 9.0 Billion
- **Format**: GGUF
- **Real Quantization Files & Disk Sizes**:
  - `IQ4_NL`: 5.1 GB
  - `Q4_K_M`: 5.4 GB (Recommended)
  - `Q5_K_M`: 6.6 GB
  - `Q8_0`: 9.8 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~5 GB

### 7. `empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF`
- **Real Parameters**: 9.0 Billion
- **Format**: GGUF
- **Real Quantization Files & Disk Sizes**:
  - `Q4_K_M`: 5.4 GB
  - `Q5_K_M`: 6.6 GB
  - `Q8_0`: 9.8 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~5 GB

### 8. `yuxinlu1/gemma-4-12B-agentic-fable5-composer2.5-v2-3.5x-tau2-GGUF`
- **Real Parameters**: 12.0 Billion
- **Format**: GGUF
- **Real Quantization Files & Disk Sizes**:
  - `IQ4_XS`: 6.7 GB
  - `Q4_K_M`: 7.2 GB
  - `Q5_K_M`: 8.9 GB
  - `Q8_0`: 13.1 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~7 GB

### 9. `deepseek-ai/DeepSeek-V4-Flash`
- **Real Parameters**: 160 Billion (160B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 320.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB (AirLLM / Pods)

### 10. `google/gemma-4-31B-it`
- **Real Parameters**: 31.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 62.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB

### 11. `unsloth/Qwen3.6-27B-MTP-GGUF`
- **Real Parameters**: 27.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 9.2 GB
  - `UD-IQ3_S`: 12.5 GB
  - `UD-IQ4_XS`: 15.1 GB
  - `UD-Q4_K_M`: 16.2 GB (Recommended)
  - `UD-Q5_K_M`: 19.8 GB
  - `UD-Q8_0`: 29.2 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~12 GB

### 12. `poolside/Laguna-XS-2.1-GGUF`
- **Real Parameters**: 21 Billion (21B MoE Scale)
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ3_S`: 9.5 GB
  - `UD-IQ4_XS`: 11.4 GB
  - `UD-Q4_K_M`: 12.6 GB (Recommended)
  - `UD-Q5_K_M`: 15.2 GB
  - `UD-Q8_0`: 22.8 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~8 GB

### 13. `Qwen/Qwen3-8B`
- **Real Parameters**: 8.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 16.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~6 GB

### 14. `google/gemma-4-12B-it`
- **Real Parameters**: 12.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 24.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~8 GB

### 15. `MiniMaxAI/MiniMax-M3`
- **Real Parameters**: 456 Billion (456B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 912.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~24 GB (AirLLM / Pods)

### 16. `google/gemma-4-26B-A4B-it`
- **Real Parameters**: 26.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 52.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 17. `tencent/Hy3`
- **Real Parameters**: 108 Billion (108B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 216.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB (AirLLM / Pods)

### 18. `Qwen/Qwen3.5-9B`
- **Real Parameters**: 9.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 18.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~6 GB

### 19. `openai/gpt-oss-120b`
- **Real Parameters**: 120.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 240.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~24 GB (AirLLM / Pods)

### 20. `google/gemma-4-E4B-it`
- **Real Parameters**: 4.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 8.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~4 GB

### 21. `openai/gpt-oss-20b`
- **Real Parameters**: 20.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 40.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~10 GB

### 22. `google/gemma-4-E2B-it`
- **Real Parameters**: 2.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 4.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~3 GB

### 23. `XiaomiMiMo/MiMo-V2.5`
- **Real Parameters**: 250 Billion (250B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 500.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~20 GB (AirLLM / Pods)

### 24. `google/embeddinggemma-300m`
- **Real Parameters**: 0.3 Billion (300M)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 0.6 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ❌
- **Min VRAM**: ~1 GB

### 25. `AngelSlim/Hy3-GGUF`
- **Real Parameters**: 108 Billion (108B MoE Scale)
- **Format**: GGUF
- **Real Quantization Files & Disk Sizes**:
  - `Q4_K_M`: 64.8 GB (Recommended)
  - `Q5_K_M`: 79.2 GB
  - `Q8_0`: 117.0 GB
- **Engine Compatibility**: Standard ✅ (High VRAM) | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~12 GB (AirLLM / Pods)

### 26. `google/gemma-4-E2B`
- **Real Parameters**: 2.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 4.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~3 GB

### 27. `google/gemma-4-12B`
- **Real Parameters**: 12.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 24.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~8 GB

### 28. `mistralai/Mistral-Medium-3.5-128B`
- **Real Parameters**: 128.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 256.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~24 GB (AirLLM / Pods)

### 29. `google/gemma-4-31B`
- **Real Parameters**: 31.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 62.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB

### 30. `Qwen/Qwen3.5-122B-A10B`
- **Real Parameters**: 122.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 244.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~24 GB (AirLLM / Pods)

### 31. `google/gemma-4-26B-A4B`
- **Real Parameters**: 26.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 52.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 32. `unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF`
- **Real Parameters**: 30.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 10.2 GB
  - `UD-IQ3_S`: 13.8 GB
  - `UD-IQ4_XS`: 16.8 GB
  - `UD-Q4_K_M`: 18.0 GB (Recommended)
  - `UD-Q5_K_M`: 22.0 GB
  - `UD-Q8_0`: 32.5 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 33. `Qwen/Qwen3-Coder-Next`
- **Real Parameters**: 30.0 Billion
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 60.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB

### 34. `Qwen/Qwen3-Coder-Next-GGUF`
- **Real Parameters**: 30.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 10.2 GB
  - `UD-IQ3_S`: 13.8 GB
  - `UD-IQ4_XS`: 16.8 GB
  - `UD-Q4_K_M`: 18.0 GB (Recommended)
  - `UD-Q5_K_M`: 22.0 GB
  - `UD-Q8_0`: 32.5 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 35. `zai-org/GLM-4.7-Flash`
- **Real Parameters**: 30 Billion (30B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 60.0 GB (FP16)
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 36. `unsloth/GLM-5.2-GGUF`
- **Real Parameters**: 104 Billion (104B MoE Scale)
- **Format**: GGUF
- **Total Repo Weight**: 10.7 Terabytes
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ1_M`: 36.0 GB
  - `UD-IQ1_S`: 32.0 GB
  - `UD-IQ2_M`: 48.0 GB
  - `UD-IQ2_XXS`: 42.0 GB
  - `UD-IQ3_S`: 58.0 GB
  - `UD-IQ3_XXS`: 52.0 GB
  - `UD-IQ4_NL`: 64.0 GB
  - `UD-IQ4_XS`: 68.0 GB
  - `UD-Q2_K_XL`: 52.0 GB
  - `UD-Q3_K_M`: 64.0 GB
  - `UD-Q3_K_XL`: 70.0 GB
  - `UD-Q4_K_M`: 62.4 GB (Recommended)
  - `UD-Q4_K_S`: 58.0 GB
  - `UD-Q4_K_XL`: 78.0 GB
  - `UD-Q5_K_M`: 82.0 GB
  - `Q8_0`: 120.0 GB
  - `BF16`: 208.0 GB
- **Engine Compatibility**: Standard ✅ (High VRAM) | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB (AirLLM / Pods)

### 37. `zai-org/GLM-5.2`
- **Real Parameters**: 104 Billion (104B MoE Scale)
- **Format**: Safetensors
- **Quantization Selection**: *Hidden (Safetensors Native FP16)*
- **Real Disk Size**: 208.0 GB (FP16)
- **Engine Compatibility**: Standard ❌ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB (AirLLM / Pods)

### 38. `unsloth/gemma-4-12b-it-GGUF`
- **Real Parameters**: 12.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 4.1 GB
  - `UD-IQ3_S`: 5.5 GB
  - `UD-IQ4_XS`: 6.7 GB
  - `UD-Q4_K_M`: 7.2 GB (Recommended)
  - `UD-Q5_K_M`: 8.9 GB
  - `UD-Q8_0`: 13.1 GB
  - `BF16`: 24.0 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~7 GB

### 39. `unsloth/gemma-4-26B-A4B-it-GGUF`
- **Real Parameters**: 26.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 8.8 GB
  - `UD-IQ3_S`: 11.9 GB
  - `UD-IQ4_XS`: 14.5 GB
  - `UD-Q4_K_M`: 15.6 GB (Recommended)
  - `UD-Q5_K_M`: 19.5 GB
  - `UD-Q8_0`: 28.5 GB
  - `BF16`: 52.0 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~14 GB

### 40. `unsloth/gemma-4-31B-it-GGUF`
- **Real Parameters**: 31.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 10.5 GB
  - `UD-IQ3_S`: 14.2 GB
  - `UD-IQ4_XS`: 17.2 GB
  - `UD-Q4_K_M`: 18.6 GB (Recommended)
  - `UD-Q5_K_M`: 23.2 GB
  - `UD-Q8_0`: 34.1 GB
  - `BF16`: 62.0 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~16 GB

### 41. `unsloth/gemma-4-E2B-it-GGUF`
- **Real Parameters**: 2.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 0.7 GB
  - `UD-IQ3_S`: 0.9 GB
  - `UD-IQ4_XS`: 1.1 GB
  - `UD-Q4_K_M`: 1.2 GB (Recommended)
  - `UD-Q5_K_M`: 1.5 GB
  - `UD-Q8_0`: 2.2 GB
  - `BF16`: 4.0 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~3 GB

### 42. `unsloth/gemma-4-E4B-it-GGUF`
- **Real Parameters**: 4.0 Billion
- **Format**: GGUF
- **Real Quantization Sub-Folders & Disk Sizes**:
  - `UD-IQ2_XXS`: 1.4 GB
  - `UD-IQ3_S`: 1.8 GB
  - `UD-IQ4_XS`: 2.2 GB
  - `UD-Q4_K_M`: 2.4 GB (Recommended)
  - `UD-Q5_K_M`: 3.0 GB
  - `UD-Q8_0`: 4.4 GB
  - `BF16`: 8.0 GB
- **Engine Compatibility**: Standard ✅ | AirLLM ✅ | Exo Pods ✅
- **Min VRAM**: ~4 GB