import bundledBookManifest from '../content/books/ddia/book.json';
import bundledChapterOne from '../content/books/ddia/chapters/chapter-01.json';
import bundledChapterTwo from '../content/books/ddia/chapters/chapter-02.json';
import bundledChapterThree from '../content/books/ddia/chapters/chapter-03.json';
import bundledChapterFour from '../content/books/ddia/chapters/chapter-04.json';
import bundledCatalog from '../content/catalog.json';
import { assembleTopicFeed } from '../lib/contentAssembler';
import type { BookManifest, ChapterContent, ContentCatalog, TopicFeed } from '../types';

export const BUNDLED_CATALOG = bundledCatalog as ContentCatalog;
export const BUNDLED_BOOK_MANIFESTS: BookManifest[] = [bundledBookManifest as BookManifest];
export const BUNDLED_CHAPTERS: ChapterContent[] = [
  bundledChapterOne as ChapterContent,
  bundledChapterTwo as ChapterContent,
  bundledChapterThree as ChapterContent,
  bundledChapterFour as ChapterContent,
];

export const BUNDLED_TOPIC_FEED: TopicFeed = assembleTopicFeed(
  BUNDLED_CATALOG,
  BUNDLED_BOOK_MANIFESTS,
  BUNDLED_CHAPTERS,
  'bundled',
);
