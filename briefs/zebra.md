# Zebra — Training Brief (Displacement Anchor)

## Why this section exists

IO Resource is actively transitioning customers from Zebra to a set of alternatives: Datalogic for scanners, Bixolon and Toshiba for label printers, and Urovo for Android handhelds. This is the strategic priority for the business right now. This brief is not "how to sell Zebra" — it is the displacement anchor that ties the Datalogic, Bixolon/Toshiba, and Urovo modules together. Every rep needs to be able to walk into a site, recognise the Zebra kit a customer already runs, and know immediately what IOR migrates them to and why. Throughout, keep the language external-safe: we help customers "transition" and "migrate" to better-fit, forward-looking hardware.

## The Zebra products you'll encounter — what they are

These are the main Zebra lines you will see in the field. Learn to recognise them on sight.

- **DS9308** — 2D presentation / area-imager scanner, the hands-free "puck" on a retail or pharmacy counter. This is IOR's single biggest displacement target.
- **ZD421(d)** — 4-inch desktop direct-thermal label printer (the "d" = direct thermal). Zebra's GK-series replacement. This is the second biggest displacement target.
- **ZD510** — healthcare wristband printer, purpose-built for patient ID bands in hospitals and clinics.
- **ZQ610** — mobile / portable belt-worn printer for receipts and labels on the move.
- **TC-series** — Android touch mobile computers. You'll meet the TC15/16, TC21/22, TC26/27, TC52/57/58, TC73/78, and the rugged TC8300. Tiers run from light retail (TC15/21) up to full-shift warehouse (TC73/78).
- **MC-series** — pistol-grip and heavy-rugged warehouse mobile computers: the MC3300/MC3300x (keypad, gun-grip warehouse workhorse) and the MC9300/MC9400 (the big full-rugged "brick" for cold-store and heavy industrial).

## The replacement matrix (the core takeaway)

This table is the heart of the brief. If you remember one thing, remember this: a customer has a Zebra X → we put in Y.

| Zebra product | IOR replacement | Why (one line) |
|---|---|---|
| DS9308 | Datalogic Magellan 900i (premium step-up: Magellan 1500i) | Faster trigger, scans off phone screens, on-device config, carriage-return enabled by default |
| ZD421d | Bixolon XD5-40 (default); Toshiba BV420D on request only | Faster direct thermal, ZPL emulation = drop-in, more robust build; Bixolon is the default quote — Toshiba only on customer request / existing Toshiba estate |
| ZD510 (healthcare wristband) | Bixolon equivalent (to be confirmed) | Wristband-capable healthcare printer; specific model to be confirmed — flag to product team |
| ZQ610 (mobile printer) | Urovo mobile printer (SP319 / SP409) | Mobile label/receipt printing; **caveat: ZPL needs SDK work — pre-qualify before quoting** |
| TC15/16, TC21/22 | Urovo RT40 / DT40 | Current-generation Android handheld at the light-retail / entry tier |
| TC26/27 | Urovo DT40 4G / RT40 4G | Same tier with integrated 4G/cellular |
| TC52/57/58 | Urovo DT50 | Mid-tier enterprise Android handheld |
| MC3300 / MC3300x | Urovo DT40 + gun grip / RT40 | Keypad warehouse workhorse, gun-grip configuration |
| MC9300 / MC9400 | Urovo RT40 full-rugged | Full-rugged warehouse / cold-store replacement |
| TC8300 | Urovo DT40 + gun grip | Rugged gun-grip warehouse scanning |

## How to handle the conversation

When a customer currently runs Zebra, lead with the replacement's strengths — never open by knocking Zebra.

- **Lead with the wins on the replacement.** On scanners, cite the bench-tested Datalogic advantages — faster trigger response, the ability to read off phone screens, and on-device configuration. On printers, lead with build quality and throughput (the Bixolon XD5-40 runs ~17% faster direct thermal than the ZD421; the Toshiba BV420D ships with Ethernet as standard where Zebra charges extra). On handhelds, lead with current Android (13, with a runway to Android 17) and Wi-Fi 6 versus the older Android 10 / Wi-Fi 5 generation on legacy Zebra kit.
- **Reassure on workflow continuity.** This is the objection-killer for printers: the Bixolon and Toshiba units emulate ZPL II, so they drop straight into an existing Zebra estate with no label-format rewrites and no change to BarTender templates or middleware. The migration is low-risk.
- **Position as a forward-looking upgrade, not a downgrade.** Frame it as moving onto current silicon, current OS, longer software support runway, and open device management (SOTI Connect) rather than a proprietary, locked-in stack.
- **Match the tier, not just the box.** Use the matrix to land on the right replacement for the customer's actual workflow tier (light retail vs. mid-enterprise vs. full-rugged warehouse) rather than over- or under-speccing.
- **Flag the known caveats early.** On the ZQ610 → Urovo mobile printer move, ZPL support needs SDK work — pre-qualify that requirement before committing to a quote. On the ZD510 healthcare wristband move, confirm the exact Bixolon model with the product team before quoting.

## Trademark / comparison note

IOR can reference Zebra product names in plain text for identification and comparison purposes — that is exactly what this brief and our customer-facing material do. Published side-by-side comparison guides (e.g. Bixolon XD5-40 vs Zebra ZD421, Toshiba BV420D vs Zebra ZD421, Urovo RT40 vs Zebra MC3300x) exist on the IO Resource website for reps and customers to reference.

## Quiz seeds

```json
{
  "quiz": [
    {
      "q": "A customer's retail counter has a Zebra DS9308 presentation scanner. What does IOR transition them to?",
      "options": ["Datalogic Magellan 900i", "Urovo DT50", "Bixolon XD5-40", "Toshiba BV420D"],
      "correctIndex": 0,
      "explanation": "The DS9308 is IOR's single biggest displacement target. The standard replacement is the Datalogic Magellan 900i, with the Magellan 1500i as the premium step-up."
    },
    {
      "q": "A customer runs Zebra ZD421d 4-inch desktop label printers and wants the lowest delivered price. Which replacement leads?",
      "options": ["Bixolon XD5-40", "Toshiba BV420D", "Urovo DT40", "Datalogic Magellan 1500i"],
      "correctIndex": 0,
      "explanation": "The Bixolon XD5-40 is the default ZD421d replacement on all displacement and new business. Toshiba BV420D is quoted only on explicit customer request or where an existing Toshiba estate applies."
    },
    {
      "q": "A warehouse uses Zebra MC9300 full-rugged mobile computers. What does IOR replace them with?",
      "options": ["Urovo RT40 full-rugged", "Urovo DT50", "Datalogic Magellan 900i", "Bixolon XD5-40"],
      "correctIndex": 0,
      "explanation": "The heavy full-rugged MC9300/MC9400 maps to the Urovo RT40 in its full-rugged configuration."
    },
    {
      "q": "A customer has Zebra TC52 handhelds. What is the IOR replacement?",
      "options": ["Urovo DT50", "Urovo RT40 full-rugged", "Datalogic Magellan 900i", "Toshiba BV420D"],
      "correctIndex": 0,
      "explanation": "The mid-tier TC52/57/58 family maps to the Urovo DT50."
    },
    {
      "q": "A customer runs Zebra ZQ610 mobile printers. What is the key thing to check before quoting the Urovo replacement?",
      "options": ["That ZPL support is confirmed — it needs SDK work, so pre-qualify", "That the customer has Wi-Fi 6", "That the printer prints in colour", "Nothing — it is a straight drop-in"],
      "correctIndex": 0,
      "explanation": "The ZQ610 maps to the Urovo SP319/SP409, but ZPL needs SDK work. Always pre-qualify the ZPL requirement before committing to a quote."
    },
    {
      "q": "Why does the Bixolon/Toshiba printer migration carry low workflow risk for the customer?",
      "options": ["They emulate ZPL II, so they drop into a Zebra estate without rewriting label formats", "They use the same Zebra DNA software", "They are made by Zebra under licence", "They only print blank labels"],
      "correctIndex": 0,
      "explanation": "ZPL II emulation means existing label formats, BarTender templates and middleware keep working — a drop-in replacement with no format rewrites."
    },
    {
      "q": "A customer has Zebra TC26 handhelds and needs integrated cellular. What does IOR offer?",
      "options": ["Urovo DT40 4G / RT40 4G", "Urovo DT50", "Datalogic Magellan 900i", "Bixolon XD5-40"],
      "correctIndex": 0,
      "explanation": "The TC26/27 (cellular-capable tier) maps to the Urovo DT40 4G or RT40 4G."
    },
    {
      "q": "A customer runs Zebra MC3300x keypad warehouse units. What does IOR replace them with?",
      "options": ["Urovo DT40 + gun grip / RT40", "Urovo DT50", "Datalogic Magellan 1500i", "Toshiba BV420D"],
      "correctIndex": 0,
      "explanation": "The pistol-grip MC3300/MC3300x maps to the Urovo DT40 with gun grip, or the RT40."
    }
  ],
  "flashcards": [
    {
      "front": "Zebra DS9308 → ?",
      "back": "Datalogic Magellan 900i (premium step-up: Magellan 1500i). IOR's biggest displacement target."
    },
    {
      "front": "Zebra ZD421d → ?",
      "back": "Bixolon XD5-40 — the default. Toshiba BV420D only if the customer asks for it or runs a Toshiba estate. Both emulate ZPL = drop-in."
    },
    {
      "front": "Zebra ZQ610 mobile printer → ?",
      "back": "Urovo mobile printer (SP319/SP409). Caveat: ZPL needs SDK work — pre-qualify."
    },
    {
      "front": "Zebra TC52/57/58 → ?",
      "back": "Urovo DT50 (mid-tier enterprise Android handheld)."
    },
    {
      "front": "Zebra MC9300/MC9400 → ?",
      "back": "Urovo RT40 full-rugged."
    },
    {
      "front": "Why is the printer migration low-risk for the customer?",
      "back": "Bixolon and Toshiba emulate ZPL II — labels, BarTender templates and middleware keep working with no rewrites."
    }
  ],
  "scenarios": [
    {
      "scenario": "You're at a pharmacy that runs Zebra DS9308 presentation scanners at the counter and Zebra ZD421d printers in the dispensary. The manager is happy with what they have and is wary of change.",
      "q": "What is the strongest opening move?",
      "options": ["Lead with the replacement wins — faster Datalogic trigger and phone-screen scanning, plus ZPL-emulation printers that drop in with no label rewrites", "Tell them Zebra is being discontinued", "Open by criticising Zebra reliability", "Quote the cheapest option without explaining the migration"],
      "correctIndex": 0,
      "explanation": "Lead with the replacement's strengths and reassure on workflow continuity (ZPL emulation = drop-in). Position it as a forward-looking upgrade, never as a downgrade or a knock on Zebra."
    },
    {
      "scenario": "A 3PL warehouse runs a fleet of Zebra MC3300x keypad units and some Zebra TC8300 gun-grip devices, all on Android 10.",
      "q": "What do you propose, and what's the headline argument?",
      "options": ["Urovo DT40 + gun grip / RT40, leading with current Android (13, runway to 17) and Wi-Fi 6 versus their ageing Android 10 / Wi-Fi 5 estate", "Keep them on Zebra and just add chargers", "Replace only the printers", "Urovo DT50 tablets for everyone"],
      "correctIndex": 0,
      "explanation": "Both the MC3300x and the TC8300 map to the Urovo DT40 with gun grip (RT40 for full-rugged). The forward-looking upgrade argument — current OS, longer support runway, Wi-Fi 6 — is the headline."
    },
    {
      "scenario": "A hospital uses Zebra ZD510 wristband printers and ZQ610 mobile printers on the wards.",
      "q": "What's the right approach before you quote?",
      "options": ["Map ZD510 to the Bixolon healthcare equivalent (confirm exact model with product team) and ZQ610 to the Urovo SP319/SP409, but pre-qualify the ZPL/SDK requirement first", "Quote both immediately as straight drop-ins", "Tell them no replacement exists", "Replace the wristband printer with a Datalogic scanner"],
      "correctIndex": 0,
      "explanation": "The ZD510 maps to a Bixolon healthcare equivalent that must be confirmed with the product team, and the ZQ610 maps to a Urovo mobile printer where ZPL needs SDK work — both carry caveats to resolve before quoting."
    }
  ]
}
```
