import type { NewsDigest } from '../types';

export const BUNDLED_NEWS_DIGEST: NewsDigest = {
  generatedAt: '2026-03-28T06:30:00.000Z',
  items: [
    {
      id: 'open-source-ai-agents',
      title: 'Open-source agent frameworks keep converging on durable workflows',
      sourceName: 'InfoQ',
      sourceUrl: 'https://www.infoq.com/',
      publishedAt: '2026-03-27T12:30:00.000Z',
      summaryShort:
        'Agent tooling is moving from demo loops toward durable task execution, retries, and observability. The interesting shift is less about raw model quality and more about workflow reliability.',
      tags: ['AI', 'Agents', 'Platforms'],
    },
    {
      id: 'database-startup-storage',
      title: 'Cloud database vendors push colder storage tiers for cost control',
      sourceName: 'TechCrunch',
      sourceUrl: 'https://techcrunch.com/',
      publishedAt: '2026-03-27T09:15:00.000Z',
      summaryShort:
        'Database platforms are emphasizing tiered storage and smarter archival as buyers pressure infra bills. The design lesson is that scale stories now need a cost story too.',
      tags: ['Databases', 'Cloud', 'Cost'],
    },
    {
      id: 'edge-runtime-news',
      title: 'Edge runtimes are adding more stateful patterns without pretending to be full databases',
      sourceName: 'The New Stack',
      sourceUrl: 'https://thenewstack.io/',
      publishedAt: '2026-03-26T18:00:00.000Z',
      summaryShort:
        'Edge platforms are expanding queues, caches, and durable objects to reduce round trips. The architectural pattern is clear: put coordination near users, keep core truth in primary data stores.',
      tags: ['Edge', 'Caching', 'Architecture'],
    },
  ],
};
