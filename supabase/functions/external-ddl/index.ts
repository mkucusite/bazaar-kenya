// Runs DDL/SQL against the external Supabase Postgres using EXTERNAL_SUPABASE_DB_URL.
// Guarded by DDL_TOKEN / MIGRATION_TOKEN.
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-token",
};

const TOKEN = Deno.env.get("DDL_TOKEN") || Deno.env.get("MIGRATION_TOKEN")!;
const DB_URL = Deno.env.get("EXTERNAL_SUPABASE_DB_URL") || "";

const BENIGN = /already exists|does not exist|duplicate/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const url = new URL(req.url);
  const token = req.headers.get("x-migration-token") || url.searchParams.get("token");
  if (!TOKEN || token !== TOKEN) return json({ error: "unauthorized" }, 401);
  if (!DB_URL) return json({ error: "EXTERNAL_SUPABASE_DB_URL not set" }, 400);

  const body = (await req.text()).trim();
  if (!body) return json({ error: "empty sql body" }, 400);

  // Batch mode: JSON array of statements, executed one by one, benign errors skipped.
  let statements: string[] | null = null;
  if (body.startsWith("[")) {
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed)) statements = parsed.filter((s) => typeof s === "string" && s.trim());
    } catch { /* treat as raw sql */ }
  }

  const client = new Client(DB_URL);
  try {
    await client.connect();

    if (statements) {
      let ok = 0, skipped = 0;
      const errors: { index: number; error: string; sql: string }[] = [];
      for (let i = 0; i < statements.length; i++) {
        try {
          await client.queryArray(statements[i]);
          ok++;
        } catch (e) {
          const msg = String((e as Error)?.message || e);
          if (BENIGN.test(msg)) skipped++;
          else if (errors.length < 40) errors.push({ index: i, error: msg, sql: statements[i].slice(0, 160) });
        }
      }
      return json({ ok: errors.length === 0, total: statements.length, executed: ok, skipped, errors });
    }

    const res = await client.queryArray(body);
    return json({ ok: true, rows: res.rows?.slice(0, 500) ?? [], rowCount: res.rowCount ?? 0 });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
});
