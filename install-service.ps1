$exe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
& $exe service uninstall
& $exe service install
Start-Service Cloudflared
