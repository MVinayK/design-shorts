import type { Preferences, Topic } from '../types';

export function getTopicStatus(topicId: string, progressMap: Record<string, string>) {
  return progressMap[topicId] === 'read' ? 'read' : 'unread';
}

export function getSerialStartIndex(
  topics: Topic[],
  progressMap: Record<string, string>,
  resumeCheckpointTopicId: string | null,
) {
  if (resumeCheckpointTopicId) {
    const rememberedIndex = topics.findIndex((topic) => topic.id === resumeCheckpointTopicId);
    if (rememberedIndex >= 0) {
      return rememberedIndex;
    }
  }

  const nextUnreadIndex = topics.findIndex((topic) => getTopicStatus(topic.id, progressMap) === 'unread');
  return nextUnreadIndex >= 0 ? nextUnreadIndex : 0;
}

export function getTopicProgressSummary(topics: Topic[], progressMap: Record<string, string>) {
  const readCount = topics.filter((topic) => getTopicStatus(topic.id, progressMap) === 'read').length;
  return {
    readCount,
    totalCount: topics.length,
  };
}

function pickRandomTopic(topics: Topic[]) {
  return topics[Math.floor(Math.random() * topics.length)];
}

export function createRandomDeck(
  topics: Topic[],
  progressMap: Record<string, string>,
  size: number,
  randomWeightUnread: Preferences['randomWeightUnread'],
) {
  const unreadTopics = topics.filter((topic) => getTopicStatus(topic.id, progressMap) === 'unread');
  const readTopics = topics.filter((topic) => getTopicStatus(topic.id, progressMap) === 'read');
  const weightedDeck: Topic[] = [];

  for (let index = 0; index < size; index += 1) {
    const preferUnread = Math.random() < randomWeightUnread;
    const preferredPool = preferUnread && unreadTopics.length > 0 ? unreadTopics : readTopics;
    const fallbackPool = preferUnread ? readTopics : unreadTopics;
    const selectedPool = preferredPool.length > 0 ? preferredPool : fallbackPool;

    if (selectedPool.length === 0) {
      break;
    }

    let nextTopic = pickRandomTopic(selectedPool);
    const previousTopic = weightedDeck[weightedDeck.length - 1];

    if (selectedPool.length > 1 && previousTopic?.id === nextTopic.id) {
      while (previousTopic.id === nextTopic.id) {
        nextTopic = pickRandomTopic(selectedPool);
      }
    }

    weightedDeck.push(nextTopic);
  }

  return weightedDeck.length > 0 ? weightedDeck : topics;
}
