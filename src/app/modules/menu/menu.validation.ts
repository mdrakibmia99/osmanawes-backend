import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID');

const createMenuValidationSchema = z.object({
  body: z.object({
    itemName: z.string().trim().min(1, 'Item name is required'),
    image: z.string().trim().min(1, 'Image is required').optional(),
    categoryId: objectIdSchema,
    price: z.number().min(0, 'Price cannot be negative'),
    status: z.boolean().optional(),
  }),
});

const updateMenuValidationSchema = z.object({
  body: z.object({
    itemName: z.string().trim().min(1, 'Item name cannot be empty').optional(),
    image: z.string().trim().min(1, 'Image cannot be empty').optional(),
    categoryId: objectIdSchema.optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    status: z.boolean().optional(),
  }),
});

export const menuValidation = {
  createMenuValidationSchema,
  updateMenuValidationSchema,
};
