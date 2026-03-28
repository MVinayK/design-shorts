# Design Shorts UI Direction

This file defines the intended visual direction for the app so future UI work stays coherent.

## Goal

The app should not feel like generic edtech or a normal card-based mobile app.

It should feel:

- editorial
- premium
- sharp
- intellectually confident
- fast enough to replace passive YouTube consumption

The product is for ambitious engineers. The UI should communicate seriousness, clarity, and depth.

## Core visual identity

Design Shorts should feel like:

- a high-end reading product
- a system design field notebook
- a compact architecture essay interface

Avoid:

- playful startup UI
- loud gamification
- heavy dashboard patterns
- generic component-library look
- “AI app” visual clichés

## Visual principles

### 1. Content first

Most of the screen should belong to reading.

That means:

- minimal chrome
- small number of controls
- no redundant helper text
- no oversized navigation

### 2. Editorial over app-like

The interface should borrow from essays, journals, and print layouts more than consumer social cards.

That means:

- strong title block
- elegant section rhythm
- meaningful whitespace
- restrained but intentional accents

### 3. Sharp, not flashy

Interesting does not mean noisy.

The UI should feel interesting through:

- typography
- composition
- hierarchy
- motion

not through random colors, gradients, or ornament.

## Typography direction

Typography is the single biggest lever for making this app feel premium.

### Recommended font system

Use a two-font system:

- Headings: editorial serif
- Body/UI: modern sans-serif

Recommended heading fonts:

- `Cormorant Garamond`
- `DM Serif Display`
- `Playfair Display`

Recommended body fonts:

- `Inter`
- `Source Sans 3`
- `Manrope`

### Typography roles

- App title: bold, crisp, branded
- Topic title: editorial, compact, high authority
- Summary: readable, slightly elevated from body
- Bullet text: highly legible, restrained
- Expanded article text: warm, serious, essay-like
- Labels/meta: very compact, subtle

### Typography rules

- Titles should be tighter and cleaner than they are now
- Body text should not feel tiny or compressed
- Expanded article text should feel like reading, not like scanning UI labels
- Use contrast in size and weight intentionally

## Color direction

### Base palette

- Base: white
- Structural accent: blue
- Emphasis accent: red
- Support: slate/ink neutrals

### Meaning

- Blue = structure, trust, architecture, clarity
- Red = emphasis, tension, critical insight, important callout
- White = reading space and calm

### Rules

- keep background mostly white
- use blue for navigation, structure, and light surfaces
- use red sparingly for emphasis and critical highlights
- avoid large tinted blocks unless they serve a reading purpose

## Layout direction

### Main feed

The feed should feel like a swipeable reading page, not like a boxed card carousel.

Desired traits:

- full-page surface
- strong title anchor
- compact metadata
- clean summary block
- disciplined bullet rhythm

### Expanded article view

This should feel like a premium long-read mode.

Desired traits:

- stronger typography than the short view
- generous paragraph spacing
- examples and takeaways visually separated
- clear reading rhythm

### Menu and navigation

- menu stays compact
- no bottom nav unless absolutely necessary later
- navigation should stay secondary to reading

## Motion direction

Motion should be minimal but meaningful.

Good motion targets:

- menu open/close
- expand article transition
- subtle state transitions
- gentle page-entry polish

Avoid:

- playful bounces
- constant motion
- gimmicky animations

## What currently makes the UI feel boring

Likely causes:

- typography is still too generic
- title hierarchy is not yet strong enough
- layout is functional but not memorable
- there is not yet a unique signature treatment
- the article mode is useful but not yet visually rich

## Signature ideas to make the app feel distinctive

Pick one or two, not all of them.

### Option A: Editorial notebook

- serif titles
- thin top rule
- subtle chapter markers
- margin-style example blocks

### Option B: Architecture brief

- structured blue dividers
- compact metadata row
- red emphasis marks for key tradeoffs
- more systematic grid feel

### Option C: Premium essay

- stronger serif hierarchy
- refined spacing
- richer paragraph rhythm
- very restrained UI chrome

Recommended direction:

- combine `Editorial notebook` with `Architecture brief`

That gives the app both warmth and technical authority.

## V2 UI refresh plan

### Phase 1: Typography upgrade

- Introduce an editorial serif for titles
- Keep a clean sans-serif for body
- Tighten title/summary/meta hierarchy

### Phase 2: Reading surface polish

- Add a subtle top rule or chapter marker
- Improve spacing rhythm between summary and bullets
- Refine article typography and callouts

### Phase 3: Signature interactions

- polish article expand transition
- improve menu interaction
- add subtle motion on state changes

### Phase 4: Books experience

- build a Books screen that visually matches the editorial identity
- make chapter progression feel like a premium reading product, not a list of files

## Immediate design recommendations

Do these next:

1. Add font pairing: serif headings + sans body
2. Refine expanded article typography
3. Add one signature visual motif such as a chapter rule or margin callout style
4. Reduce generic UI feel in the header/menu
5. Keep every change reading-first

## Rule for future UI changes

Before adding any UI element, ask:

- Does this improve reading?
- Does this improve clarity?
- Does this improve habit-forming appeal?
- Does this feel premium?

If not, do not add it.
