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
                match shell.sidecar("backend-sidecar") {
                    Ok(sidecar_cmd) => match sidecar_cmd.args(["--port", "14321"]).spawn() {
                        Ok(res) => Ok(res),
                        Err(_) => {
                            let curr_dir = std::env::current_dir().unwrap_or_default();
                            let p1 = curr_dir.join("backend-sidecar").join("main.py");
                            let p2 = curr_dir.join("src-tauri").join("..").join("backend-sidecar").join("main.py");
                            let resource_path = app.path().resource_dir().unwrap_or_default();

                            let script_path = if p1.exists() {
                                p1.to_string_lossy().to_string()
                            } else if p2.exists() {
                                p2.to_string_lossy().to_string()
                            } else {
                                resource_path.join("backend-sidecar").join("main.py").to_string_lossy().to_string()
                            };

                            println!("[m0x-flow] Dev mode: Launching python sidecar script {}", script_path);
                            shell.command("python").args([&script_path, "--port", "14321"]).spawn()
                        }
                    },
                    Err(_) => {
                        let curr_dir = std::env::current_dir().unwrap_or_default();
                        let p1 = curr_dir.join("backend-sidecar").join("main.py");
                        let p2 = curr_dir.join("src-tauri").join("..").join("backend-sidecar").join("main.py");
                        let resource_path = app.path().resource_dir().unwrap_or_default();

                        let script_path = if p1.exists() {
                            p1.to_string_lossy().to_string()
                        } else if p2.exists() {
                            p2.to_string_lossy().to_string()
                        } else {
                            resource_path.join("backend-sidecar").join("main.py").to_string_lossy().to_string()
                        };

                        println!("[m0x-flow] Dev mode: Launching python sidecar script {}", script_path);
                        shell.command("python").args([&script_path, "--port", "14321"]).spawn()
                    }
                }
            } else {
                println!("[m0x-flow] Release mode: Spawning bundled sidecar executable...");
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
