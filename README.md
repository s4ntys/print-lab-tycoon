# PRINT LAB — 3D Tycoon

Bezplatný slovenský tycoon inšpirovaný budovaním dielne s 3D tlačiarňami. Vlastná grafika vytvorená v CSS, bez herných assetov z Robloxu.

## Hra

Spusti tlač, predaj výrobky a nakupuj ďalšie tlačiarne. Odomkni modely, plň objednávky a kúp automatizáciu. Šesť tlačiarní, desať úrovní každej, štyri modely, päť vylepšení motorov a opakujúce sa objednávky. Automatizácia dopočíta maximálne dve hodiny výroby pri návrate.

Postup sa ukladá každých päť sekúnd a po akciách do cookies na 365 dní. Každý prehliadač má vlastný postup. Nastavenia obsahujú export/import zálohy a reset. Bez analytiky a účtov. Cookies možno blokovať; hra vtedy upozorní a ponúkne manuálnu zálohu. Lokálny postup možno upraviť — hra neobsahuje súťažný rebríček.

## Spustenie

Statické súbory `index.html`, `style.css`, `game.js`. Spusti ľubovoľný lokálny HTTP server, napríklad `python -m http.server 4173`. Otvor http://localhost:4173. Externé Google Fonts sú voliteľné, záložné systémové fonty fungujú offline.

## GitHub Pages

V nastaveniach repozitára vyber Pages → Deploy from a branch → main → / (root). Nie je potrebný build ani server. Celý web je verejný; neukladaj do repozitára súkromné údaje.

## Hravá dielňa (v2)

Živá animovaná dielňa s robotom, klikateľnými tlačiarňami a dopravníkom. Turbo ťuk skracuje rozbehnuté tlače o 0,8 sekundy, má ochranu proti priveľmi rýchlym klikom a pri prehriatí sa na 6,5 sekundy zablokuje. Bežná tlač pokračuje. Päť míľnikov prináša jednorazové odmeny, denný darček sa dá vyzdvihnúť raz za miestny kalendárny deň. Náhodné udalosti prinášajú balíček alebo 50 % bonus za predaj. Voliteľné zvuky sa zapínajú tlačidlom v dielni. Rešpektuje znížený pohyb v nastaveniach zariadenia.

Pôvodné cookies a zálohy zostávajú kompatibilné. Odmeny sa ukladajú spolu s postupom. Rovnako ako celú lokálnu hru je možné čas a uloženie upraviť; nejde o zabezpečenú online ekonomiku.

Overenie hernej logiky: `node tests/game.test.cjs`.

## Živá ekonomika (v3)

Zákazníci prichádzajú s časovanými ponukami na už odomknuté modely. Prijatie spustí trojminútovú lehotu; odovzdanie spotrebuje presný počet kusov zo skladu, vyplatí odmenu a pridá reputáciu. Výrobky zostanú pri nesplnení hráčovi. Prihlásenie po lehote zákazku neobnovuje. Tlačidlo prípravy nastaví požadovaný model a spustí voľné tlačiarne. Spustenie všetkých voľných tlačiarní je dostupné samostatne.

Materiály PLA (vyvážený), Draft (65 % času, 75 % ceny) a Silk (140 % času, 180 % ceny; odomkne sa v štúdiu) vytvárajú voľbu medzi rýchlosťou a cenou. Cena sa zaokrúhľuje na celé eurá za kus a uchováva pri zmiešanom sklade; zmena materiálu nemení cenu už vyrobených kusov.

Za 600 € a dve reputácie sa garáž zmení na štúdio. Za 2200 € a šesť reputácií sa štúdio zmení na neónovú manufaktúru s 20 % vyššou rýchlosťou. Mení sa aj vzhľad scény. Staré uloženia sa doplnia bez straty pôvodného skladu alebo peňazí.

## Online World (v4)

Online mode: https://print-lab-world.primemink129.chatgpt.site

GitHub Pages now provides a multilingual entry point. The original cookie save remains playable at `classic.html` on the same origin. Ranked mode starts fresh for everyone and stores authoritative state in a Sites Worker / D1 backend. It uses Secure HttpOnly session cookies, unique locked names and a one-time recovery code. It never imports local scores. See `online/README.md` for implementation, security boundaries, translations and tests. The online source is mirrored under `online/`; deployment is managed through Sites.
