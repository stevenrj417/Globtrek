import { llmsText as text } from "../lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(text(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
