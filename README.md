# Flowboard · Training Hungary

Kipróbálható, vizuális kampánytervező. A [nyilvános bemutató](https://zurgi4.github.io/Flowboard/) GitHub Pages-en fut; nincs szükség belépésre.

## Mit lehet kipróbálni?

- Kampány létrehozása B2B, webinárium, LinkedIn vagy üres sablonból
- Lépések hozzáadása, mozgatása és összekötése a folyamatábrán
- Felelősök, állapotok, célértékek, tényleges értékek és URL-ek szerkesztése
- Piszkozatok, élesnek jelölt és szünetelő kampányok áttekintése
- Mentés, másolás és törlés

A bemutató két **minta**kampánnyal indul. A módosítások csak az adott böngésző helyi tárhelyén maradnak meg, így minden látogató önállóan próbálhatja ki. Nincs közös adatbázis, CRM- vagy Meta-integráció; az „éles” állapot itt nem indít hirdetést. A bemutató nem tartalmaz valódi ügyféladatot.

## Fejlesztés

A szerkeszthető React-forrás a `demo/` mappában, a kampánymodell a `lib/` mappában van. A `docs/` a GitHub Pages-re előre lefordított változat.

```bash
npm install
npx vite build --config demo/vite.config.ts
```

A GitHub oldalán a **Code → Download ZIP** menüponttal letölthető a teljes bemutatóprojekt. A későbbi, közös adatbázisos és integrált verzió külön fejlesztési lépés.
