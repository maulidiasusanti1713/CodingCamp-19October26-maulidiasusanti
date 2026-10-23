# Implementation Plan: To-Do Life Dashboard

## Overview

Build a fully client-side single-page dashboard using plain HTML, CSS, and vanilla JavaScript. The implementation is structured as five IIFE-style modules written sequentially in `js/app.js`, with a `css/styles.css` stylesheet and a test suite powered by Vitest + fast-check. No bundler or backend is required for the app; Vitest is used only to run automated tests.

## Tasks

- [x] 1. Set up project structure and test tooling
  - Create `index.html`, `css/styles.css`, and `js/app.js` as empty shells with the correct relative references between them
  - Add a minimal `package.json` with `vitest` and `fast-check` as dev dependencies and a `"test": "vitest --run"` script
  - Create `vitest.config.js` configured for the `jsdom` environment so DOM-dependent modules can be tested
  - Create `tests/` directory with a placeholder `tests/setup.js` file
  - _Requirements: 6.3, 7.3, 7.4_

- [x] 2. Implement StorageService
  - [x] 2.1 Write the `StorageService` IIFE module in `js/app.js`
    - Implement `isAvailable()`, `load(key)`, and `save(key, value)` using the `lifedb_` prefix
    - Wrap `localStorage.setItem` in `try/catch`; return `false` on failure and dispatch `lifedb:storage-error` on `document`
    - Wrap `JSON.parse` in `try/catch` inside `load()`; return `null` on parse failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for StorageService (Property 12)
    - **Property 12: Storage round-trip fidelity**
    - **Validates: Requirements 5.1, 5.4**
    - Use fast-check to generate arbitrary `Task[]` and `QuickLink[]` arrays; assert `load` after `save` deep-equals the original
    - Tag with `// Feature: todo-life-dashboard, Property 12: Storage round-trip fidelity`

  - [ ]* 2.3 Write unit tests for StorageService
    - Test `save`/`load` round-trip for a concrete Task array
    - Test `load` returns `null` for corrupted JSON
    - Test `isAvailable` returns `false` when `localStorage` is stubbed to throw
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 3. Implement GreetingWidget
  - [x] 3.1 Write the `GreetingWidget` IIFE module in `js/app.js`
    - Implement `getGreeting(hour)` returning the correct string for hours 0–4 (night), 5–11 (morning), 12–17 (afternoon), 18–20 (evening), 21–23 (night)
    - Implement `formatTime(date)` returning `HH:MM` in 24-hour format
    - Implement `formatDate(date)` returning `"DayOfWeek, Month Day, Year"` (e.g. "Monday, January 6, 2025")
    - Implement `init(rootEl)` that starts a `setInterval` updating the DOM every second; make no calls to `StorageService`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.2 Write property tests for GreetingWidget (Properties 1 & 2)
    - **Property 1: Greeting time-range coverage** — arbitrary integer 0–23 → one of the four strings, ranges mutually exclusive
    - **Property 2: Time format correctness** — arbitrary `Date` → `formatTime` matches `/^\d{2}:\d{2}$/` with valid range values
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
    - Tag each with `// Feature: todo-life-dashboard, Property N: <title>`

  - [ ]* 3.3 Write unit tests for GreetingWidget
    - `getGreeting` for each boundary hour: 0, 5, 12, 18, 21, 23
    - `formatTime` for midnight (00:00), noon (12:00), 09:05, 23:59
    - `formatDate` for a known `Date` value
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 4. Checkpoint — ensure StorageService and GreetingWidget tests pass
  - Run `npm test`. Ensure all tests pass; ask the user if questions arise.

- [x] 5. Implement FocusTimer
  - [x] 5.1 Write the `FocusTimer` IIFE module in `js/app.js`
    - Implement `formatDisplay(totalSeconds)` returning zero-padded `MM:SS`
    - Implement `init(rootEl)` querying Start, Stop, and Reset buttons plus the display element
    - Implement `start()`, `stop()`, `reset()` managing a single `setInterval` handle; clamp countdown at 0
    - Apply CSS state classes `timer--idle`, `timer--running`, `timer--paused`, `timer--done` to the root element
    - Clear the interval immediately when the timer reaches 00:00 and enter `timer--done` state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 5.2 Write property test for FocusTimer (Property 3)
    - **Property 3: Timer display format** — arbitrary integer 0–1500 → `formatDisplay` matches `/^\d{2}:\d{2}$/` and decodes back to `totalSeconds`
    - **Validates: Requirements 2.3**
    - Tag with `// Feature: todo-life-dashboard, Property 3: Timer display format`

  - [ ]* 5.3 Write unit tests for FocusTimer
    - `formatDisplay(1500)` → `"25:00"`, `formatDisplay(0)` → `"00:00"`, `formatDisplay(59)` → `"00:59"`, `formatDisplay(60)` → `"01:00"`, `formatDisplay(90)` → `"01:30"`
    - _Requirements: 2.3_

- [x] 6. Implement TaskList
  - [x] 6.1 Write the `TaskList` IIFE module in `js/app.js`
    - Implement `validateName(s)` returning `ValidationResult`; valid iff length is 1–200
    - Implement `addTask(name)` generating a UUID (using `crypto.randomUUID()` with `Date.now().toString(36)` fallback), writing to the in-memory array, and calling `StorageService.save`
    - Implement `editTask(id, name)` mutating only the `name` field and persisting; return `false` without saving if name is empty
    - Implement `toggleComplete(id)` flipping `completed` and persisting
    - Implement `deleteTask(id)` removing the item and persisting
    - Implement `init(rootEl)` loading from `StorageService.load('lifedb_tasks')`, rendering the list, and wiring add/edit/complete/delete event listeners
    - Render completed tasks with strikethrough and 50% opacity via a CSS class
    - Inject inline `<span role="alert">` for validation messages; show/hide without re-creating
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 6.2 Write property tests for TaskList (Properties 4, 5, 6, 7, 8)
    - **Property 4: Task name validation correctness** — arbitrary string → `validateName` returns `valid: true` iff length in [1, 200]
    - **Property 5: Task addition round-trip** — arbitrary valid name → after `addTask`, `load('lifedb_tasks')` contains the task with `completed: false`
    - **Property 6: Task edit preserves identity** — arbitrary task + valid name → `editTask` mutates only `name`, all other fields unchanged, array persisted
    - **Property 7: Task toggle idempotence pair** — arbitrary task → two `toggleComplete` calls restore original `completed` value
    - **Property 8: Task deletion removes exactly one item** — arbitrary non-empty list → `deleteTask` reduces length by 1, target absent
    - **Validates: Requirements 3.1–3.8, 5.2**
    - Tag each with `// Feature: todo-life-dashboard, Property N: <title>`

  - [ ]* 6.3 Write unit tests for TaskList
    - `validateName` for empty string, 1-char, 200-char, 201-char, whitespace-only
    - `addTask` with valid name adds to array; `addTask` with empty name returns `null`
    - `toggleComplete` flips `completed` flag
    - `deleteTask` removes the correct item
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8_

- [ ] 7. Checkpoint — ensure TaskList tests pass
  - Run `npm test`. Ensure all tests pass; ask the user if questions arise.

- [x] 8. Implement QuickLinks
  - [x] 8.1 Write the `QuickLinks` IIFE module in `js/app.js`
    - Implement `validateLabel(label)` — valid iff length 1–50
    - Implement `validateUrl(url)` — valid iff starts with `http://` or `https://` followed by at least one non-whitespace char
    - Implement `addLink(label, url)` — validate both fields, enforce 20-link cap (return `null` if at cap), generate UUID, append to array, persist
    - Implement `deleteLink(id)` removing the item and persisting
    - Implement `openLink(id)` opening the URL in a new tab via `window.open(url, '_blank', 'noopener,noreferrer')`
    - Implement `init(rootEl)` loading from `StorageService.load('lifedb_links')` (treating `null` as empty; showing an error message for corrupted data per Req 4.7), rendering, and wiring event listeners
    - Inject inline `<span role="alert">` elements for validation messages per field
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 8.2 Write property tests for QuickLinks (Properties 9, 10, 11)
    - **Property 9: Quick link validation correctness** — arbitrary strings → `validateLabel`/`validateUrl` agree with stated constraints
    - **Property 10: Quick link addition round-trip** — arbitrary valid label + URL → `load('lifedb_links')` last entry matches
    - **Property 11: Quick link cap enforcement** — full panel (20 entries) + arbitrary valid input → `addLink` returns `null`, count stays 20
    - **Validates: Requirements 4.1, 4.2, 4.5, 4.6**
    - Tag each with `// Feature: todo-life-dashboard, Property N: <title>`

  - [ ]* 8.3 Write unit tests for QuickLinks
    - `validateUrl` for valid `http://` and `https://` URLs, missing scheme, whitespace-only, empty
    - `validateLabel` for empty, 1-char, 50-char, 51-char inputs
    - `addLink` at cap (20) returns `null` without modifying the array
    - `deleteLink` removes the correct item
    - _Requirements: 4.1, 4.2, 4.6_

- [ ] 9. Checkpoint — ensure QuickLinks tests pass
  - Run `npm test`. Ensure all tests pass; ask the user if questions arise.

- [x] 10. Build `index.html` and `css/styles.css`
  - [x] 10.1 Write the `index.html` skeleton
    - Include semantic landmark elements (`<header>`, `<main>`, `<section>`) with `id` attributes matching the DOM selectors expected by each widget's `init(rootEl)` call
    - Add `<script src="js/app.js" defer></script>` and `<link rel="stylesheet" href="css/styles.css">`
    - Add a `<div id="storage-error-banner" role="alert" aria-live="polite" hidden></div>` element for the storage-error banner
    - Ensure every interactive control has an accessible label (`aria-label` or associated `<label>`)
    - _Requirements: 6.1, 6.3, 7.4_

  - [x] 10.2 Write `css/styles.css`
    - Define CSS custom properties for colours and spacing
    - Implement the two-column grid layout for ≥ 768 px and single-column below using a `@media` query
    - Style each widget within a visually distinct card with ≥ 16 px padding/margin on all sides
    - Apply typographic scale: widget headings at least 1.5× body font size
    - Style timer state classes: `timer--idle`, `timer--running`, `timer--paused`, `timer--done`
    - Style completed tasks with `text-decoration: line-through` and `opacity: 0.5`
    - Ensure visible `:focus-visible` indicators on all interactive elements
    - _Requirements: 6.2, 6.4, 6.5, 6.6, 6.7_

- [x] 11. Wire modules together in `js/app.js`
  - [x] 11.1 Write the `DOMContentLoaded` bootstrap in `js/app.js`
    - Call `StorageService.init()`, then `GreetingWidget.init()`, `FocusTimer.init()`, `TaskList.init()`, `QuickLinks.init()` in sequence
    - Add a top-level `lifedb:storage-error` listener on `document` that shows the storage-error banner and auto-dismisses after 5 seconds
    - Call `StorageService.isAvailable()` at init; if `false`, render a browser-support banner naming the missing API (per Req 7.5)
    - _Requirements: 5.3, 5.5, 7.5_

  - [ ]* 11.2 Write integration tests for the bootstrap sequence
    - Stub `StorageService` and verify each widget's `init` is called in order
    - Verify the `lifedb:storage-error` listener appends and auto-dismisses the banner
    - Verify that when `isAvailable()` is `false`, the support banner is rendered
    - _Requirements: 5.3, 5.5, 7.5_

- [x] 12. Final checkpoint — full test suite
  - Run `npm test`. Ensure all tests pass; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The app itself requires no build step — open `index.html` directly in a browser
- Vitest + fast-check are dev dependencies only; `npm test` runs the suite with `vitest --run`
- Property tests use a minimum of 100 iterations per property as specified in the design
- The `jsdom` environment in Vitest allows DOM-dependent module code to be tested in Node

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2", "3.3", "5.1"] },
    { "id": 2, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "8.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "10.1", "10.2"] },
    { "id": 5, "tasks": ["11.1"] },
    { "id": 6, "tasks": ["11.2"] }
  ]
}
```
