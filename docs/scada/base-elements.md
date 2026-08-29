# SCADA base element set

This is a practical base set for operator graphics, not a claim that a standards body publishes a universal frequency ranking. It is chosen from the overlap of process-display practice, ISA instrumentation/control notation, DEXPI P&ID equipment classes, and the electrical devices normally surfaced in industrial HMIs.

References:

- ANSI/ISA-5.1-2024 — instrumentation and control symbols and identification: https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa5-1
- ISA-5.5 — graphic symbols for process displays: https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa5-5
- ISA-101 — HMI consistency, situational awareness and display hierarchy: https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards
- DEXPI P&ID equipment model: https://dexpi.org/static/pid_specification_1.4/reference/Equipment/index.html
- IEC 60617 — graphical symbols for electrotechnical diagrams: https://webstore.iec.ch/en/publication/2723

## Tier A — visual language must be solved first

These objects appear across the widest range of process, utility, water, HVAC, energy and manufacturing HMIs. They define the visual grammar for the rest of the library.

| Priority | Element | Typical operator question | Elements tag |
| ---: | --- | --- | --- |
| 1 | Pump | running, available, pressure/flow, fault? | `pe-pump` |
| 2 | Isolation / on-off valve | open or closed, permissive/fault? | `pe-valve` |
| 3 | Control valve | actual vs command position, actuator healthy? | `pe-control-valve` |
| 4 | Tank / vessel | level, limits, pressure, contents? | `pe-tank` |
| 5 | Motor | running, current/load, overload? | `ee-motor` |
| 6 | Process instrument | P/T/F/L value, quality, alarm? | `pe-instrument` |
| 7 | Fan / blower | running, speed, gas/air flow? | `pe-fan` |
| 8 | Compressor | running, discharge pressure, flow, trip? | `pe-compressor` |
| 9 | Heat exchanger | duty active, inlet/outlet temperatures? | `pe-heat-exchanger` |

These nine are the first themed set.

## Tier B — common control and electrical layer

| Priority | Element | Reason |
| ---: | --- | --- |
| 10 | PLC / controller | ubiquitous control-system node and I/O health surface |
| 11 | VFD / drive | common operator control point for pumps, fans and conveyors |
| 12 | Circuit breaker / switchgear | power availability and protection state |
| 13 | Electrical meter | voltage/current/power/frequency |
| 14 | Contactor | discrete motor/load switching |
| 15 | Transformer | electrical distribution overview |

## Tier C — common by process domain

- Filter / strainer
- Heater / boiler / furnace
- Separator / column
- Mixer / agitator
- Conveyor / feeder
- Generator / UPS / battery
- Cooling tower
- Turbine
- Dryer

These are frequent, but not universal enough to define the first visual grammar.

## Connections are not equipment themes

Pipes, wires, signals, buses, tees and junctions are scene primitives. Their visual language must be consistent with the equipment views, but changing an equipment `view` must not change endpoint identity or routing.

## Visual families

Every Tier A element exposes the same presentation-only attribute:

```html
<pe-pump view="pid" ...></pe-pump>
<pe-pump view="flat" ...></pe-pump>
<pe-pump view="equipment" ...></pe-pump>
```

The three SVG families are deliberately different drawings:

- `pid` — notation-first engineering symbol, suitable for dense process diagrams;
- `flat` — high-performance operator SCADA, minimal detail with strong state readability;
- `equipment` — recognisable physical silhouette for close zoom and engineering views.

`view` never changes process attributes, derived states, motions, part semantics or port identifiers. Light/dark colour schemes are a separate concern and must work on every visual family.

## Shared visual grammar

Across all families:

- equipment is neutral by default;
- operation uses one small marker, not a green-painted machine;
- warning uses an amber primary outline;
- alarm uses a red primary outline;
- quality is independent from severity;
- process media/readouts may use a restrained process accent;
- external pipes/wires remain scene-owned;
- labels and numeric hierarchy remain predictable even when the SVG silhouette changes.
