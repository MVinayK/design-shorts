import type { ContentBook, Topic, TopicStatus } from '../types';

export type CelebrationState = {
  title: string;
  body: string;
  tone: 'topic' | 'chapter';
};

export function getChapterLabel(chapterId: string) {
  const match = chapterId.match(/chapter-(\d+)/i);
  return match ? `Chapter ${Number.parseInt(match[1], 10)}` : chapterId.replace(/-/g, ' ');
}

export function getBookLabel(bookId: string) {
  if (bookId === 'ddia') {
    return 'DDIA';
  }

  return bookId.toUpperCase();
}

export function getScopeSummary(books: ContentBook[], bookId: string | null, chapterId: string | null) {
  if (!bookId) {
    return null;
  }

  const book = books.find((candidate) => candidate.id === bookId);
  if (!book) {
    return chapterId ? `${getBookLabel(bookId)} · ${getChapterLabel(chapterId)}` : getBookLabel(bookId);
  }

  if (!chapterId) {
    return book.title;
  }

  const chapter = book.chapters.find((candidate) => candidate.id === chapterId);
  return `${book.title} · ${chapter?.title ?? getChapterLabel(chapterId)}`;
}

export function getCelebrationState(
  topic: Topic,
  topics: Topic[],
  nextProgressMap: Record<string, TopicStatus>,
): CelebrationState {
  const chapterTopics = topics.filter(
    (candidate) => candidate.bookId === topic.bookId && candidate.chapterId === topic.chapterId,
  );
  const isChapterComplete = chapterTopics.every((candidate) => nextProgressMap[candidate.id] === 'read');

  if (isChapterComplete) {
    return {
      title: 'Chapter clear',
      body: `${getChapterLabel(topic.chapterId)} is locked in. Nice run.`,
      tone: 'chapter',
    };
  }

  const options = [
    {
      title: 'Sharp.',
      body: 'One more idea moved from scrolling to recall.',
    },
    {
      title: 'Locked in.',
      body: 'That tradeoff is now part of your interview language.',
    },
    {
      title: 'Good one.',
      body: 'Tiny reps like this build serious systems instinct.',
    },
  ];

  const pick = options[Math.abs(topic.orderIndex) % options.length];
  return {
    ...pick,
    tone: 'topic',
  };
}
