import { NextResponse } from "next/server";
import { DEFAULT_SECTIONS } from "@/ui-generator/navigationTree";
import type { PhoenixStoreSnapshot } from "@/lib/phoenixStore";
import {
  emptyPhoenixStore,
  phoenixPersistMode,
  readPhoenixStore,
  writePhoenixStore,
} from "@/lib/phoenixStoreServer";

export const runtime = "nodejs";

export async function GET() {
  const store = await readPhoenixStore();
  const res = NextResponse.json(store);
  res.headers.set("X-Phoenix-Persist", phoenixPersistMode());
  return res;
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<PhoenixStoreSnapshot>;
    const nextStore: PhoenixStoreSnapshot = {
      ...emptyPhoenixStore(),
      ...body,
      navState: body.navState?.sections ? body.navState : { sections: DEFAULT_SECTIONS },
      pageSpecs: body.pageSpecs ?? {},
      createPageSpecs: body.createPageSpecs ?? {},
      savedTableRows: body.savedTableRows ?? {},
      pageWizardIntents: body.pageWizardIntents ?? {},
      featureRequests: body.featureRequests ?? [],
      updatedAt: new Date().toISOString(),
    };
    await writePhoenixStore(nextStore);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  const cleared = emptyPhoenixStore();
  await writePhoenixStore(cleared);
  return NextResponse.json({ ok: true });
}
