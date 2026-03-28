import { mkdir, writeFile } from 'node:fs/promises';

const FEEDS = [
  { name: 'InfoQ', url: 'https://feed.infoq.com/' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The New Stack', url: 'https://thenewstack.io/feed/' },
];

function stripHtml(value) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function pullTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function summarize(text) {
  const clean = stripHtml(text);
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences
    .slice(0, 2)
    .join(' ')
    .replace(/<img[^>]*>/gi, '')
    .slice(0, 240);
}

function inferTags(text) {
  const lower = text.toLowerCase();
  const tags = [];

  if (/\bai\b/.test(lower) || lower.includes('model')) tags.push('AI');
  if (lower.includes('database') || lower.includes('storage')) tags.push('Databases');
  if (lower.includes('cloud') || lower.includes('infra')) tags.push('Cloud');
  if (lower.includes('edge') || lower.includes('cache')) tags.push('Architecture');
  if (tags.length === 0) tags.push('Engineering');

  return tags.slice(0, 3);
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      'user-agent': 'design-shorts-news-bot',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed.name}`);
  }

  const xml = await response.text();
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);

  return itemBlocks.slice(0, 5).map((item) => {
    const title = pullTag(item, 'title');
    const description = pullTag(item, 'description');
    const link = pullTag(item, 'link');
    const publishedAt = pullTag(item, 'pubDate') || new Date().toUTCString();
    const text = `${title}. ${description}`;

    return {
      id: toSlug(title),
      title,
      sourceName: feed.name,
      sourceUrl: link,
      publishedAt: new Date(publishedAt).toISOString(),
      summaryShort: summarize(text),
      tags: inferTags(text),
    };
  });
}

const allItems = (await Promise.all(FEEDS.map(fetchFeed))).flat();
const dedupedItems = Object.values(
  allItems.reduce((accumulator, item) => {
    const key = item.title.toLowerCase();

    if (!accumulator[key]) {
      accumulator[key] = item;
    }

    return accumulator;
  }, {}),
).slice(0, 8);

const digest = {
  generatedAt: new Date().toISOString(),
  items: dedupedItems,
};

await mkdir(new URL('../public', import.meta.url), { recursive: true });
await writeFile(new URL('../public/news.json', import.meta.url), JSON.stringify(digest, null, 2));

console.log(`Generated ${digest.items.length} news cards.`);
