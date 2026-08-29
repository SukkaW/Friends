import yaml from 'js-yaml';
import fs from 'node:fs';
import { fastStringArrayJoin } from 'foxts/fast-string-array-join';
import { newQueue } from '@henrygd/queue';
import { asyncRetry } from 'foxts/async-retry';

import * as v from 'valibot';
import { extractErrorMessage } from 'foxts/extract-error-message';
import { pickOne } from 'foxts/pick-random';

const IndividualLinkSchema = v.object({
  img: v.pipe(v.string(), v.nonEmpty()),
  url: v.pipe(v.string(), v.nonEmpty(), v.url()),
  text: v.pipe(v.string(), v.nonEmpty()),
  alive: v.optional(v.boolean()),
});

const LinksDocumentSchema = v.record(v.string(), IndividualLinkSchema);

const queue = newQueue(16);

const topUserAgentsPromise = fetch('https://cdn.jsdelivr.net/npm/top-user-agents@2.1.91/src/desktop.json').then(r => r.json());

// Get document, or throw exception on error
(async () => {
  try {
    const data = v.parse(LinksDocumentSchema, yaml.load(fs.readFileSync('./src/links.yml', 'utf-8')));

    // Run checks in chunks to limit concurrency
    const entries = Object.entries(data);
    await queue.all(entries.map(async ([key, val]) => {
      const alive = await checkAlive(val.url, 5000);
      val.alive = alive === CheckStatus.Alive;
    }));

    fs.mkdirSync('./dist', { recursive: true });
    fs.writeFileSync('./dist/links.json', JSON.stringify(data));
    fs.cpSync('./src/img', './dist/img', { recursive: true });

    fs.writeFileSync('./dist/_headers', fastStringArrayJoin([
      '/links.json',
      '  Cache-Control: public, max-age=300, stale-while-revalidate=60',
      '/img/*',
      '  Cache-Control: public, max-age=86400, stale-while-revalidate=3600',
    ], '\n') + '\n');
    fs.writeFileSync('./dist/_redirects', fastStringArrayJoin([
      '/ https://skk.moe/friends/ 302',
    ], '\n') + '\n');
  } catch (e) {
    console.error(e);
  }
})();

const enum CheckStatus {
  Alive,
  Dead,
  Redirected
}

async function checkAlive(url: string, timeoutMs = 5000): Promise<CheckStatus> {
  try {
    return await asyncRetry(async () => {
      let res = await fetch(
        url,
        {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(timeoutMs),
          headers: { 'User-Agent': 'Mozilla/5.0 Sukka Friends Link Checker (https://skk.moe/friends/; https://github.com/SukkaW/Friends)' }
        }
      );
      // Either 405 Method Not Allowed or 404 Not Found (due to unregistered HEAD routes)
      if (res.status >= 400) {
        res = await fetch(
          url,
          {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            redirect: 'manual',
            signal: AbortSignal.timeout(timeoutMs),
          }
        );
      }
      // In case of 403 Forbidden, try again with a common User-Agent
      if (res.status === 403) {
        res = await fetch(
          url,
          {
            method: 'GET',
            headers: { Range: 'bytes=0-0', 'User-Agent': pickOne(await topUserAgentsPromise) },
            redirect: 'manual',
            signal: AbortSignal.timeout(timeoutMs),
          }
        );
      }
      if (res.status >= 300 && res.status < 400) {
        console.log(`[redirected] ${url} -> ${res.headers.get('Location')}`);
        return CheckStatus.Redirected;
      }
      if (res.ok) {
        console.log(`[alive] ${url}`);
        return CheckStatus.Alive;
      }

      console.log(`[dead] ${url} (status: ${res.status})`);
      return CheckStatus.Dead;
    }, { retries: 2 });
  } catch (e) {
    console.log(`[dead] ${url} (error: ${extractErrorMessage(e)})`);
    return CheckStatus.Dead;
  }
}

