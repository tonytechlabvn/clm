# Image Template Visual Editor — Manual QA Checklist

Phases 07-14 of `plans/260410-2306-image-template-system`. Run through this
list on a clean dev DB (with `npx prisma db seed` to load starters) before
shipping iteration 2.

## Environment setup

- [ ] `npx prisma db push` (applies the nullable `layerData` column from phase-07)
- [ ] `npx prisma db seed` (upserts the 5 new layerData starters + legacy templates)
- [ ] `npm run dev` on port 3000, signed in as an admin user with a CMA org

## Route + navigation

- [ ] Sidebar shows "Image Studio" linking to `/admin/cma/image-templates`
- [ ] "Image Templates Docs" still links to the KB at `/admin/cma/kb/image-templates`
- [ ] Opening `/admin/cma/image-templates` renders the gallery (not the editor)
- [ ] `/admin/cma/image-templates?mode=new` opens a blank editor
- [ ] `/admin/cma/image-templates?mode=edit&id={id}` opens the editor with that template loaded
- [ ] Back button from editor returns to gallery (via the Cancel icon)

## Gallery

- [ ] 5 starter templates visible: Instagram Post, Twitter Card, Open Graph, Quote Card, LinkedIn Post
- [ ] Legacy system templates (Facebook Post, Generic Announcement) also visible
- [ ] Category sidebar shows counts per platform; hidden categories disappear
- [ ] "All" category shows the total
- [ ] Search filters by name (case-insensitive, substring match)
- [ ] System templates show a small "System" lock badge
- [ ] Delete button is hidden on system template cards
- [ ] Delete button on org-owned templates prompts confirm + removes on OK
- [ ] Duplicate button clones a template and opens the editor on the new copy
- [ ] Clicking a card navigates to the editor

## Wizard

- [ ] "New template" button opens the wizard modal
- [ ] Wizard shows the same category sidebar + grid as the gallery
- [ ] Only system templates are listed (no org templates pollute the starter grid)
- [ ] Clicking a starter navigates to `?mode=edit&id={starterId}` and the load flow forks it into a draft
- [ ] The name of a forked starter ends with "(Copy)" and `meta.id` is null (saving creates a new row, doesn't mutate the system original)
- [ ] "Start blank" button opens a blank editor (no starter)
- [ ] X button + backdrop click close the wizard

## Editor — blank flow

- [ ] 3-panel layout: left palette, center canvas, right panel
- [ ] Canvas shows "1200 × 630 — drop an element from the left palette" empty hint
- [ ] Top bar shows name input, undo/redo disabled, zoom controls, Preview toggle, Save disabled
- [ ] Left palette has Text / Image / Rect buttons

## Editor — layers

- [ ] Add Text button → new text layer appears centered on canvas, auto-selected
- [ ] Right panel auto-switches from Layers to... actually the inspector tab shows selected layer (verify properties tab populates)
- [ ] Add Image button → placeholder tile appears centered
- [ ] Add Rect button → gray rectangle appears centered
- [ ] Clicking a layer on canvas selects it (blue outline on the Moveable handles)
- [ ] Clicking empty canvas body deselects
- [ ] Moveable handles appear on selected layer: 8 resize points + rotation handle
- [ ] Drag the layer body → position updates; release → single undo entry (Ctrl+Z jumps to pre-drag position, not mid-drag)
- [ ] Resize from corner → width/height + x/y update correctly
- [ ] Rotate → transform:rotate applies
- [ ] Arrow keys nudge 1px
- [ ] Shift+arrow nudges 10px
- [ ] Delete key removes selected layer
- [ ] Ctrl+D duplicates selected layer (offset +20/+20, auto-selected)
- [ ] Ctrl+Z / Ctrl+Y undo/redo across all operations
- [ ] Undo stack never loses the pre-drag state (zundo pause/resume works)

## Editor — layer tree

- [ ] Layers tab shows all layers topmost-first
- [ ] Layer icons match type (Type / Image / Square)
- [ ] Click row selects the layer on canvas
- [ ] Eye icon toggles visibility (layer disappears from canvas)
- [ ] Lock icon toggles lock (layer can't be dragged via Moveable, arrow nudge skipped)
- [ ] Trash icon deletes layer
- [ ] Drag-reorder swaps layers in the stack — canvas z-order updates
- [ ] zIndex values stay integer after reorder (inspect devtools)

## Editor — properties inspector

- [ ] Transform section: X/Y/W/H/Rotation/Opacity inputs update canvas in real time
- [ ] Opacity clamps [0, 1]
- [ ] Width/Height clamps min 1
- [ ] Text properties: font family dropdown has 10 options, Be Vietnam Pro default
- [ ] Font size numeric input updates canvas
- [ ] Font weight select 400-800
- [ ] Color picker opens native color picker + hex text input
- [ ] Text alignment left/center/right
- [ ] Line height / letter spacing numeric inputs
- [ ] Image properties: source URL text input
- [ ] Image Upload button opens file picker
- [ ] Fit mode select cover/contain/fill
- [ ] Border radius clears to undefined when set to 0
- [ ] Border width/color clears border when width drops to 0
- [ ] Rect properties: fill color + border + radius all work

## Editor — variables

- [ ] Variables tab shows empty state when no vars declared
- [ ] "Add" button creates a new variable row with autogen name var1/var2/...
- [ ] Name field validates identifier regex (letter/underscore start, alphanum/underscore body)
- [ ] Renaming a variable buffers in local state and commits on blur (cursor stays in field while typing)
- [ ] Escape key discards the draft
- [ ] Rename collision with existing name is rejected + field flips to red
- [ ] "Used but not declared" warning appears when a text layer has an undeclared token
- [ ] Click a yellow missing-token pill → creates a stub variable with that name
- [ ] "Unused" badge shows on declared variables with no layer references
- [ ] Delete button removes a variable
- [ ] Text property section shows "Insert var..." dropdown when ≥1 variable exists
- [ ] Selecting a variable inserts `{{name}}` at the cursor position (not the end)
- [ ] Consecutive inserts land at the new cursor position

## Editor — preview mode

- [ ] Preview off (default): tokens render raw on canvas (`{{title}}`)
- [ ] Preview on: tokens substitute with variable defaults (or labels)
- [ ] Eye/EyeOff icon + button variant state match preview mode
- [ ] Toggling preview does NOT add to undo history (Ctrl+Z still jumps to the real last content edit)

## Editor — save flow

- [ ] Save button disabled when no changes + existing template
- [ ] Save button enabled after first edit
- [ ] Save with empty name → "Template name is required" inline error
- [ ] Save with no layers → "Add at least one layer before saving" inline error
- [ ] Save with undeclared tokens → window.confirm prompts "Auto-create N missing variables?"
- [ ] Confirm yes → save succeeds + new variables are appended to the row
- [ ] Confirm no → save aborts, no changes made
- [ ] Successful save → dirty flag clears, id persists for subsequent saves
- [ ] New templates route from POST, existing from PUT
- [ ] Save error → inline error text in top bar (truncated with tooltip)
- [ ] Saving a fork (system template loaded with meta.id=null) creates a new row, original untouched

## Editor — asset upload

- [ ] Click Upload in image properties section → file picker opens
- [ ] PNG / JPEG / WebP accepted
- [ ] SVG rejected at the file picker (accept attribute)
- [ ] File >10MB rejected with inline error
- [ ] Successful upload → image appears in canvas with returned public URL
- [ ] Uploaded file lands at `uploads/cma/image-templates/assets/{orgId}/{uuid}.ext` on disk
- [ ] Public URL `/api/cma/image-templates/assets/{orgId}/{uuid}.ext` returns the image without a session cookie (curl)

## Thumbnail + gallery integration

- [ ] After save, thumbnail file appears at `uploads/cma/image-templates/assets/thumbnails/{id}.png`
- [ ] Gallery card shows the new thumbnail on refresh
- [ ] Direct URL fallback shows correctly when thumbnail hasn't been generated yet
- [ ] Starters without saved thumbnails use Direct URL fallback

## Render integration (unchanged paths)

- [ ] `GET /api/cma/image-templates/{id}/image?auth=X&title=Y` returns PNG (existing flow)
- [ ] Facebook post publish flow still works with a visual-editor-authored template as the featured image
- [ ] `npx prisma db seed` runs clean and reupserts all starters

## Regression suite

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx next lint` → 0 warnings
- [ ] `npx vitest run src/__tests__/cma/image-template-editor-*.test.ts src/__tests__/cma/template-layer-compiler.test.ts` → 103/103 green
- [ ] Existing phase 01-06 tests still pass (legacy HTML renderer path untouched)

## Known gaps / deferred

- Multi-select + group move deferred to iteration 3
- Icon / polygon / QR / barcode layer types deferred
- CSS/JS custom code tab deferred
- Real-time collaboration deferred
- Version history / rollback deferred
- Orphaned asset cleanup on template delete deferred
- Bilingual editor guide (KB) deferred — use this QA doc as interim reference
