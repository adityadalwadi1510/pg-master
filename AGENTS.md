<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions & Permanent System Rules: PG Master

## 📱 MANDATORY RULE: Mobile-First & Touch-Friendly UI

Every feature, page, component, modal, sheet, table, and workflow developed for this project MUST strictly follow these rules without exception:

1. **Mobile-First Priority:**
   - PG owners and managers in India operate predominantly on mobile smartphones (PWA). All screens must be designed mobile-first (supporting 320px–420px viewports seamlessly) and scale up gracefully to tablet and desktop.
   - Never develop desktop-only layouts or assume a pointer/mouse is present.

2. **Touch Ergonomics & Sizing:**
   - Touch targets (buttons, card clicks, tabs, status tags) must have a minimum interactive touch area of 40×40px to 44×44px to prevent miss-taps.
   - On mobile viewports, form action buttons in dialogs, sheets, and checkouts must be full-width (`w-full`) and comfortably reachable by thumbs.
   - Inputs must maintain a minimum 16px font-size (`text-base md:text-sm`) to prevent iOS Safari from automatically zooming into form fields and breaking the viewport.

3. **Responsive Layouts & Overflow Protection:**
   - Strictly prohibit horizontal page scroll (`overflow-x-hidden` on main container).
   - Use responsive grid layouts (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3...`) rather than fixed widths.
   - Tables must either adapt into responsive card lists on mobile or live within a smooth touch-scrolling container with visible horizontal indicators.

4. **Bottom-Bar Navigation & Safe Area Insets:**
   - Mobile navigation must stay anchored to the bottom with adequate safe-area padding (`pb-safe` / `env(safe-area-inset-bottom)`) so it does not collide with phone home indicators.
   - Sticky headers and floating action buttons must respect top and bottom mobile device cutouts.

5. **Performance on 4G Mobile:**
   - Adhere strictly to NFR-1: FCP < 1.5s on 4G networks, client bundle < 250 KB compressed.
   - Maintain 60 FPS scrolling on low-to-mid tier Android and iOS phones via `@tanstack/react-virtual` or lightweight CSS.
