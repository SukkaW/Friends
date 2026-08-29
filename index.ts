import yaml from 'js-yaml';
import fs from 'node:fs';
import { fastStringArrayJoin } from 'foxts/fast-string-array-join';
import { newQueue } from '@henrygd/queue';
import { asyncRetry } from 'foxts/async-retry';
import { DOMAIN_ALIVE_REASON_MESSAGES, createDomainAliveChecker } from 'domain-alive';
import { lazyValue } from 'foxts/lazy-value';

import * as v from 'valibot';
import { extractErrorMessage } from 'foxts/extract-error-message';
import { pickOne } from 'foxts/pick-random';

const IndividualLinkSchema = v.object({
  img: v.pipe(v.string(), v.nonEmpty()),
  url: v.pipe(v.string(), v.nonEmpty(), v.url()),
  text: v.pipe(v.string(), v.nonEmpty()),
  alive: v.optional(v.boolean())
});

const LinksDocumentSchema = v.record(v.string(), IndividualLinkSchema);

const queue = newQueue(16);

const topUserAgentsPromise = fetch('https://cdn.jsdelivr.net/npm/top-user-agents@2.1.91/src/desktop.json').then(r => r.json());

const dnsServers = [
  'https://8.8.8.8/dns-query', 'https://8.8.4.4/dns-query',
  'https://1.0.0.1/dns-query', 'https://1.1.1.1/dns-query',
  'https://162.159.36.1/dns-query', 'https://162.159.46.1/dns-query',
  'https://dns.cloudflare.com/dns-query', // Cloudflare DoH that uses different IPs: 172.64.41.8,162.159.61.8
  'https://cloudflare-dns.com/dns-query', // Cloudflare DoH that uses different IPs: 104.16.249.249,104.16.248.249
  'https://mozilla.cloudflare-dns.com/dns-query', // Cloudflare DoH that uses different IPs: 162.159.61.4,172.64.41.4
  // one.one.one.one // Cloudflare DoH that uses 1.1.1.1 and 1.0.0.1
  // 'https://101.101.101.101/dns-query', 'https://dns.twnic.tw/dns-query' // TWNIC, has DNS pollution, e.g. t66y.com
  // 'https://dns.hinet.net/dns-query' // HiNet DoH, has DNS pollution, e.g. t66y.com
  'https://185.222.222.222/dns-query', 'https://45.11.45.11/dns-query', // DNS.SB
  // 'https://doh.dns.sb/dns-query', // DNS.SB, Unicast PoPs w/ GeoDNS
  'https://us-chi.doh.sb/dns-query', // DNS.SB Chicago PoP
  'https://us-nyc.doh.sb/dns-query', // DNS.SB New York City PoP
  'https://us-sjc.doh.sb/dns-query', // DNS.SB San Jose PoP
  // 'https://doh.sb/dns-query', // DNS.SB xTom Anycast IP
  // 'https://dns.sb/dns-query', // DNS.SB use same xTom Anycast IP as doh.sb
  // 'https://dns10.quad9.net/dns-query', // Quad9 unfiltered
  // 'https://9.9.9.10/dns-query', 'https://149.112.112.10/dns-query', // Quad9 unfiltered Error: Cannot decode name (bad label)

  // OpenDNS sandbox (unfiltered), doesn't support HTTP/2 properly
  // Error: Session closed without receiving a SETTINGS frame
  //
  // verified with curl:
  // curl: (16) Error in the HTTP2 framing layer
  'https://doh.sandbox.opendns.com/dns-query',

  'https://unfiltered.adguard-dns.com/dns-query', // AdGuard unfiltered
  // 'https://v.recipes/dns-query', // Proxy Cloudflare, too many HTTP 503
  'https://v.recipes/dns/dns.google/dns-query', // Proxy Google, claims to not limited by Google 1500 QPS limit
  'https://freedns.controld.com/p0', // ControlD unfiltered
  // 'https://dns.bebasid.com/unfiltered', // BebasID, cause loads of RangeError: Attempt to access memory outside buffer bounds, possibly caused by timeout
  // 'https://193.110.81.0/dns-query', // dns0.eu
  // 'https://185.253.5.0/dns-query', // dns0.eu
  // 'https://zero.dns0.eu/dns-query',
  'https://dns.nextdns.io/dns-query',
  'https://anycast.dns.nextdns.io/dns-query',
  'https://wikimedia-dns.org/dns-query',
  // 'https://ordns.he.net/dns-query',
  // 'https://dns.mullvad.net/dns-query', empty HTTP body a lot
  'https://basic.rethinkdns.com/dns-query',
  'https://dns.surfsharkdns.com/dns-query',
  // 'https://private.canadianshield.cira.ca/dns-query', // Error: Cannot decode name (bad label)
  // 'https://unfiltered.joindns4.eu/dns-query', // too many ECONNRESET on GitHub Actions
  'https://public.dns.iij.jp/dns-query',
  // 'https://common.dot.dns.yandex.net/dns-query', // too many ECONNRESET on GitHub Actions
  'https://safeservedns.com/dns-query' // NameCheap DNS, supports DoT, DoH, UDP53
  // 'https://ada.openbld.net/dns-query', Contains filtering
  // 'https://dns.rabbitdns.org/dns-query' -- TO MANY HTTP 522
];

const getDomainAliveChecker = lazyValue(async () => {
  const customWhoisServersMapping = await (await (fetch('https://cdn.jsdelivr.net/gh/WooMai/whois-servers@master/list.json'))).json() as Record<string, string>;
  return createDomainAliveChecker({
    dns: {
      dnsServers,
      maxAttempts: 6
    },
    whois: {
      customWhoisServersMapping
    }
  });
});

const enum CheckStatus {
  Alive,
  Dead,
  Redirected
}

// Get document, or throw exception on error
(async () => {
  try {
    const data = v.parse(LinksDocumentSchema, yaml.load(fs.readFileSync('./src/links.yml', 'utf-8')));

    // Run checks in chunks to limit concurrency
    const links = Object.values(data);
    await queue.all(links.map(async (val) => {
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
      '  Cache-Control: public, max-age=86400, stale-while-revalidate=3600'
    ], '\n') + '\n');
    fs.writeFileSync('./dist/_redirects', fastStringArrayJoin([
      '/ https://skk.moe/friends/ 302'
    ], '\n') + '\n');
  } catch (e) {
    console.error(e);
  }
})();

async function checkAlive(url: string, timeoutMs = 5000): Promise<CheckStatus> {
  try {
    const isDomainAlive = await getDomainAliveChecker();
    const domainAliveResult = await isDomainAlive(new URL(url).hostname);
    if (!domainAliveResult.alive) {
      console.log(`[dead] ${url} (domain: ${DOMAIN_ALIVE_REASON_MESSAGES[domainAliveResult.reason]})`);
      return CheckStatus.Dead;
    }

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
            signal: AbortSignal.timeout(timeoutMs)
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
            signal: AbortSignal.timeout(timeoutMs)
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
