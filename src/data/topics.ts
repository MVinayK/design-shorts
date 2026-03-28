import type { Topic } from '../types';

export const TOPICS: Topic[] = [
  {
    id: 'caching-basics',
    slug: 'caching-basics',
    title: 'Caching in one screen',
    summaryShort:
      'Caching stores expensive-to-compute or expensive-to-fetch data closer to the user so the next read is faster and cheaper.',
    keyPoints: [
      'Use cache when reads dominate writes and stale data is acceptable for a short time.',
      'Think in cache-aside, write-through, and write-back patterns depending on correctness needs.',
      'The real tradeoff is speed versus freshness, not just speed versus storage.',
    ],
    category: 'Caching',
    orderIndex: 1,
    estimatedReadTime: 2,
  },
  {
    id: 'database-indexing',
    slug: 'database-indexing',
    title: 'Indexing without the mystery',
    summaryShort:
      'An index is an extra data structure that helps the database find rows quickly without scanning the whole table.',
    keyPoints: [
      'Indexes improve read latency but cost memory and make writes slower.',
      'Choose indexes from query patterns, not from the schema alone.',
      'Composite index order matters because databases use the left-most prefix efficiently.',
    ],
    category: 'Databases',
    orderIndex: 2,
    estimatedReadTime: 2,
  },
  {
    id: 'transactions',
    slug: 'transactions',
    title: 'Transactions and ACID',
    summaryShort:
      'Transactions group multiple operations into one logical unit so partial failure does not leave your data in a broken state.',
    keyPoints: [
      'Atomicity and consistency protect correctness during failure and concurrency.',
      'Isolation levels trade strict correctness for throughput and latency.',
      'Distributed transactions are expensive, so many systems prefer compensation and idempotency instead.',
    ],
    category: 'Consistency',
    orderIndex: 3,
    estimatedReadTime: 3,
  },
  {
    id: 'load-balancing',
    slug: 'load-balancing',
    title: 'Load balancing for calm systems',
    summaryShort:
      'A load balancer spreads incoming traffic across instances so no single server becomes the bottleneck or single point of failure.',
    keyPoints: [
      'Round-robin is simple, but least-connections or latency-aware routing can fit bursty systems better.',
      'Health checks matter as much as balancing strategy because bad routing breaks availability.',
      'Sticky sessions simplify some apps but reduce balancing flexibility.',
    ],
    category: 'Traffic',
    orderIndex: 4,
    estimatedReadTime: 2,
  },
  {
    id: 'sharding',
    slug: 'sharding',
    title: 'Sharding when one database is not enough',
    summaryShort:
      'Sharding splits data across multiple databases so storage and write throughput scale beyond a single machine.',
    keyPoints: [
      'Pick shard keys from access patterns because bad keys create hot partitions.',
      'Cross-shard joins and transactions become painful fast.',
      'Sharding solves scale but adds operational complexity, rebalancing, and debugging cost.',
    ],
    category: 'Scalability',
    orderIndex: 5,
    estimatedReadTime: 3,
  },
  {
    id: 'replication',
    slug: 'replication',
    title: 'Replication for availability',
    summaryShort:
      'Replication keeps copies of data on multiple nodes so the system survives failures and can often serve more reads.',
    keyPoints: [
      'Leader-follower replication is common because it simplifies write coordination.',
      'Read replicas help scale reads but can expose replication lag.',
      'Synchronous replication improves durability but increases write latency.',
    ],
    category: 'Reliability',
    orderIndex: 6,
    estimatedReadTime: 2,
  },
  {
    id: 'rate-limiting',
    slug: 'rate-limiting',
    title: 'Rate limiting in practical terms',
    summaryShort:
      'Rate limiting protects systems from abuse and overload by controlling how much a client can do over time.',
    keyPoints: [
      'Token bucket handles bursts better than fixed window in many APIs.',
      'Good limits protect shared resources without punishing normal traffic.',
      'You need clear headers or errors so clients know how to back off.',
    ],
    category: 'Protection',
    orderIndex: 7,
    estimatedReadTime: 2,
  },
  {
    id: 'queues-and-pubsub',
    slug: 'queues-and-pubsub',
    title: 'Queues and pub-sub',
    summaryShort:
      'Queues decouple producers from consumers, while pub-sub fans events out to multiple interested consumers.',
    keyPoints: [
      'Queues smooth spikes and let slow work happen asynchronously.',
      'Pub-sub is great for event-driven systems but needs idempotent consumers.',
      'At-least-once delivery means duplicate processing is not a bug, it is the default assumption.',
    ],
    category: 'Async Systems',
    orderIndex: 8,
    estimatedReadTime: 3,
  },
  {
    id: 'cdn',
    slug: 'cdn',
    title: 'CDN for global performance',
    summaryShort:
      'A CDN moves static and cacheable content closer to users by serving it from edge locations around the world.',
    keyPoints: [
      'CDNs reduce latency, offload origin traffic, and improve resilience during spikes.',
      'Cache invalidation rules matter as much as cache hit rate.',
      'Dynamic content can still benefit from edge routing, compression, and TLS termination.',
    ],
    category: 'Performance',
    orderIndex: 9,
    estimatedReadTime: 2,
  },
  {
    id: 'search-systems',
    slug: 'search-systems',
    title: 'Search systems at a glance',
    summaryShort:
      'Search is usually a separate indexing pipeline optimized for retrieval, ranking, and filtering rather than transactional correctness.',
    keyPoints: [
      'Search indexes are often eventually consistent with the source of truth database.',
      'Ranking quality, typo tolerance, and filters shape the user experience more than raw query speed.',
      'Indexing pipelines need backfills, retries, and observability because missed updates hurt trust.',
    ],
    category: 'Retrieval',
    orderIndex: 10,
    estimatedReadTime: 3,
  },
  {
    id: 'idempotency',
    slug: 'idempotency',
    title: 'Idempotency prevents accidental double work',
    summaryShort:
      'Idempotency means the same request can be retried safely without causing duplicate side effects.',
    keyPoints: [
      'Critical for payments, order creation, and webhook processing.',
      'Usually implemented with request identifiers plus a stored outcome.',
      'It works hand in hand with retries, queues, and at-least-once delivery guarantees.',
    ],
    category: 'Correctness',
    orderIndex: 11,
    estimatedReadTime: 2,
  },
  {
    id: 'consistency-models',
    slug: 'consistency-models',
    title: 'Strong vs eventual consistency',
    summaryShort:
      'Consistency models describe how quickly all clients observe the same data after a write in distributed systems.',
    keyPoints: [
      'Strong consistency simplifies reasoning but often adds latency or reduces availability.',
      'Eventual consistency is acceptable when the business can tolerate brief staleness.',
      'The right choice depends on user expectation, not on architecture fashion.',
    ],
    category: 'Distributed Systems',
    orderIndex: 12,
    estimatedReadTime: 3,
  },
];
