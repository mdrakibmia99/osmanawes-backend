import { z } from 'zod';

const createTeamValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Invalid email address'),
    role: z.string().trim().min(1, 'Role is required'),
  }),
});

const updateTeamValidationSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'Name cannot be empty').optional(),
      email: z.string().trim().email('Invalid email address').optional(),
      role: z.string().trim().min(1, 'Role cannot be empty').optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: 'At least one team field is required',
    }),
});

export const teamsValidation = {
  createTeamValidationSchema,
  updateTeamValidationSchema,
};
