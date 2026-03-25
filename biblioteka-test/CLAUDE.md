# Biblioteka BG UP — notatka dla Claude (podstrona heuristica)

## Architektura wdrożenia

```
Użytkownik
  → https://heuristica.pl/biblioteka-test/   (GitHub Pages, statyczny HTML)
  → backend API (patrz: aktualny backend poniżej)
  → katalog KOHA (katalog.bg.up.lublin.pl)
```

## Problem z KOHA i IP

**KRYTYCZNA PUŁAPKA:** Katalog KOHA BG UP blokuje zagraniczne IP (403 Forbidden).
- Serwer Hetzner Helsinki (46.62.210.195) → **zablokowany** (403)
- Polski laptop/sieć → **działa** (200)
- Niemcy, Finlandia, inne EU → prawdopodobnie też blokowane

**Weryfikacja:**
```powershell
curl -k -s -o /dev/null -w "%{http_code}" https://katalog.bg.up.lublin.pl/cgi-bin/koha/opac-user.pl
# Musi zwrócić 200, nie 403
```

## Serwer Hetzner (założony, ale nieużywany z powodu blokady KOHA)

- **IP:** 46.62.210.195
- **Lokalizacja:** Helsinki, Finlandia
- **Typ:** CX33 (4 vCPU, 8GB RAM), Ubuntu 24.04
- **DNS:** bgup.heuristica.pl → 46.62.210.195 (rekord A w nazwa.pl)
- **SSL:** Let's Encrypt (certbot), ważny do 2026-06-23
- **Serwis:** `/etc/systemd/system/biblioteka.service` (uvicorn na porcie 8001)
- **Nginx:** reverse proxy + CORS dla heuristica.pl
- **Status:** zainstalowany i skonfigurowany, ale KOHA niedostępne z tego IP

SSH: `ssh root@46.62.210.195` (klucz heuristica)

## Aktualny stan frontendu

Plik: `biblioteka-test/index.html`
- Zmienna `API_BASE` na górze skryptu wskazuje na backend
- Aktualnie ustawione na: `https://bgup.heuristica.pl`
- Jeśli backend się zmieni (np. Cloudflare Tunnel) — zmień tylko tę jedną linię

## Opcje rozwiązania problemu z KOHA

### Opcja A — Whitelist IP (najczyściej)
Napisz do IT BG UP o odblokowanie IP `46.62.210.195` dla `katalog.bg.up.lublin.pl`.

### Opcja B — Cloudflare Tunnel z laptopa (szybko)
1. Pobierz: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
2. Uruchom aplikację lokalnie: `python biblioteka_app.py`
3. W drugim oknie: `cloudflared.exe tunnel --url http://localhost:8001`
4. Zmień `API_BASE` w `biblioteka-test/index.html` na podany URL
5. Wada: URL zmienia się przy każdym restarcie (chyba że Named Tunnel z kontem Cloudflare)

### Opcja C — VPS w Polsce
OVH/home.pl/cyberFolks — polska lokalizacja, polskie IP, KOHA powinno przepuszczać.

## Instalacja serwera (na przyszłość / nowy VPS)

```bash
# 1. Pakiety systemowe
apt update && apt upgrade -y && apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx

# 2. Środowisko Python
python3 -m venv /opt/biblioteka
/opt/biblioteka/bin/pip install fastapi uvicorn openai pymupdf python-multipart playwright

# 3. Playwright Chromium
/opt/biblioteka/bin/playwright install chromium
/opt/biblioteka/bin/playwright install-deps chromium  # WAŻNE: bez tego Chromium nie odpali

# 4. Wgraj pliki
mkdir -p /opt/biblioteka/app
# scp biblioteka_app.py root@IP:/opt/biblioteka/app/
# scp biblioteka_index.html root@IP:/opt/biblioteka/app/

# 5. Systemd
cat > /etc/systemd/system/biblioteka.service << 'EOF'
[Unit]
Description=Biblioteka BG UP Lublin
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/opt/biblioteka/app
Environment=HOME=/root
ExecStart=/opt/biblioteka/bin/uvicorn biblioteka_app:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable biblioteka && systemctl start biblioteka

# 6. Nginx + SSL
cat > /etc/nginx/sites-available/biblioteka << 'EOF'
server {
    listen 80;
    server_name bgup.heuristica.pl;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name bgup.heuristica.pl;
    ssl_certificate /etc/letsencrypt/live/bgup.heuristica.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bgup.heuristica.pl/privkey.pem;
    location / {
        add_header Access-Control-Allow-Origin "https://heuristica.pl" always;
        add_header Access-Control-Allow-Origin "https://www.heuristica.pl" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        if ($request_method = OPTIONS) { return 204; }
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 25M;
    }
}
EOF
ln -s /etc/nginx/sites-available/biblioteka /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d bgup.heuristica.pl --non-interactive --agree-tos -m admin@heuristica.pl
```

## Pliki lokalne

- Backend: `C:\Users\stani\OneDrive\Dokumenty\GitHub\UP_Biblioteka\biblioteka_app.py`
- Frontend (oryginał): `C:\Users\stani\OneDrive\Dokumenty\GitHub\UP_Biblioteka\biblioteka_index.html`
- Frontend (GitHub Pages): `C:\Users\stani\OneDrive\Dokumenty\GitHub\heuristica\biblioteka-test\index.html`
