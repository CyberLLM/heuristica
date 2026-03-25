# Heuristica — notatka dla Claude

Strona heuristica.pl hostowana na GitHub Pages (repo: cyberllm/cyberllm.github.io lub podobne).
DNS zarządzany przez nazwa.pl.

## Podstrona biblioteka-test

Lokalizacja: `/biblioteka-test/index.html`
URL: `https://heuristica.pl/biblioteka-test/`

Frontend bota bibliotecznego BG UP Lublin — statyczny HTML na GitHub Pages,
wywołujący backend na serwerze Hetzner przez HTTPS.

## Serwer Hetzner (backend)

- **IP:** 46.62.210.195
- **Lokalizacja:** Helsinki (Finlandia), CX33, Ubuntu 24.04
- **Subdomena:** bgup.heuristica.pl → 46.62.210.195 (rekord A w nazwa.pl)
- **SSL:** Let's Encrypt (certbot), auto-renewal aktywny
- **Backend URL:** https://bgup.heuristica.pl

### Co jest zainstalowane
- Python venv: `/opt/biblioteka/`
- Pliki aplikacji: `/opt/biblioteka/app/`
- Playwright Chromium: `/root/.cache/ms-playwright/`
- nginx z reverse proxy + CORS
- systemd service: `biblioteka.service`

### Przydatne komendy SSH
```bash
ssh root@46.62.210.195

# Status aplikacji
systemctl status biblioteka

# Restart aplikacji
systemctl restart biblioteka

# Logi
journalctl -u biblioteka -f

# Restart nginx
systemctl reload nginx

# Wgranie nowej wersji backendu (z lokalnego PS):
scp biblioteka_app.py root@46.62.210.195:/opt/biblioteka/app/
```

## Problem z KOHA — STATUS: OCZEKUJE NA IT BIBLIOTEKI

**Problem:** Katalog KOHA (`katalog.bg.up.lublin.pl`) zwraca **403 Forbidden**
dla serwera Hetzner (IP: 46.62.210.195, Finlandia).

**Przyczyna:** Geoblokada — KOHA przepuszcza polskie IP, blokuje zagraniczne.

**Rozwiązanie:** Wysłano prośbę do IT biblioteki BG UP o odblokowanie IP `46.62.210.195`.

**Alternatywa (jeśli IT nie odpowie):** Cloudflare Tunnel na laptopie:
```powershell
# Uruchom backend lokalnie
cd "C:\Users\stani\OneDrive\Dokumenty\GitHub\UP_Biblioteka"
python biblioteka_app.py

# W drugim oknie PS - pobierz cloudflared.exe i uruchom:
cloudflared.exe tunnel --url http://localhost:8001
# Poda publiczny URL np. https://abc-xyz.trycloudflare.com
# Ten URL wpisz w biblioteka-test/index.html zamiast bgup.heuristica.pl
```

## DNS heuristica.pl (nazwa.pl)

| Nazwa | Typ | Wartość |
|-------|-----|---------|
| heuristica.pl | A | 185.199.108-111.153 (GitHub Pages) |
| www.heuristica.pl | CNAME | cyberllm.github.io |
| bgup.heuristica.pl | A | 46.62.210.195 (Hetzner) |
| heuristica.pl | MX | Google (poczta) |

**Uwaga:** nazwa.pl nie pozwala na subdomenę o nazwie `api` ani `backend` — użyto `bgup`.

## Workflow aktualizacji

1. Edytuj pliki lokalnie w `C:\Users\stani\OneDrive\Dokumenty\GitHub\`
2. Backend (`biblioteka_app.py`) → wgraj przez `scp` na Hetzner
3. Frontend (`biblioteka-test/index.html`) → commit + push przez GitHub Desktop
