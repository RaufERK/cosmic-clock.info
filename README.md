# Cosmic Clock

Next.js scaffold for [cosmic-clock.info](https://cosmic-clock.info).  
Figma prototype remains in `../CCLOCK` (design reference only).

## Stack (scaffold)

- Next.js App Router + TypeScript + Tailwind
- `next-intl` — `en` / `ru` / `es` / `pt`
- Auth stub — `localStorage` demo session (no DB yet)
- PM2 + nginx on amster (`127.0.0.1:3060`)

## Local

```bash
npm i
npm run dev
```

Open http://localhost:3060/en

## Deploy (when ready)

1. Point DNS `cosmic-clock.info` + `www` → `185.200.178.73`
2. Create GitHub repo, set `repo` in `ecosystem.config.cjs`
3. On server (as `appuser`): dirs `~/apps/cosmic-clock/{source,shared}`, `~/logs`
4. `pm2 deploy production setup` then `pm2 deploy production`
5. As root: copy nginx conf, `ln -s`, `certbot --nginx -d cosmic-clock.info -d www.cosmic-clock.info`
