# Design Shorts Execution Plan

This file is the tactical backlog for implementation work.

Use this alongside:

- [PRODUCT_PATH.md](/Users/deepthi/VinayProj/design-shorts/PRODUCT_PATH.md) for strategic direction
- [DESIGN.md](/Users/deepthi/VinayProj/design-shorts/DESIGN.md) for architecture context
- [UI_DIRECTION.md](/Users/deepthi/VinayProj/design-shorts/UI_DIRECTION.md) for visual decisions

## How to use this file

Each task should be:

- concrete
- independently actionable
- testable
- small enough to complete in one focused session when possible

When a task is completed:

- mark it done here
- update [PRODUCT_PATH.md](/Users/deepthi/VinayProj/design-shorts/PRODUCT_PATH.md) if it changes roadmap status
- update [DESIGN.md](/Users/deepthi/VinayProj/design-shorts/DESIGN.md) if it changes architecture or workflow

## Current phase

Current product phase:

- establish a premium Android-first MVP
- deepen principal/staff content quality
- make content remotely extensible
- improve reading experience and habit formation

## Priority 0: Stability and daily usability

### Task 0.1: Verify Android preview install loop

- Status: `done`
- Goal: ensure every important change can be tested with a preview Android build and installed on a phone without friction
- Why it matters: this is the main product testing path right now
- Likely files:
  - [eas.json](/Users/deepthi/VinayProj/design-shorts/eas.json)
  - [.eas/workflows/create-production-builds.yml](/Users/deepthi/VinayProj/design-shorts/.eas/workflows/create-production-builds.yml)
  - [README.md](/Users/deepthi/VinayProj/design-shorts/README.md)
- Acceptance criteria:
  - Android preview build completes successfully
  - installable artifact is downloadable
  - app installs and launches on phone
- Verified result:
  - Latest successful Android preview build: `0abb3060-2d2d-43e1-b58d-bd2f465c86bf`
  - Installable artifact URL: `https://expo.dev/artifacts/eas/2jRKLWGgySgryPNQVjRbbK.apk`
  - Conclusion: `preview` is the correct install/test loop, while `production` remains Play-store-oriented

### Task 0.2: Finalize safe-area/header behavior across web preview and real phone

- Status: `done`
- Goal: ensure title/menu never overlap the status bar or notch area
- Why it matters: first impression and usability
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- Acceptance criteria:
  - header is fully tappable on real Android device
  - browser mobile preview looks acceptably close
- Verified result:
  - header spacing now uses safe-area insets on device and a dedicated mobile-web fallback offset for narrow browser previews
  - feed height is computed from the actual header footprint instead of hardcoded viewport subtraction
  - `npm run typecheck` passed after the layout update

### Task 0.3: Remove remaining low-value UI clutter

- Status: `done`
- Goal: keep chrome minimal so the reading surface dominates
- Why it matters: habit replacement depends on low-friction content consumption
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- Acceptance criteria:
  - no redundant guidance text
  - no unnecessary counters or visual noise
- Verified result:
  - removed the topic-card read-time chip and the empty footer spacer from the main learning surface
  - compressed settings copy and progress text so the app explains itself with less prose
  - `npm run typecheck` passed after the cleanup

## Priority 1: Reading experience quality

### Task 1.1: Real font system integration

- Status: `done`
- Goal: move from platform fallback fonts to an intentional serif/sans pairing
- Why it matters: typography is the highest-leverage visual improvement
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - `assets/fonts/*`
  - Expo font loading setup
- Acceptance criteria:
  - heading font feels editorial
  - body font remains highly readable
  - app loads fonts reliably without visual flash issues
- Verified result:
  - added `@expo-google-fonts/playfair-display` for editorial headings and `@expo-google-fonts/inter` for body and UI text
  - the app now waits for fonts before rendering the main shell, avoiding a visible fallback-font flash
  - `npm run typecheck` passed after the integration

### Task 1.2: Improve short-mode content density

- Status: `done`
- Goal: make the short view feel dense but readable even with principal-level content
- Why it matters: this is the core habit loop
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- Acceptance criteria:
  - no overlapping content
  - short card remains useful in under a minute
  - hierarchy is obvious at a glance
- Verified result:
  - tightened title, summary, and bullet spacing on the main topic card
  - capped short mode to the two highest-signal bullets while keeping full detail in expanded article mode
  - `npm run typecheck` passed after the update

### Task 1.3: Improve article typography and callout rhythm

- Status: `pending`
- Goal: make expanded reading feel like a premium essay view
- Why it matters: expanded mode should deliver real depth, not just more text
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- Acceptance criteria:
  - article view feels visually richer than short mode
  - examples and takeaways are easy to scan
  - long reading feels comfortable

### Task 1.4: Add subtle motion to expand/menu transitions

- Status: `pending`
- Goal: make the interface feel more premium and responsive
- Why it matters: motion contributes to the dopamine/habit loop
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- Acceptance criteria:
  - menu transition feels intentional
  - article expand feels smooth
  - no distracting animation

## Priority 2: Content platform growth

### Task 2.1: Add DDIA Chapter 2

- Status: `done`
- Goal: integrate Chapter 2 using the modular catalog/book/chapter structure
- Why it matters: validates the new content architecture
- Likely files:
  - [src/content/catalog.json](/Users/deepthi/VinayProj/design-shorts/src/content/catalog.json)
  - [src/content/books/ddia/book.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/book.json)
  - `src/content/books/ddia/chapters/chapter-02.json`
- Acceptance criteria:
  - chapter appears in remote/bundled content flow
  - topics merge into the feed correctly
  - no reinstall required when remote content path is used
- Verified result:
  - added [chapter-02.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/chapters/chapter-02.json) with 6 principal-level DDIA topics
  - updated [catalog.json](/Users/deepthi/VinayProj/design-shorts/src/content/catalog.json) and [book.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/book.json) to include the new chapter and bump DDIA content versioning
  - `npm run typecheck` passed after the content integration

### Task 2.1b: Add DDIA Chapter 3

- Status: `done`
- Goal: integrate Chapter 3 using the modular catalog/book/chapter structure
- Why it matters: deepens the DDIA track with storage-engine and indexing tradeoff content that is central to principal-level system design
- Likely files:
  - [src/content/catalog.json](/Users/deepthi/VinayProj/design-shorts/src/content/catalog.json)
  - [src/content/books/ddia/book.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/book.json)
  - `src/content/books/ddia/chapters/chapter-03.json`
- Acceptance criteria:
  - chapter appears in remote/bundled content flow
  - topics merge into the feed correctly
  - no reinstall required when remote content path is used
- Verified result:
  - added [chapter-03.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/chapters/chapter-03.json) with 6 principal-level DDIA topics
  - updated [catalog.json](/Users/deepthi/VinayProj/design-shorts/src/content/catalog.json) and [book.json](/Users/deepthi/VinayProj/design-shorts/src/content/books/ddia/book.json) to include the new chapter and bump DDIA content versioning
  - `npm run typecheck` passed after the content integration

### Task 2.2: Add chapter freshness/version visibility in settings

- Status: `pending`
- Goal: show users whether content is bundled, cached, or refreshed
- Why it matters: helps debug content rollout and user trust
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - [src/lib/contentRepository.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/contentRepository.ts)
- Acceptance criteria:
  - settings shows current content source or freshness
  - remote refresh state is understandable

### Task 2.3: Define chapter import workflow template

- Status: `pending`
- Goal: make chapter addition repeatable for future AI-assisted content generation
- Why it matters: content velocity should not depend on manual reinvention
- Likely files:
  - [DESIGN.md](/Users/deepthi/VinayProj/design-shorts/DESIGN.md)
  - [README.md](/Users/deepthi/VinayProj/design-shorts/README.md)
- Acceptance criteria:
  - clear chapter JSON schema example
  - clear checklist for adding a new chapter

## Priority 3: Product differentiation

### Task 3.1: Build Books screen

- Status: `pending`
- Goal: expose books as a first-class object instead of only merging everything into the feed
- Why it matters: supports deliberate learning and future product depth
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - content repository and types
- Acceptance criteria:
  - user can see available books
  - user can enter a book context intentionally

### Task 3.2: Build Chapter progression view

- Status: `pending`
- Goal: let users move through a book chapter by chapter
- Why it matters: important for deep-study mode
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - content repository and types
- Acceptance criteria:
  - user can see chapters in order
  - chapter selection drives feed/article context

### Task 3.3: Add lightweight recall prompt after expanded reading

- Status: `pending`
- Goal: begin converting reading into retained architecture language
- Why it matters: this is what can make the app more valuable than passive content
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - topic content schema later if needed
- Acceptance criteria:
  - one simple recall interaction appears after expanded reading
  - it does not feel like heavy quiz UX

### Task 3.4: Add compare-mode topics

- Status: `pending`
- Goal: teach architectural judgment using comparisons such as queue vs log or cache vs materialized view
- Why it matters: principal interviews reward tradeoff articulation more than isolated definitions
- Likely files:
  - content files under [src/content](/Users/deepthi/VinayProj/design-shorts/src/content)
- Acceptance criteria:
  - at least one compare-style content unit is supported
  - compare content feels distinct from normal topic cards

## Priority 4: Habit loop

### Task 4.1: Daily focus session

- Status: `pending`
- Goal: create a lightweight “today’s sharp set” of a few high-value topics
- Why it matters: better replacement for random video consumption
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - content selection logic
- Acceptance criteria:
  - user can quickly enter a short deliberate session
  - daily set feels curated rather than random

### Task 4.2: Weak-area revisit logic

- Status: `pending`
- Goal: revisit concepts based on reading behavior and expansion patterns
- Why it matters: habit should improve judgment, not just consumption count
- Likely files:
  - [src/lib/feed.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/feed.ts)
  - [src/lib/storage.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/storage.ts)
- Acceptance criteria:
  - revisit selection is visibly smarter than simple unread/read weighting

### Task 4.3: Streaks without cheap gamification

- Status: `pending`
- Goal: add motivation without making the app feel childish
- Why it matters: supports retention while preserving the premium tone
- Likely files:
  - [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
  - local persistence
- Acceptance criteria:
  - streaks exist
  - they do not dominate the interface

## Suggested next implementation order

Work in this order:

1. Task 0.1
2. Task 1.1
3. Task 1.2
4. Task 2.1
5. Task 3.1
6. Task 3.2
7. Task 3.3

## Definition of done

A task should be considered done only if:

- code is implemented
- typecheck passes
- docs are updated if needed
- related checklist status is updated here
- architecture notes are updated if the change affects future work
