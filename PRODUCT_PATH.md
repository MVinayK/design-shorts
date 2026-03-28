# Design Shorts Product Path

This file tracks the intended product direction and progress so future contributors can continue without reconstructing strategy from chat history.

## Product thesis

Design Shorts should help experienced engineers replace passive system design consumption with high-frequency, high-density architecture conditioning.

The app is not meant to be generic edtech. It should help users:

- build principal/staff-level architecture language
- sharpen tradeoff reasoning
- improve recall under interview pressure
- form a better daily learning habit than YouTube or random content browsing

## Core product promise

- `3 minutes` should deliver one real architecture insight
- `10 minutes` should create a reusable interview narrative
- repeated usage should improve how users frame ambiguous design problems

## Target user

Primary:

- senior engineers preparing for staff/principal interviews at Google, Meta, Amazon, or similar companies

Secondary:

- mid-level engineers growing toward senior/staff system design depth

## Product pillars

### 1. Short to depth

The app should move a user through:

- short-form topic card
- expanded article
- later: recall prompt / reinforcement

Why:

- short form builds habit
- expanded view builds understanding
- recall builds retention

### 2. Tradeoff-first content

Every topic should answer:

- what problem this solves
- where it breaks
- what it costs
- what changes at scale
- how a principal engineer would frame it

### 3. Architecture language training

The content should help users speak in architecture-review language, not just recognize concepts.

Examples:

- identifying bottlenecks
- defining failure domains
- separating control plane and data plane concerns
- reasoning about consistency, operability, and scaling tradeoffs

### 4. Focus loops over endless feed

The feed is useful for habit formation, but the long-term product should also guide:

- chapter progression
- book progression
- weak-area revisit
- deliberate focus sessions

### 5. Dopamine with intellectual reward

The product should feel:

- fast
- elegant
- rewarding
- cognitively sharp

The reward loop should be:

- one swipe
- one useful insight
- one feeling of sharpening, not passive consumption

## Roadmap

### Foundation

- [x] Swipe-based learning feed
- [x] Expandable article mode
- [x] White-first visual design
- [x] Intentional serif/sans font system
- [x] Top-right menu navigation
- [x] Safe-area-aware header handling
- [x] Tech news feed

### Content platform

- [x] Modular content architecture: catalog -> book -> chapter
- [x] Bundled fallback + cached + remote content loading
- [x] DDIA Chapter 1 integrated
- [x] DDIA Chapter 2
- [ ] DDIA Chapter 3+
- [ ] Content freshness/version indicator in app

### Principal/staff depth

- [x] Principal-level Chapter 1 tone established
- [ ] All topics rewritten to tradeoff-first framing
- [ ] Add compare/contrast topic sets
- [ ] Add architecture-review style prompts
- [ ] Add “how a principal engineer would answer” content modules

### Habit replacement

- [x] Fast open-and-swipe experience
- [ ] Daily focus loop
- [ ] Session streaks
- [ ] Smart revisit of weak topics
- [ ] Frictionless return-to-learning flow

### Book experience

- [x] Data model supports books and chapters
- [ ] Book listing screen
- [ ] Chapter progression screen
- [ ] Continue-reading by book
- [ ] Book-specific focus mode

### Reinforcement layer

- [ ] 1-question recall after article expansion
- [ ] Tradeoff flashcards
- [ ] “What would you optimize first?” quick prompts
- [ ] Interview articulation drills

### Deployment

- [x] Android preview build flow
- [x] Android production workflow on EAS
- [x] Architecture handoff docs
- [ ] Stable Play internal testing loop
- [ ] iOS build recovery

## Current priorities

Do next:

1. Add DDIA Chapter 2 using the modular chapter format
2. Improve short-mode density so principal-level content stays readable without overlap
3. Add a simple Books screen using the existing catalog/book/chapter model
4. Add one lightweight reinforcement mechanic after expanded reading

## Progress update rule

When a feature is completed:

- update the checkbox in this file
- add any important implementation note to [DESIGN.md](/Users/deepthi/VinayProj/design-shorts/DESIGN.md) if it affects architecture or workflow

This file is the product-direction tracker.
`DESIGN.md` is the implementation/context handoff.
