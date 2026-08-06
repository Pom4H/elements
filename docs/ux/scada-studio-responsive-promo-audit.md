# SCADA Studio responsive promo — UX audit

This audit was recorded while building a real water-transfer project from an empty view, then operating the same document from desktop, tablet and phone layouts.

## Scenario exercised

The engineer places and configures:

- source tank `T-101`;
- product tank `T-102`;
- duty train `FV-101 → P-101`;
- standby train `FV-102 → P-102`;
- controller `PLC-01`;
- six process pipes joining both trains between the tanks.

The same project is then switched to Run mode. The operator starts the duty train, changes diagram zoom and continues from a phone using either the topology diagram or the HTML device dispatcher.

## Responsive evidence

The promo traverses these viewport classes without horizontal document overflow:

- 3840 × 2160 — 4K engineering monitor;
- 2560 × 1440 — QHD engineering monitor;
- 1920 × 1080 — Full HD workstation;
- 1440 × 900 — compact desktop;
- 1024 × 768 — tablet landscape;
- 820 × 1180 — tablet portrait;
- 390 × 844 — iPhone-sized viewport.

The recording contains 46 browser checkpoints and runs for 46.17 seconds at 1920 × 1080 H.264. The final project contains seven devices and six routed connections. The final phone state remains in Run mode with no horizontal overflow and no console error.

## Friction removed during recording

### Direct placement instead of create-then-drag

Previous behavior:

1. click an item in the library;
2. the object appears near the centre;
3. move the pointer to the object;
4. drag it across the canvas;
5. correct the position.

Current behavior:

1. choose an item in the library;
2. click its intended position on the canvas.

The selected library item enters placement mode, and the next canvas click owns the final logical scene coordinates.

### Sticky connection tool

Previous behavior required reopening Connect after every pipe. A six-pipe process therefore repeated the same toolbar round-trip six times.

Connect now remains active while the engineer builds a network. Each source/target pair creates a compatible semantic connection, and `Escape` ends the session.

### Operator commands removed from the engineering inspector

On a phone, opening the metadata inspector only to start a pump or open a valve is unnecessary context switching. Run mode now becomes an HTML object dispatcher with device cards containing tag, state, telemetry and the relevant command buttons.

### Phone topology remains available

The dispatcher does not replace the process diagram. The operator can switch to Diagram and use large zoom controls, then return to Devices for commands.

### Docks become drawers and sheets

Desktop docks do not shrink into unusable columns. At tablet and phone widths:

- project/library navigation moves into a drawer;
- the activity rail enters the thumb zone;
- properties become a bottom sheet;
- the process canvas receives most of the viewport.

### Zoom changes information density

Zoom is not only a CSS scale. It also drives the existing element detail/abstraction contracts so equipment progressively moves through full, compact and symbol-oriented presentations.

## Remaining UX debt

### Long cross-screen travel on wide monitors

The library is on the left and generated properties are on the right. During repeated place/configure work, the pointer crosses most of a 4K canvas. Candidate improvements:

- compact quick-properties next to the current selection;
- a transient command palette for common attributes;
- keeping the last-used property group near the cursor.

This should not become two permanent inspectors; the goal is reducing travel without duplicating the metadata model.

### Automatic port choice is efficient but opaque

Connect chooses unused compatible ports. This is fast for simple equipment, but the engineer cannot inspect or override the exact port before committing a route. The next iteration should expose a lightweight port chooser only when more than one valid candidate exists.

### Mode-driven view changes may surprise

Entering Run mode on a phone automatically opens Devices. This is usually the correct action surface, but it changes the current view implicitly. The application should remember the operator's last mobile Run view and provide a brief, non-blocking explanation on the first transition.

### Project and library share navigation space

Repeatedly switching between the project tree and element library is still a panel change. A desktop “recent elements” strip or command search could handle most placements without opening the full library.

### Mobile engineering remains intentionally constrained

Editing is technically available on narrow screens, but precise topology construction is not a primary phone workflow. Mobile should remain Run-first, with small corrective edits rather than attempting to reproduce the entire desktop Studio.

### Fixed logical canvas

The current project uses a bounded 1200 × 720 logical scene. Larger plants will need multiple named views or an infinite/sectioned canvas. Responsive layout should not be confused with fitting an entire plant into one document.

## Validation notes

A Chromium smoke test separately verified:

- direct placement from an empty scene;
- sticky Connect creating two pipes without leaving the tool;
- 4K zoom to 200%;
- tablet and phone layouts without horizontal overflow;
- automatic phone device-dispatcher mode;
- phone diagram zoom from 30% to 40%;
- zero console errors.

The promotional recording is a deterministic render of real browser states. Every checkpoint follows an actual application action; frames are cross-faded into the final video rather than drawing a UI mockup.
