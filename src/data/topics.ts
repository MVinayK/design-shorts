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
    articleSections: [
      'Caching is a way of storing data in a faster layer so future requests do not have to go all the way to the original system every time. In interviews, this usually comes up when the database or downstream service becomes too slow under repeated reads.',
      'The reason caching matters is that many systems are read-heavy. Product pages, user profiles, timelines, search suggestions, and dashboards often serve the same or similar data many times, so a cache cuts latency and reduces load on expensive infrastructure.',
      'A common pattern is cache-aside: the app checks the cache first, falls back to the database on a miss, then writes the fresh result back into the cache. This keeps the system simple, but it also means you need to think carefully about invalidation when the underlying data changes.',
      'Other patterns such as write-through and write-back are useful when you need tighter control over freshness or write performance. The right choice depends on whether stale reads are acceptable and how much operational complexity the team can handle.',
    ],
    example:
      'Imagine an ecommerce site where the product detail page is requested thousands of times per minute. Instead of hitting the database every time for the same item, the app stores the product payload in Redis for a short TTL, which keeps page loads fast and protects the database during spikes.',
    interviewTakeaway:
      'When discussing caching, always mention the tradeoff: faster reads and lower backend load in exchange for possible staleness, invalidation complexity, and extra operational state.',
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
    articleSections: [
      'An index is a helper data structure that lets the database locate rows more efficiently than scanning the full table. Without the right index, even a correct query can become slow as data size grows.',
      'Indexes matter because production systems rarely suffer from one giant logic bug; they more often degrade from common queries becoming expensive at scale. A single frequently used filter or sort can turn into a bottleneck if the database has no efficient path to retrieve matching rows.',
      'The key interview idea is that indexes are chosen from access patterns. If your workload filters by email, created_at, or user_id plus status, those patterns should shape the index design. Composite indexes are especially valuable, but their order should match the query pattern.',
      'The tradeoff is that indexes are not free. They take storage, increase write cost, and can complicate migrations, so you usually add them for proven access paths rather than indexing every column by default.',
    ],
    example:
      'Suppose a support dashboard frequently runs a query like “show the latest open tickets for a customer.” A composite index on customer_id, status, and created_at can reduce that query from a slow table scan to a targeted lookup.',
    interviewTakeaway:
      'In HLD interviews, say explicitly that indexing is a read optimization with write and storage cost, and that composite index order should follow the most common query filters.',
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
    articleSections: [
      'A transaction groups multiple database operations into one logical unit of work. The goal is to avoid a state where half the changes are applied and the other half are lost because a failure happened in the middle.',
      'Transactions are especially important in systems where correctness matters more than raw throughput, such as payments, inventory, bookings, and account balances. In those domains, a partial update can create real business damage.',
      'The ACID model gives a helpful framework: atomicity avoids partial completion, consistency preserves valid states, isolation manages concurrent access, and durability ensures committed data survives failures. In practice, isolation is often where the interesting tradeoffs show up.',
      'In distributed systems, full transactions across services become expensive and fragile. That is why many architectures use local transactions plus idempotency, retries, or compensation workflows instead of relying on heavyweight distributed commits everywhere.',
    ],
    example:
      'If a banking app transfers money from Account A to Account B, both the debit and credit should happen together. A transaction ensures the system does not debit one account and crash before crediting the other.',
    interviewTakeaway:
      'When transactions come up, connect them to business correctness and then explain when you would avoid distributed transactions in favor of idempotent workflows and compensating actions.',
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
    articleSections: [
      'Load balancing distributes incoming traffic across multiple service instances so that a single machine does not become the bottleneck or the single point of failure. It is one of the first scaling primitives in most system designs.',
      'The main value is not just performance. A load balancer also improves availability by steering traffic away from unhealthy instances and by making it easier to add or remove capacity behind a stable entry point.',
      'Different balancing strategies fit different workloads. Round-robin is easy to explain and often enough for stateless services, while least-connections or latency-aware routing helps when some requests are heavier or instance health varies.',
      'Interview discussions become stronger when you mention session handling. If the app is stateless, balancing is simpler. If sessions are sticky or stored in-memory, routing flexibility drops and failure recovery becomes harder.',
    ],
    example:
      'A video platform may run ten API instances behind a load balancer. As traffic spikes during a live event, the balancer spreads requests across all healthy nodes instead of overloading a single server.',
    interviewTakeaway:
      'Always pair load balancing with health checks, stateless service design, and autoscaling. Those ideas together show maturity, not just the mention of a balancer box.',
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
    articleSections: [
      'Sharding means splitting a dataset across multiple database nodes so one machine is no longer responsible for all storage and write traffic. It becomes necessary when vertical scaling is not enough or becomes too expensive.',
      'The hardest part is choosing the shard key. A good key spreads traffic evenly and aligns with request patterns, while a bad key can create hot partitions that defeat the whole purpose of sharding.',
      'Sharding helps with scale, but it also breaks the convenience of a single database. Cross-shard joins, global secondary indexes, and distributed transactions all become harder. Operational tasks like rebalancing or resharding also require planning.',
      'This is why teams typically postpone sharding until they have clear evidence that a single database is no longer enough. It is powerful, but it is not an automatic default for every system design.',
    ],
    example:
      'A messaging platform might shard user conversations by conversation_id so traffic and storage are spread across multiple partitions rather than piling onto one central database.',
    interviewTakeaway:
      'When proposing sharding, explain the shard key and the new complexity it introduces. Interviews go poorly when sharding is mentioned as a free scaling trick.',
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
    articleSections: [
      'Replication keeps multiple copies of data on different nodes so the system can survive failures and often serve more reads. It is a foundational technique for both reliability and scale.',
      'Leader-follower replication is common because it gives the system one clear place to accept writes while letting replicas serve reads. That model is easy to explain in interviews and maps well to many production systems.',
      'The tradeoff is replication lag. Followers may not reflect the latest write immediately, which means users can see stale data if the product expects immediate read-after-write behavior.',
      'The design choice between synchronous and asynchronous replication is really a choice between stronger durability and lower latency. Stronger guarantees usually cost speed, so the right answer depends on business requirements.',
    ],
    example:
      'A SaaS analytics dashboard can send writes to the primary database and route most read-heavy reports to replicas, which helps absorb reporting traffic without overwhelming the write path.',
    interviewTakeaway:
      'If you mention replicas, also mention lag and consistency expectations. That shows you understand the operational side, not just the diagram.',
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
    articleSections: [
      'Rate limiting controls how much traffic a client can send over time. It protects shared infrastructure from abuse, accidental overload, and noisy neighbors that would otherwise degrade service for everyone else.',
      'This matters because not every scaling problem should be solved by adding more machines. Sometimes the better answer is to protect the system boundary so demand remains within safe operating limits.',
      'Different algorithms suit different needs. Fixed window is simple, sliding window is fairer, and token bucket is especially useful when you want to allow short bursts while still enforcing an average rate.',
      'A strong system design answer also includes client experience. Good APIs expose retry-after headers or meaningful errors so clients can recover instead of blindly retrying and making the situation worse.',
    ],
    example:
      'An authentication service might limit login attempts per IP or per account to block brute-force abuse while still allowing normal user behavior.',
    interviewTakeaway:
      'In interviews, pair rate limiting with abuse prevention, overload control, and clear client feedback. That frames it as both a reliability and a product concern.',
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
    articleSections: [
      'Queues and pub-sub both decouple producers from consumers, but they solve slightly different problems. Queues are good for distributing work to workers, while pub-sub is useful when multiple downstream systems should react to the same event.',
      'These patterns matter because they let systems absorb spikes and move slow or non-critical work off the user-facing request path. That improves resilience and keeps interactive flows responsive.',
      'The subtle part is delivery semantics. Many messaging systems are at-least-once by default, which means duplicate delivery can happen. Consumers should therefore be idempotent and ready for retries.',
      'A solid interview answer also mentions observability and dead-letter handling. If consumers fail repeatedly, teams need a way to inspect, retry, or quarantine problematic messages safely.',
    ],
    example:
      'After a user places an order, the main service can publish an event so separate consumers send email, update analytics, and trigger inventory workflows without blocking checkout.',
    interviewTakeaway:
      'Explain why asynchronous processing improves responsiveness, then mention idempotency and retries. That combination makes the design believable.',
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
    articleSections: [
      'A CDN serves static or cacheable content from edge locations closer to users, which reduces latency and lowers the amount of traffic reaching the origin servers. It is one of the easiest performance wins for globally distributed products.',
      'The value is especially clear for assets like images, JavaScript bundles, video thumbnails, and public content pages. When those requests are offloaded to the edge, the origin can focus on dynamic business logic.',
      'The hard part is not adding a CDN but designing caching rules. Teams need to decide which responses are cacheable, how long they live, and how invalidation works when content changes.',
      'Even when content is dynamic, edge platforms can still help through TLS termination, compression, routing, and selective caching. So CDNs are often useful beyond just static file hosting.',
    ],
    example:
      'A global media platform can serve images and public article assets from edge nodes so users in different regions get faster loads without every request traveling back to one central origin.',
    interviewTakeaway:
      'When talking about CDNs, mention both latency improvement and origin offload, then show that you understand invalidation and cache control strategy.',
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
    articleSections: [
      'Search systems are usually built as a separate retrieval layer rather than relying on transactional databases alone. They optimize for fast lookup, filtering, ranking, and fuzzy matching rather than strict write correctness.',
      'This separation matters because the needs of search are different from the needs of a source-of-truth database. Search needs specialized indexing, inverted lookups, ranking signals, and typo tolerance.',
      'In practice, search pipelines are often eventually consistent. Data changes in the primary system are published to an indexing flow, which updates the search store asynchronously. That is acceptable in many products as long as the lag is understood.',
      'A stronger design discussion includes quality, not just speed. Relevance ranking, synonyms, filters, and observability all matter because users judge search by usefulness, not only by response time.',
    ],
    example:
      'An ecommerce app may store canonical product data in Postgres but use Elasticsearch or OpenSearch for product discovery, faceted filters, and typo-tolerant matching.',
    interviewTakeaway:
      'Say clearly that search is a dedicated retrieval subsystem with eventual consistency and specialized ranking behavior. That is usually the interview-level insight being tested.',
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
    articleSections: [
      'Idempotency means a repeated request produces the same final outcome instead of duplicating side effects. It is a critical idea in real distributed systems because retries are common and failures are rarely clean.',
      'This matters most in operations that must not happen twice, such as charging a card, creating an order, or processing a webhook. Without idempotency, ordinary retry logic can become a business bug.',
      'A common implementation uses an idempotency key supplied by the client. The service stores the result associated with that key and returns the same outcome for repeated requests instead of executing the operation again.',
      'Idempotency becomes even more important when messages are processed from queues or event streams where at-least-once delivery is expected. In those systems, duplicates are normal and should be planned for.',
    ],
    example:
      'A payments API can require an idempotency key per charge request so a network retry does not accidentally create two charges for the same purchase.',
    interviewTakeaway:
      'When retries appear in a design, idempotency should appear too. That pairing is one of the clearest maturity signals in HLD discussions.',
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
    articleSections: [
      'Consistency models describe how soon different clients observe the same data after a write. In distributed systems, this is not just a theory topic; it directly shapes user experience and system behavior under failure.',
      'Strong consistency makes systems easier to reason about because everyone sees the latest committed value, but it can cost more latency or reduce availability during network partitions or leader transitions.',
      'Eventual consistency accepts that replicas may be temporarily stale, which often improves scalability and resilience. The key question is whether the product can tolerate that delay without confusing users or breaking business rules.',
      'The best interview answers are contextual. Profile counters, analytics, and some timelines can tolerate eventual consistency, while payments, inventory reservations, or access control usually need tighter guarantees.',
    ],
    example:
      'A social app can tolerate a short delay before like counts converge globally, but a ticket-booking system cannot tolerate two users both seeing the same seat as available.',
    interviewTakeaway:
      'Never present consistency as ideology. Tie the model to user expectations, business risk, and failure behavior.',
    category: 'Distributed Systems',
    orderIndex: 12,
    estimatedReadTime: 3,
  },
];
