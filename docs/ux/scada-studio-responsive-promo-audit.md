# SCADA Studio responsive promo — UX audit v2

This audit comes from rebuilding a water-transfer project from an empty view, commissioning it, and operating the same live document while the viewport moves from a 4K engineering monitor to an iPhone-sized dispatcher.

The first recording was rejected because the project entered Run mode before the finished state was clearly established and the intro overlay survived into the second half. Version 2 treats both failures as testable regressions rather than editing mistakes.

## Scenario exercised

The engineer creates and configures:

- source tank `T-101` at 82%;
- product tank `T-102` at 26%;
- duty train `T-101:out → FV-101 → P-101 → T-102:in`;
- standby train `T-101:nozzle-1 → FV-102 → P-102 → T-102:nozzle-1`;
- controller `PLC-01`;
- six routed process connections with no unresolved endpoint.

Only after the completion gate passes does the scenario enter Run mode, start `P-101`, open `FV-101`, exercise semantic zoom, and continue through desktop, tablet and phone layouts. On the phone it switches between the HTML device dispatcher and the topology diagram, then starts the standby train from device cards.

## Recording gates

The deterministic renderer refuses to encode the MP4 unless all of these conditions hold:

1. New view contains zero equipment and zero connections before placement starts.
2. Pre-Run checkpoint contains exactly seven devices and six connections.
3. Every connection has both `from` and `to` endpoints.
4. The full-screen intro node has been physically removed from the DOM.
5. Every non-intro checkpoint is captured with no `#title` overlay.
6. Final state remains Run mode, Devices view, seven devices, six routes and no horizontal overflow.
7. Page errors and console errors are empty.

The completed engineering state is held for 2.4 seconds before Run mode, so the viewer can read the object as finished rather than infer completion during a transition.

## UX and runtime fixes made during the reshoot

### New view is explicit

The former scenario placed equipment over the preloaded demo plant. The video now invokes **New view**, accepts the destructive confirmation, verifies an empty scene, and only then opens the library.

### Semantic zoom render loop is idempotent

The responsive module observed scene attributes and `semanticDetail()` wrote `data-zoom-tier` on every render, even when the value had not changed. That caused a MutationObserver → microtask → attribute-write loop. The tier is now written only when it actually changes.

### Port selection evaluates a pair, not two isolated ports

The original heuristic picked an outlet and inlet independently. A pump could therefore select its right-facing electrical `power` port instead of its top process `out`, making the next process connection incompatible and leaving Connect in a confusing half-state.

The new resolver scores compatible source/target pairs together. It prioritises:

- unused ports;
- outlet/inlet and bidirectional roles;
- matching connection domains;
- process-to-process paths for process equipment;
- exact medium matches;
- useful facing directions.

This produces the intended duty and standby routes without using a tank vent as a liquid outlet.

### Run mode removes engineering chrome

On wide screens, Run mode collapses the left project/library dock and gives the live process more space. The operator inspector remains available for controlled commands and signals.

### Notifications no longer cover the work area

Transient application toasts are shorter and occupy a compact top-right location. Promotional captions live outside the emulated device screen. Neither can mask the lower diagram or phone controls.

### Mobile view is stable

The last selected mobile Run view is remembered. Resizing no longer repeatedly forces Devices and destroys the operator's Diagram context.

## Responsive evidence

The same completed and running document is shown at:

- 3840 × 2160 — 4K engineering monitor;
- 2560 × 1440 — QHD engineering monitor;
- 1920 × 1080 — Full HD workstation;
- 1440 × 900 — operator desktop;
- 1024 × 768 — tablet landscape;
- 820 × 1180 — tablet portrait;
- 390 × 844 — iPhone-sized dispatcher and diagram.

The rendered MP4 contains 46 real Chromium checkpoints, runs for 38.92 seconds, is encoded as H.264 at 1920 × 1080, and contains only one full-screen title frame: the intro.

## Remaining interaction debt

The recording still exposes useful future work:

- On 4K, repeated selection/property editing crosses most of the screen. A contextual quick-properties surface or command search should reduce travel without creating a second metadata model.
- Automatic port selection is now correct for the demonstrated network, but when several equally valid ports remain the engineer needs a lightweight chooser and a visible preview before committing.
- Common equipment should be available through recent-items or command search so Project ↔ Library switching is not required for every placement session.
- Phone remains Run-first. The product should define a deliberately small set of corrective engineering operations instead of shrinking the entire desktop editor.
- A bounded 1200 × 720 canvas is appropriate for one process view, not an entire plant. Larger projects need named views, sections or an infinite workspace.

These items remain tracked in issue #9.
