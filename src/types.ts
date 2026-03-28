export type Topic = {
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
};

export type ChapterTopic = Omit<Topic, 'bookId' | 'chapterId'>;

export type CatalogChapterEntry = {
  id: string;
  title: string;
  path: string;
  version: number;
  topicCount: number;
  orderIndex: number;
};

export type CatalogBookEntry = {
  id: string;
  title: string;
  path: string;
  version: number;
  chapters: CatalogChapterEntry[];
};

export type ContentCatalog = {
  version: number;
  books: CatalogBookEntry[];
};

export type BookManifest = {
  id: string;
  title: string;
  author: string;
  description: string;
  version: number;
  chapters: CatalogChapterEntry[];
};

export type ChapterContent = {
  bookId: string;
  chapterId: string;
  title: string;
  orderIndex: number;
  version: number;
  topics: ChapterTopic[];
};

export type ContentBook = BookManifest & {
  chapterCount: number;
};

export type TopicFeed = {
  catalog: ContentCatalog;
  books: ContentBook[];
  topics: Topic[];
  source: 'bundled' | 'cache' | 'remote';
};

export type ContentSyncMetadata = {
  catalogVersion: number | null;
  lastAttemptedSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  source: TopicFeed['source'];
};

export type TopicFeedSyncResult = {
  feed: TopicFeed;
  metadata: ContentSyncMetadata;
  didRefresh: boolean;
};

export type TopicStatus = 'read' | 'unread';

export type ProgressRecord = {
  topicId: string;
  status: TopicStatus;
  markedReadAt: string;
  lastSeenAt: string;
};

export type Preferences = {
  feedMode: 'serial' | 'random';
  randomWeightRead: number;
  randomWeightUnread: number;
  resumeCheckpointTopicId: string | null;
};

export type NewsCard = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  summaryShort: string;
  tags: string[];
};

export type NewsDigest = {
  generatedAt: string | null;
  items: NewsCard[];
};

export type FeedTab = 'learn' | 'library' | 'news' | 'settings';
