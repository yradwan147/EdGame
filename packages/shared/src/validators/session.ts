import { z } from "zod";

export const CreateSessionSchema = z.object({
  assignmentId: z.string().optional(),
  environmentId: z.string(),
});

export const UpdateSessionSchema = z.object({
  completed: z.boolean().optional(),
  score: z.number().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
