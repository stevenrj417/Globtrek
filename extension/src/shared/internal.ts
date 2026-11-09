import type { FillReport } from "../content/engine.ts";
import type { PassportRecord } from "../profile/types.ts";
import type { BookingSession } from "../session/manager.ts";

// Messages between the extension's own pages, its background worker and its
// fill script. The website never sees or sends these.

export type UiRequest =
  | { type: "UI_GET_SESSIONS" }
  | { type: "UI_SET_MODE"; sessionId: string; mode: "guided" | "all" }
  | { type: "UI_OPEN_ITEMS"; sessionId: string; itemIds: string[] }
  | { type: "UI_FOCUS_ITEM"; sessionId: string; itemId: string }
  | { type: "UI_FILL_ITEM"; sessionId: string; itemId: string; passports?: PassportRecord[] }
  | { type: "UI_MARK_COMPLETE"; sessionId: string; itemId: string; complete: boolean }
  | { type: "UI_END_SESSION"; sessionId: string }
  | { type: "UI_DEV_DEMO_SESSION"; variant?: "fixtures" | "showcase" };

export type UiResponse =
  | { ok: true; sessions?: BookingSession[]; session?: BookingSession; sessionId?: string }
  | { ok: false; error: string };

export interface FillCommand {
  type: "GT_FILL";
  adapterId: string;
  fixture: boolean;
  values: Record<string, string>;
}

export type FillResponse = { ok: true; report: FillReport } | { ok: false; error: string };

export interface SessionsChanged {
  type: "SESSIONS_CHANGED";
}
