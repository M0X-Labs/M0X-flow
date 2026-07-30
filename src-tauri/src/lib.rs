use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Holds the sidecar child process so we can kill it on app close.
struct SidecarState {
    child: Option<tauri_plugin_shell::process::CommandChild>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(SidecarState { child: None }))
        .setup(|app| {
            let shell = app.shell();
            let spawn_result = if cfg!(debug_assertions) {
                let curr_dir = std::env::current_dir().unwrap_or_default();
                let resource_path = app.path().resource_dir().unwrap_or_default();

                let candidates = vec![
                    curr_dir.join("backend-sidecar").join("main.py"),
                    curr_dir.parent().map(|p| p.join("backend-sidecar").join("main.py")).unwrap_or_default(),
                    std::path::PathBuf::from("backend-sidecar/main.py"),
                    std::path::PathBuf::from("../backend-sidecar/main.py"),
                    resource_path.join("backend-sidecar").join("main.py"),
                ];

                let mut script_path = None;
                for c in candidates {
                    if c.as_os_str().is_empty() {
                        continue;
                    }
                    if c.exists() {
                        let path_str = if let Ok(canon) = c.canonicalize() {
                            canon.to_string_lossy().to_string()
                        } else {
                            c.to_string_lossy().to_string()
                        };
                        let clean_path = path_str.trim_start_matches(r"\\?\").to_string();
                        script_path = Some(clean_path);
                        break;
                    }
                }

                if let Some(path) = script_path {
                    println!("[m0x-flow] Dev mode: Launching python sidecar script {}", path);
                    shell.command("python").args([&path, "--port", "14321"]).spawn()
                } else {
                    println!("[m0x-flow] Dev mode: Fallback to bundled sidecar binary...");
                    shell.sidecar("backend-sidecar")
                        .and_then(|cmd| cmd.args(["--port", "14321"]).spawn())
                }
            } else {
                println!("[m0x-flow] Release mode: Spawning bundled sidecar executable from software folder...");
                shell
                    .sidecar("backend-sidecar")
                    .expect("Failed to construct backend-sidecar command")
                    .args(["--port", "14321"])
                    .spawn()
            };

            match spawn_result {
                Ok((mut rx, child)) => {
                    println!("[m0x-flow] Sidecar spawned with PID");

                    // Store the child handle for cleanup
                    let state = app.state::<Mutex<SidecarState>>();
                    if let Ok(mut guard) = state.lock() {
                        guard.child = Some(child);
                    }

                    // Log sidecar stdout/stderr in a background task
                    tauri::async_runtime::spawn(async move {
                        use tauri_plugin_shell::process::CommandEvent;
                        while let Some(event) = rx.recv().await {
                            match event {
                                CommandEvent::Stdout(line) => {
                                    let text = String::from_utf8_lossy(&line);
                                    println!("[m0x-sidecar:stdout] {}", text);
                                }
                                CommandEvent::Stderr(line) => {
                                    let text = String::from_utf8_lossy(&line);
                                    eprintln!("[m0x-sidecar:stderr] {}", text);
                                }
                                CommandEvent::Terminated(payload) => {
                                    println!(
                                        "[m0x-sidecar] Process terminated with code: {:?}",
                                        payload.code
                                    );
                                    break;
                                }
                                CommandEvent::Error(err) => {
                                    eprintln!("[m0x-sidecar:error] {}", err);
                                }
                                _ => {}
                            }
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[m0x-flow] Failed to spawn sidecar: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill the sidecar when the main window is destroyed
            if let tauri::WindowEvent::Destroyed = event {
                println!("[m0x-flow] Window destroyed, killing sidecar...");
                let state = window.state::<Mutex<SidecarState>>();
                if let Ok(mut guard) = state.lock() {
                    if let Some(child) = guard.child.take() {
                        match child.kill() {
                            Ok(_) => println!("[m0x-flow] Sidecar killed successfully"),
                            Err(e) => eprintln!("[m0x-flow] Failed to kill sidecar: {}", e),
                        }
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
