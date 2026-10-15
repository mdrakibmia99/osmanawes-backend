import { z } from 'zod';

const updateQueueValidationSchema = z.object({
  body: z
    .object({
      acceptReserVationStatus: z.boolean().optional(),
      maxCapacity: z.number().int().min(0).optional(),
      waitTime: z.number().int().min(0).optional(),
      totalTable: z.number().int().min(0).optional(),
      totalTableBook: z.number().int().min(0).optional(),
      queueStatus: z.boolean().optional(),
      skipPassPrice: z.number().min(0).optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: 'At least one queue field is required',
    }),
});

export const queueValidation = {
  updateQueueValidationSchema,
};
