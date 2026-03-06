import { z } from "zod";

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1),
  environmentId: z.string(),
  classId: z.string().optional(),
  instructions: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  config: z.record(z.unknown()).optional(),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  instructions: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
