# Summed-Up Damage Rolls

Ein Quality-of-Life-Modul für Foundry VTT 14: Große physische Würfelpools lassen sich im Fenster **Roll Resolution** als Summe statt Würfel für Würfel eingeben.

## Zweck

Foundrys manueller Würfelmodus erwartet normalerweise für jeden einzelnen Würfel ein Ergebnis. Dieses Modul ergänzt den manuellen Modus um **Sum Up Dice**. Ist der Schalter aktiv, wird jeder Würfelpool zu einem einzigen Zahlenfeld zusammengefasst.

Beispiel: Für `16d10 + 8` zeigt das Modul für `16d10` ein Eingabefeld mit dem Bereich **16–160**. Wird `94` eingetragen, berechnet Foundry anschließend `94 + 8 = 102`.

Die eingegebene Zahl steht ausschließlich für das fertige Ergebnis des jeweiligen Würfelpools. Über dem Feld steht deshalb als Standardhinweis, dass Formelboni nicht einzurechnen sind. Numerische Teile der Formel – etwa Schadensboni – werden weiterhin von Foundry berechnet. Nur Würfelterme mit einer Reroll-Regel zeigen zusätzlich einen kleinen Hinweis, dass die Summe erst nach dem physischen Reroll eingegeben wird.

## Bedienung

1. In Foundrys **Dice Configuration** die vom Modul registrierte manuelle Würfelquelle auswählen.
2. Einen Wurf mit manueller Auflösung starten.
3. Im Fenster **Roll Resolution** ist **Sum Up Dice** aktiv, sobald mindestens ein Würfelterm die Modul-Würfelquelle verwendet. Pro passendem Würfelterm erscheint ein Summenfeld statt einzelner Würfelfelder.
4. Den Thumbswitch ausschalten, um für diesen Wurf vollständig zum Foundry-Standardverhalten mit Einzelwürfeln zurückzukehren.
5. Summe eintragen und den Wurf absenden.

Bei Formeln mit mehreren Würfelarten gibt es ein Feld pro Würfelterm, zum Beispiel je eines für `2d6` und `1d8` in `2d6 + 1d8 + 4`. So bleiben die Formelteile und ihre Schadensarten eindeutig.

Eine pro Würfeltyp gesetzte Quelle hat Vorrang vor der Standardquelle. Ist etwa `d20` ausdrücklich auf **Manual Input** gestellt, erscheint bei einem reinen d20-Wurf kein Sum-Up-Schalter und Foundry verwendet weiter die Einzelwürfel-Eingabe.

## Regelumfang der ersten Version

- Unterstützt additive Würfelterme wie `16d10`, `2d6 + 8` und mehrere getrennte Würfelpools.
- Der Schalter ist pro geöffnetem Resolver standardmäßig an, wenn mindestens ein Würfelterm die Modul-Würfelquelle verwendet.
- Das Modul umgeht Ergebnis-modifizierende Würfelregeln im Summenmodus. Rerolls oder vergleichbare Regeln müssen deshalb bereits mit den echten Würfeln erledigt sein; die eingegebene Summe ist final.
- Würfelmodifikatoren, deren Ergebnis nicht allein als Augensumme darstellbar ist – etwa Keep/Drop, Explode oder Erfolgszähler – bleiben in der ersten Version im normalen Einzelwürfelmodus.
- Nicht-interaktive und digitale Würfe werden nicht verändert.

## Voraussetzungen und Kompatibilität

- Foundry VTT 14.370 oder neuer innerhalb von V14.
- Die Benutzerrolle benötigt weiterhin Foundrys Berechtigung für manuelle Würfe. Das Modul erweitert diese Berechtigung nicht.
- Das Modul ist systemneutral und wirkt auf den Foundry-Kernresolver, also auch auf Schadenswürfe aus D&D5e.

Die Umsetzung verwendet eine eigene, von Foundry vorgesehene interaktive Würfelquelle. Dadurch muss der globale `RollResolver` nicht überschrieben werden. Andere Module, die dieselbe Würfelquelle oder den Roll Resolver ersetzen, können dennoch konkurrieren; siehe [Implementationsplan](IMPLEMENTATION_PLAN.md).

## Entwicklung

Der Projektordner kann während der Entwicklung als symbolischer Link mit dem Modulnamen `summed-up-damage-rolls` in Foundrys `Data/modules`-Ordner liegen. Danach Foundry neu laden und das Modul in der Welt aktivieren.

## Lizenz

Noch festzulegen.
