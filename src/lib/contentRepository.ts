import { BUNDLED_BOOK_MANIFESTS, BUNDLED_CATALOG, BUNDLED_CHAPTERS, BUNDLED_TOPIC_FEED } from '../data/bundledContent';
import { assembleTopicFeed } from './contentAssembler';
import { getCachedContentDocument, saveCachedContentDocument } from './storage';
import type { BookManifest, ChapterContent, ContentCatalog, TopicFeed } from '../types';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const REMOTE_CONTENT_BASE_URL =
  process?.env?.EXPO_PUBLIC_CONTENT_BASE_URL ??
  'https://raw.githubusercontent.com/MVinayK/design-shorts/main/src/content';

function buildRemoteUrl(path: string) {
  return `${REMOTE_CONTENT_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function parseDocument<TDocument>(rawValue: string) {
  return JSON.parse(rawValue) as TDocument;
}

async function fetchRemoteDocument<TDocument>(path: string) {
  const response = await fetch(buildRemoteUrl(path));

  if (!response.ok) {
    throw new Error(`Unable to fetch remote content document: ${path}`);
  }

  const payload = await response.text();
  await saveCachedContentDocument(path, payload);

  return parseDocument<TDocument>(payload);
}

async function readCachedDocument<TDocument>(path: string) {
  const cached = await getCachedContentDocument(path);
  return cached ? parseDocument<TDocument>(cached) : null;
}

async function loadCachedTopicFeed(): Promise<TopicFeed | null> {
  const cachedCatalog = await readCachedDocument<ContentCatalog>('catalog.json');

  if (!cachedCatalog) {
    return null;
  }

  const bookDocuments = await Promise.all(
    cachedCatalog.books.map((book) => readCachedDocument<BookManifest>(book.path)),
  );
  const chapterDocuments = await Promise.all(
    cachedCatalog.books.flatMap((book) => book.chapters.map((chapter) => readCachedDocument<ChapterContent>(chapter.path))),
  );

  if (bookDocuments.some((book) => book === null) || chapterDocuments.some((chapter) => chapter === null)) {
    return null;
  }

  return assembleTopicFeed(
    cachedCatalog,
    bookDocuments as BookManifest[],
    chapterDocuments as ChapterContent[],
    'cache',
  );
}

export async function loadTopicFeed() {
  const cachedFeed = await loadCachedTopicFeed();
  return cachedFeed ?? BUNDLED_TOPIC_FEED;
}

export async function refreshTopicFeed() {
  if (!REMOTE_CONTENT_BASE_URL.startsWith('http')) {
    throw new Error('The remote content base URL is not configured.');
  }

  const catalog = await fetchRemoteDocument<ContentCatalog>('catalog.json');
  const [books, chapters] = await Promise.all([
    Promise.all(catalog.books.map((book) => fetchRemoteDocument<BookManifest>(book.path))),
    Promise.all(
      catalog.books.flatMap((book) =>
        book.chapters.map((chapter) => fetchRemoteDocument<ChapterContent>(chapter.path)),
      ),
    ),
  ]);

  return assembleTopicFeed(catalog, books, chapters, 'remote');
}

export function getBundledTopicFeed() {
  return BUNDLED_TOPIC_FEED;
}

export function getBundledContentFiles() {
  return {
    catalog: BUNDLED_CATALOG,
    books: BUNDLED_BOOK_MANIFESTS,
    chapters: BUNDLED_CHAPTERS,
  };
}
