# -*- mode: python ; coding: utf-8 -*-
import sys
import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

block_cipher = None

# Collect all hidden imports for FastAPI, Uvicorn, Pydantic, and Engine modules
hidden_imports = [
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "fastapi",
    "fastapi.middleware.cors",
    "pydantic",
    "huggingface_hub",
    "models_db",
    "engines",
    "engines.llama_engine",
    "engines.airllm_engine",
    "engines.exo_engine",
]

datas = []
binaries = []

# Collect uvicorn data and binaries
tmp_uvicorn = collect_all('uvicorn')
datas += tmp_uvicorn[0]
binaries += tmp_uvicorn[1]
hidden_imports += tmp_uvicorn[2]

# Collect fastapi data
tmp_fastapi = collect_all('fastapi')
datas += tmp_fastapi[0]
binaries += tmp_fastapi[1]
hidden_imports += tmp_fastapi[2]

# Exclude heavy unused dependencies (torch, scipy, etc. - only used for optional PyTorch fallback)
excludes = [
    "torch",
    "torch.*",
    "torchaudio",
    "torchvision",
    "tensorboard",
    "scipy",
    "scipy.*",
    "matplotlib",
    "matplotlib.*",
    "pandas",
    "pandas.*",
    "PIL",
    "PIL.*",
    "tkinter",
    "tkinter.*",
    "jupyter",
    "jupyter.*",
    "IPython",
    "IPython.*",
    "notebook",
    "notebook.*",
    "pytest",
    "pytest.*",
]

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend-sidecar',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../src-tauri/icons/icon.ico',
)
