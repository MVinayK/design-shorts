export type Topic = {
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

export type FeedTab = 'learn' | 'news' | 'settings';
