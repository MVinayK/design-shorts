import type {
  BookManifest,
  ChapterContent,
  ContentBook,
  ContentCatalog,
  Topic,
  TopicFeed,
} from '../types';

export function assembleTopicFeed(
  catalog: ContentCatalog,
  bookManifests: BookManifest[],
  chapterContents: ChapterContent[],
  source: TopicFeed['source'],
): TopicFeed {
  const bookManifestMap = new Map(bookManifests.map((book) => [book.id, book]));
  const chapterMap = new Map(chapterContents.map((chapter) => [`${chapter.bookId}:${chapter.chapterId}`, chapter]));
  const books: ContentBook[] = [];
  const topics: Topic[] = [];
  let globalOrderIndex = 1;

  for (const catalogBook of catalog.books) {
    const manifest = bookManifestMap.get(catalogBook.id);

    if (!manifest) {
      continue;
    }

    books.push({
      ...manifest,
      chapterCount: manifest.chapters.length,
    });

    const orderedChapters = [...catalogBook.chapters].sort((left, right) => left.orderIndex - right.orderIndex);

    for (const chapterEntry of orderedChapters) {
      const chapter = chapterMap.get(`${catalogBook.id}:${chapterEntry.id}`);

      if (!chapter) {
        continue;
      }

      const orderedTopics = [...chapter.topics].sort((left, right) => left.orderIndex - right.orderIndex);

      for (const topic of orderedTopics) {
        topics.push({
          ...topic,
          bookId: chapter.bookId,
          chapterId: chapter.chapterId,
          orderIndex: globalOrderIndex,
        });
        globalOrderIndex += 1;
      }
    }
  }

  return {
    catalog,
    books,
    topics,
    source,
  };
}
