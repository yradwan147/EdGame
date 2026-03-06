import { z } from "zod";

export const GameEventSchema = z.object({
  type: z.string().min(1),
  ts: z.number(),
  payload: z.record(z.unknown()).default({}),
});

export const BatchEventsSchema = z.object({
  events: z.array(GameEventSchema).min(1).max(200),
});

export type GameEventInput = z.infer<typeof GameEventSchema>;
export type BatchEventsInput = z.infer<typeof BatchEventsSchema>;
