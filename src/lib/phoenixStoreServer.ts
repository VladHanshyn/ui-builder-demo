import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_SECTIONS } from "@/ui-generator/navigationTree";
import type { PhoenixStoreSnapshot } from "@/lib/phoenixStore";
import { PHOENIX_STORE_FILE } from "@/lib/phoenixStore";

const REDIS_KEY = "phoenix:snapshot";

let redisSingleton: Redis | null | undefined;

function redisClient(): Redis | null {
  if (redisSingleton !== undefined) return redisSingleton;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  redisSingleton = url && token ? new Redis({ url, token }) : null;
  return redisSingleton;
}

/**
 * `redis` — KV/Upstash. `vercel-ephemeral` — no Redis on Vercel: reads bundled JSON, writes are not durable.
 * `file` — local disk (next dev / Node host without VERCEL).
 */
export function phoenixPersistMode(): "redis" | "vercel-ephemeral" | "file" {
  if (redisClient()) return "redis";
  if (process.env.VERCEL) return "vercel-ephemeral";
  return "file";
}

export function emptyPhoenixStore(): PhoenixStoreSnapshot {
  return {
    navState: { sections: DEFAULT_SECTIONS },
    pageSpecs: {},
    createPageSpecs: {},
    savedTableRows: {},
    pageWizardIntents: {},
    featureRequests: [],
    updatedAt: new Date().toISOString(),
  };
}

function mergeParsed(parsed: Partial<PhoenixStoreSnapshot>): PhoenixStoreSnapshot {
  return {
    ...emptyPhoenixStore(),
    ...parsed,
    navState: parsed.navState?.sections ? parsed.navState : { sections: DEFAULT_SECTIONS },
    pageSpecs: parsed.pageSpecs ?? {},
    createPageSpecs: parsed.createPageSpecs ?? {},
    savedTableRows: parsed.savedTableRows ?? {},
    pageWizardIntents: parsed.pageWizardIntents ?? {},
    featureRequests: parsed.featureRequests ?? [],
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}

const storePath = () => path.join(process.cwd(), PHOENIX_STORE_FILE);

async function readFromFile(): Promise<PhoenixStoreSnapshot> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<PhoenixStoreSnapshot>;
    return mergeParsed(parsed);
  } catch {
    return emptyPhoenixStore();
  }
}

async function writeToFile(nextStore: PhoenixStoreSnapshot): Promise<void> {
  const p = storePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(nextStore, null, 2), "utf8");
}

export async function readPhoenixStore(): Promise<PhoenixStoreSnapshot> {
  const r = redisClient();
  if (r) {
    const raw = await r.get<string>(REDIS_KEY);
    if (raw != null && raw !== "") {
      try {
        const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as Partial<PhoenixStoreSnapshot>;
        return mergeParsed(parsed);
      } catch {
        return emptyPhoenixStore();
      }
    }
    return emptyPhoenixStore();
  }
  return readFromFile();
}

export async function writePhoenixStore(nextStore: PhoenixStoreSnapshot): Promise<void> {
  const r = redisClient();
  if (r) {
    await r.set(REDIS_KEY, JSON.stringify(nextStore));
    return;
  }
  await writeToFile(nextStore);
}
