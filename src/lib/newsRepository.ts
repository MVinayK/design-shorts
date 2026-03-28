import { BUNDLED_NEWS_DIGEST } from '../data/bundledNews';
import { getCachedNewsDigest, saveCachedNewsDigest } from './storage';
import type { NewsDigest } from '../types';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const REMOTE_DIGEST_URL =
  process?.env?.EXPO_PUBLIC_NEWS_DIGEST_URL ??
  'https://raw.githubusercontent.com/your-github-user/design-shorts/main/public/news.json';

function parseDigest(rawValue: string) {
  return JSON.parse(rawValue) as NewsDigest;
}

export async function loadNewsDigest() {
  const cached = await getCachedNewsDigest();

  if (cached) {
    try {
      return parseDigest(cached);
    } catch {
      return BUNDLED_NEWS_DIGEST;
    }
  }

  return BUNDLED_NEWS_DIGEST;
}

export async function refreshNewsDigest() {
  if (!REMOTE_DIGEST_URL.startsWith('http')) {
    throw new Error('The remote digest URL is not configured.');
  }

  const response = await fetch(REMOTE_DIGEST_URL);

  if (!response.ok) {
    throw new Error('Unable to fetch the remote digest. Update the GitHub raw URL before release.');
  }

  const payload = await response.text();
  const digest = parseDigest(payload);

  await saveCachedNewsDigest(payload);

  return digest;
}
