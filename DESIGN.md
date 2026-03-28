# Design Shorts Architecture Guide

This document is the fast handoff for future contributors and AI agents. Read this first before changing product behavior, content flow, or build/release setup.

## Product summary

Design Shorts is a mobile-first system design learning app with:

- swipe-based short-form topic consumption
- expandable article view for deeper reading
- separate tech news feed
- local-first progress and settings
- modular remote content sync so new chapters can be added without forcing users to reinstall the app

Current content direction:

- audience is moving from junior/intermediate level toward senior/principal engineer level
- content is being curated book-by-book
- the first book in progress is `Designing Data-Intensive Applications`
- Chapter 1 is already integrated
- Chapter 2 is now integrated with the modular chapter flow

## Current UX

Main app behavior:

- `Learn` feed is the default experience
- user swipes horizontally through topics
- each topic has short content on the main page
- tapping the `+` icon opens a full-screen expanded article view
- `News` is a separate feed
- `Settings` controls feed mode and digest refresh

Important UI decisions already made:

- white-first visual design
- blue/red accents only
- top-right menu instead of bottom nav
- header safe-area handling for phones, including a mobile-web fallback for narrow browser previews
- Playfair Display headings and Inter body/UI fonts loaded through Expo font packages
- progress text like `1/6` removed from the main surface
- swipe hint removed from main surface

## Architecture overview

The app is intentionally split into:

- app shell and UI
- content loading/repository layer
- local persistence
- remote news pipeline
- EAS mobile build/release workflow

Key files:

- [App.tsx](/Users/deepthi/VinayProj/design-shorts/App.tsx)
- [src/types.ts](/Users/deepthi/VinayProj/design-shorts/src/types.ts)
- [src/lib/contentRepository.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/contentRepository.ts)
- [src/lib/contentAssembler.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/contentAssembler.ts)
- [src/lib/storage.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/storage.ts)
- [src/lib/newsRepository.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/newsRepository.ts)

## Content system

The old single `topics.ts` model has been removed. Content is now modular.

Content file structure:

```text
src/content/
  catalog.json
  books/
    ddia/
      book.json
      chapters/
        chapter-01.json
```

Purpose of each file:

- `catalog.json`
  - global manifest
  - available books
  - chapter paths
  - versions and ordering
- `book.json`
  - book metadata
  - author, description, chapter list
- `chapter-xx.json`
  - actual topic payloads for that chapter

Why this exists:

- avoids one massive content file
- keeps chapter editing manageable
- supports parallel fetches
- supports granular caching
- supports future `Books` and `Chapters` product features

How content is loaded:

1. bundled fallback content is loaded first
2. cached remote content is used if available
3. the app checks the remote catalog when the last successful sync is older than one hour
4. full remote chapter files are fetched only when the catalog version changes
5. chapter files are merged locally into a single feed

This means:

- app installs stay stable
- new chapters can be added remotely
- users do not need a reinstall for new knowledge content
- settings exposes catalog version and last successful content sync time

## Topic schema

Each topic currently follows this shape:

```ts
{
  bookId: string;
  chapterId: string;
  id: string;
  slug: string;
  title: string;
  summaryShort: string;
  keyPoints: string[];
  articleSections: string[];
  example: string;
  interviewTakeaway: string;
  category: string;
  orderIndex: number;
  estimatedReadTime: number;
}
```

Guidance:

- `summaryShort` is the short-mode content
- `articleSections` powers the expanded full-screen article
- keep short-mode concise and article-mode richer
- current quality target is principal-engineer level, not beginner tutorial level

## Content writing workflow

Current workflow is intentionally externalized to reduce token usage in chat:

1. choose one chapter
2. generate topic content outside the app, for example with Gemini
3. paste the generated JSON back into the repo
4. integrate it into the correct chapter file
5. update `catalog.json` and `book.json` as needed

Recommended content policy:

- one chapter at a time
- usually 5-6 topics per chapter
- avoid generic textbook phrasing
- focus on tradeoffs, failure modes, operational consequences, and architecture-review quality reasoning

## News system

News is separate from book content.

Current shape:

- generated static digest in [public/news.json](/Users/deepthi/VinayProj/design-shorts/public/news.json)
- fetched and cached by [src/lib/newsRepository.ts](/Users/deepthi/VinayProj/design-shorts/src/lib/newsRepository.ts)
- generated by [scripts/generate-news-digest.mjs](/Users/deepthi/VinayProj/design-shorts/scripts/generate-news-digest.mjs)
- refreshed by GitHub Actions

## Environment variables

Defined in [.env.example](/Users/deepthi/VinayProj/design-shorts/.env.example):

- `EXPO_PUBLIC_NEWS_DIGEST_URL`
- `EXPO_PUBLIC_CONTENT_BASE_URL`

Recommended values today:

- `EXPO_PUBLIC_NEWS_DIGEST_URL=https://raw.githubusercontent.com/MVinayK/design-shorts/main/public/news.json`
- `EXPO_PUBLIC_CONTENT_BASE_URL=https://raw.githubusercontent.com/MVinayK/design-shorts/main/src/content`

## Build and install guide

### Local run

```bash
npm install
cp .env.example .env
npm start
```

### Android preview build

Use this when you want an installable build for your phone:

```bash
npx eas build --platform android --profile preview
```

Important:

- `preview` is the correct profile for direct install testing
- this should give you an installable Android artifact
- use this for phone testing

Most recently verified successful preview build:

- Build ID: `0abb3060-2d2d-43e1-b58d-bd2f465c86bf`
- APK URL: `https://expo.dev/artifacts/eas/2jRKLWGgySgryPNQVjRbbK.apk`

### Android production build

Use this when you want Play Store output:

```bash
npx eas build --platform android --profile production
```

Important:

- `production` gives an `.aab`
- `.aab` is for Google Play upload
- it is not meant for direct phone installation

### APK / installable build download

After running an Android preview build:

1. open the Expo build page
2. wait for build success
3. download the Android installable artifact from that page
4. open it on your phone
5. allow install from unknown source if Android asks
6. install the app

If the file is an `.aab`, that is a Play Store bundle, not a direct install artifact.

### Play Store path

If you want to install from Play Store instead of direct APK install:

- upload the `.aab` to Google Play internal testing
- add yourself as a tester
- install from the Play testing link

### iOS status

iOS is currently deprioritized because it was failing.

Current decision:

- Android is the active release target
- the automatic EAS production workflow is Android-only for now

## EAS workflow status

Workflow file:

- [.eas/workflows/create-production-builds.yml](/Users/deepthi/VinayProj/design-shorts/.eas/workflows/create-production-builds.yml)

Current behavior:

- triggers on push to `main`
- runs Android production build only
- iOS job was intentionally removed for now

## SOLID / maintainability intent

The current refactor is meant to keep the codebase maintainable as content grows.

Examples:

- content loading is separated from UI
- content assembly is separated from persistence
- storage is isolated in its own module
- bundled fallback content is separate from repository logic
- chapter files are independent and easy to extend

When adding features, keep following this pattern:

- avoid putting content logic directly into `App.tsx`
- avoid a single giant JSON file
- prefer small focused modules
- prefer explicit data contracts in `src/types.ts`

## Suggested next steps

High-value next features:

1. Add Chapter 2 using the same modular chapter file pattern
2. Add a `Books` view on top of the current catalog/book/chapter model
3. Add content freshness/version display in settings
4. Add chapter-level download/cache controls later if needed
5. Improve expanded article typography and editorial layout

## Quick context summary

If you only read one thing:

- this is an Expo React Native app
- Android is the active deployment target
- content is now modular and remotely syncable
- DDIA Chapter 1 is the first principal-level content set
- future work should extend the catalog/book/chapter structure, not reintroduce a monolithic content file
