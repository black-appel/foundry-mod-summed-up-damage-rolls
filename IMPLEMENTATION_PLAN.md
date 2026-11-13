# Implementationsplan: Summed-Up Damage Rolls

## Technische Ausgangslage

Die lokale Foundry-Installation ist V14.370. Der Kern verwendet für manuell aufzulösende Würfe die ApplicationV2-Klasse `foundry.applications.dice.RollResolver`. Sie gruppiert jeden erfüllbaren `DiceTerm` und übergibt danach die Ergebnisse an die normale Roll-Auswertung.

Das ist entscheidend: Numerische Formelbestandteile werden erst anschließend verrechnet. Wird der Term `16d10` mit der Summe `94` erfüllt, bleibt ein nachfolgendes `+ 8` in der Formel unangetastet.

## Architekturentscheidung

Das Modul registriert in `Hooks.once("init")` eine eigene interaktive Würfelquelle, beispielsweise `summed-manual`. Diese erhält eine eigene `resolver`-Klasse, die vom Foundry-`RollResolver` erbt.

Diese Variante ist absichtlich einer globalen Überschreibung des Foundry-Resolvers vorzuziehen:

- Sie nutzt den vorgesehenen Erweiterungspunkt `CONFIG.Dice.fulfillment.methods`.
- Sie verändert keine digitalen Würfe und keine fremden Quellen.
- Sie reduziert Konflikte mit Dice- und Hardware-Modulen deutlich.

Zum Testen muss diese Quelle in Foundrys **Dice Configuration** für die gewünschten Würfeltypen (oder als Standard) ausgewählt werden. Die reguläre Quelle `manual` bleibt unverändert verfügbar.

## Umsetzungsschritte

1. **Modulgrundgerüst erstellen**
   - `module.json` mit Foundry-V14-Kompatibilität, ES-Modul, CSS und Deutsch/Englisch.
   - Unit-Test-Setup für reine Berechnungen und Validierung des Manifests.
   - Lokale Symlink-Installation unter `Data/modules/summed-up-damage-rolls`.

2. **Eigene Fulfillment-Methode registrieren**
   - `CONFIG.Dice.fulfillment.methods["summed-manual"]` mit `interactive: true`, lokalisierter Bezeichnung und eigener Resolver-Klasse anlegen.
   - Keine Änderungen an `CONFIG.Dice.fulfillment.methods.manual` vornehmen.
   - Zur Laufzeit prüfen, ob die registrierte Quelle tatsächlich aktiv ist; andernfalls eine einmalige, hilfreiche Hinweismeldung anbieten.

3. **Resolver und Oberfläche bauen**
   - Von `RollResolver` ableiten und die Form-Optionen sowie das Handlebars-Template überschreiben.
   - Ein zugänglicher Thumbswitch **Sum Up Dice** steuert den Modus für den gesamten geöffneten Resolver und startet aktiv, wenn die Modul-Würfelquelle verwendet wird.
   - Ausgeschaltet: die originale Einzelwürfel-Ansicht und ihr Verhalten bleiben erhalten.
   - Eingeschaltet: pro erfüllbarem Würfelterm ein Zahlenfeld mit Formel, Mindest- und Höchstsumme.
   - Beispiel: `16d10` erhält `min=16`, `max=160`, `step=1`.
   - Bei mehreren Pools bleibt je ein Feld bestehen, damit unterschiedliche Würfeltypen und Schadensarten nicht zusammengeworfen werden.

4. **Summen sicher in einen DiceTerm einbringen**
   - Vor dem Auswerten validiert der Resolver ganze Zahlen innerhalb des zulässigen Bereichs.
   - Für Summenmodus werden die individuellen Ergebnisse eines Terms intern so vorbereitet, dass Foundry genau die eingegebene Termsumme verwendet.
   - Ergebnis-verändernde Modifikatoren des betreffenden Terms werden für diesen Durchlauf gezielt übersprungen; sonst würde Foundry etwa `r1` ein zweites Mal anwenden.
   - Die ursprüngliche Formel und numerische Zusätze bleiben sichtbar und werden nach der Termauswertung wiederhergestellt.
   - Der Würfel-Tooltip erhält eine eindeutige Kennzeichnung wie „Manuelle Summe: 94“, statt erfundene Einzelaugen vorzutäuschen.

5. **Konservativen Gültigkeitsbereich erzwingen**
   - Summenmodus nur für additive Standardwürfel und manuell abgeschlossene Rerolls freigeben.
   - Für Keep/Drop, Explode, Erfolgs-/Fehlerzähler, Pool-Systeme, unendliche Maxima und komplexe verschachtelte Modifikatoren den Schalter deaktivieren und den Grund direkt am Feld nennen.
   - Negative und nicht-numerische Würfelterme werden ebenfalls nicht aggregiert.

6. **Tests und manuelle Abnahme**
   - Unit-Tests: Bereichsberechnung, mehrteilige Formeln, Validierung und Modifikator-Erkennung.
   - In Foundry testen: `16d10 + 8`, `2d6 + 1d8 + 4`, kritische Schadenswürfe sowie ein Reroll-Beispiel, dessen Endsumme physisch bestimmt wurde.
   - Vergleichen: Einzelmodus verhält sich bytegleich zum Foundry-Standard; Summenmodus addiert keine Boni doppelt und erzeugt keinen digitalen Nachwurf.

## Risiken und Konflikte

| Thema | Auswirkung | Umgang |
| --- | --- | --- |
| Mehrere interaktive Würfelquellen | Foundry kann wieder den Standardresolver wählen. | Eigene Quelle klar dokumentieren; Laufzeitwarnung statt stillschweigenden Fehlverhaltens. |
| Andere Resolver-Module | Ein anderes Modul kann dieselben Klassen oder Fulfillment-Einträge ersetzen. | Keine globale Überschreibung; eindeutiger Methodenname; Kompatibilitätsliste nach praktischen Tests. |
| Ergebnis-Modifikatoren | Eine reine Summe enthält keine Information über einzelne Augen. | Für komplexe Modifikatoren Sum-Up deaktivieren; Rerolls nur als bereits physisch erledigte Endsumme behandeln. |
| Chat-Tooltip | Synthetische Einzelwerte wären irreführend. | Ausdrücklich „Manuelle Summe“ anzeigen, nicht künstliche Würfelverteilung. |
| Berechtigungen | Manuelle Würfe sind in Foundry separat berechtigt. | Kernberechtigung `MANUAL_ROLLS` respektieren; keine Umgehung. |
| Foundry-V14-Updates | Der Resolver besitzt interne/private Abläufe. | Nur öffentliche Resolver-APIs verwenden, kleine Testmatrix pflegen und V14-Minimum im Manifest konkret angeben. |

## Akzeptanzkriterien für Version 1.0

- Der Schalter erscheint im Resolver der Modul-Würfelquelle und ist standardmäßig an.
- `16d10 + 8` akzeptiert im Summenmodus nur 16–160 und ergibt bei Eingabe `94` den Gesamttotal `102`.
- Ohne aktivierten Schalter bleibt die Einzelwürfel-Eingabe unverändert.
- Eine außerhalb des Bereichs liegende oder leere Summe kann nicht abgesendet werden.
- Ein Reroll-Modifikator wird im Summenmodus nicht von Foundry erneut ausgeführt.
- Komplexe, nicht sicher summierbare Terme fallen sichtbar auf den Einzelmodus zurück.
