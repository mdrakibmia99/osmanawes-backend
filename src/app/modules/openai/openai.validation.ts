import { z } from 'zod';


const generatePracticeScriptValidationSchema = z.object({
  body: z.object({
    category: z
      .string()
      .trim()
      .min(1, { message: 'Category is required' }),

    tone: z
      .string()
      .trim()
      .min(1, { message: 'Tone/Style is required' }),

    duration: z.enum(['15 sec', '30 sec','45 sec', '1 minute'], {
      message: 'Invalid duration selected',
    }),
  }),
});

export const openaiValidations = {
    generatePracticeScriptValidationSchema,
};
