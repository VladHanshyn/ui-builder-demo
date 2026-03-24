import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { DEFAULT_SECTIONS } from "@/ui-generator/navigationTree";
import type { PhoenixStoreSnapshot } from "@/lib/phoenixStore";
import { PHOENIX_STORE_FILE } from "@/lib/phoenixStore";

export const runtime = "nodejs";

const storePath = path.join(process.cwd(), PHOENIX_STORE_FILE);

function emptyStore(): PhoenixStoreSnapshot {
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

async function readStore(): Promise<PhoenixStoreSnapshot> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<PhoenixStoreSnapshot>;
    return {
      ...emptyStore(),
      ...parsed,
      navState: parsed.navState?.sections ? parsed.navState : { sections: DEFAULT_SECTIONS },
      pageSpecs: parsed.pageSpecs ?? {},
      createPageSpecs: parsed.createPageSpecs ?? {},
      savedTableRows: parsed.savedTableRows ?? {},
      pageWizardIntents: parsed.pageWizardIntents ?? {},
      featureRequests: parsed.featureRequests ?? [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(nextStore: PhoenixStoreSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(nextStore, null, 2), "utf8");
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<PhoenixStoreSnapshot>;
    const nextStore: PhoenixStoreSnapshot = {
      ...emptyStore(),
      ...body,
      navState: body.navState?.sections ? body.navState : { sections: DEFAULT_SECTIONS },
      pageSpecs: body.pageSpecs ?? {},
      createPageSpecs: body.createPageSpecs ?? {},
      savedTableRows: body.savedTableRows ?? {},
      pageWizardIntents: body.pageWizardIntents ?? {},
      featureRequests: body.featureRequests ?? [],
      updatedAt: new Date().toISOString(),
    };
    await writeStore(nextStore);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  const cleared = emptyStore();
  await writeStore(cleared);
  return NextResponse.json({ ok: true });
}
