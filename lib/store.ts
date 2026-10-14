import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { seedState, State } from "./domain";
const globalDb = globalThis as unknown as { db?: PrismaClient };
const db = globalDb.db ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.db = db;
export const hosted = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
async function read() {
  if (hosted) {
    const { data, error } = await supabase()
      .from("campus_state")
      .select("*")
      .eq("id", "main")
      .single();
    if (error)
      throw new Error(
        "Hosted database unavailable. Run supabase/schema.sql and the seed command.",
      );
    return { version: data.version as number, data: data.data as State };
  }
  if (process.env.VERCEL)
    throw new Error(
      "Configure Supabase before deploying. SQLite is local only.",
    );
  const row = await db.campusState.upsert({
    where: { id: "main" },
    create: { id: "main", data: JSON.stringify(seedState()) },
    update: {},
  });
  return { version: row.version, data: JSON.parse(row.data) as State };
}
export async function readState() {
  return (await read()).data;
}
export async function mutate<T>(fn: (s: State) => T): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await read();
    const result = fn(row.data);
    if (hosted) {
      const { data, error } = await supabase()
        .from("campus_state")
        .update({ version: row.version + 1, data: row.data })
        .eq("id", "main")
        .eq("version", row.version)
        .select("id");
      if (error) throw error;
      if (data.length) return result;
    } else {
      const resultWrite = await db.campusState.updateMany({
        where: { id: "main", version: row.version },
        data: { data: JSON.stringify(row.data), version: row.version + 1 },
      });
      if (resultWrite.count) return result;
    }
  }
  throw new Error("Another update is in progress. Please retry.");
}
export async function resetSeed() {
  const data = seedState();
  if (hosted) {
    const { error } = await supabase()
      .from("campus_state")
      .upsert({ id: "main", version: 0, data });
    if (error) throw error;
  } else
    await db.campusState.upsert({
      where: { id: "main" },
      create: { id: "main", data: JSON.stringify(data) },
      update: { data: JSON.stringify(data), version: 0 },
    });
  await db.$disconnect();
}
