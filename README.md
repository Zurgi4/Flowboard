# Training Hungary kampánytervező

Vizuális kampánytervező B2B marketingfolyamatokhoz. Piszkozatokat és élesnek jelölt kampányokat lehet létrehozni, a vásznon a lépések mozgathatók és összeköthetők. A lépésekhez felelős, állapot, célérték, tényleges érték és hivatkozás rendelhető.

## Jelenlegi funkciók

- B2B leadgenerálás, webinárium, LinkedIn kapcsolatépítés és üres sablon
- Szerkeszthető kampányvászon és lépéskapcsolatok
- Piszkozat, éles, szünetelő és archivált kampányállapot
- Kampányok mentése Cloudflare D1 adatbázisba, bejelentkezett felhasználónként külön
- A KPI-értékek jelenleg kézi adatok. A Meta és PartnerCRM automatikus szinkronja még nincs bekötve.

Az **éles** állapot nyilvántartási jelölés; nem indít és nem módosít hirdetést. A forráskód nem tartalmaz valódi ügyfélkampányokat vagy hozzáférési kulcsokat.

## Kipróbálható bemutató

A `docs/` mappa a GitHub Pages-en futó, kattintható Flowboard. Két egyértelműen jelölt mintakampánnyal indul. Új kampányt is létre lehet hozni, lépéseket és kapcsolatokat szerkeszteni, majd menteni.

Ebben a változatban a mentés **csak az adott böngészőben** történik, ezért Zalán saját módosításai nem jelennek meg Rajmundnál, és fordítva. Valódi CRM-adat, Meta-művelet és közös adatbázis nincs a nyilvános demóban.

A statikus bemutató újraépítése:

```bash
npm ci
npx vite build --config demo/vite.config.ts
```

## Forrás letöltése

A GitHub oldalán a **Code → Download ZIP** menüponttal tölthető le a teljes forrás. Az eredeti, adatbázisos alkalmazás szervert igényel; a GitHub Pages a külön `docs/` bemutatót szolgálja ki.

## Helyi fejlesztés

Node.js 22.13+ szükséges.

```bash
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sparkling_menace.sql
npm run dev
```

A helyi bejelentkezés és az éles Sites-környezet eltérő. A telepítési beállításokat a `.openai/hosting.json` tartalmazza; a benne lévő projektazonosító a már létező privát oldalhoz tartozik. Másik oldal létrehozásakor új azonosító szükséges.

## Technológia

React, TypeScript, Vinext, Cloudflare Workers és D1. A projekt a ChatGPT Sites tárhelyen futó változat forrásából készült.
