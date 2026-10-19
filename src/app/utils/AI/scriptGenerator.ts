import OpenAI from 'openai';
import config from '../../config';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { User } from '../../modules/user/user.models';
import { SUBSCRIPTION_TYPES } from '../../modules/user/user.constants';

const client = new OpenAI({
  apiKey: config?.OPENAI_API_KEY || "asdf",
});

export interface IScriptGeneratorPayload {
  category: string;
  tone: string;
  duration: '15 sec' | '30 sec' | '1 minute';
}

export const generatePracticeScript = async (
  payload: IScriptGeneratorPayload
): Promise<string> => {


  try {
    const { category, tone, duration } = payload;


    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.8,

      messages: [
        {
          role: 'system',
          content: `
You are an expert audition and voice-over script writer.

Your task:
- Generate a natural and professional practice script.
- Match the requested category, tone, and duration.

Strict Rules:
- Return ONLY spoken dialogue.
- Do NOT add stage directions.
- Do NOT add background music notes.
- Do NOT add sound effects.
- Do NOT use brackets like [ ] or parentheses.
- Do NOT add titles or explanations.
- The output must be clean voice-over text only.
`.trim(),
        },

        {
          role: 'user',
          content: `
Category: ${category}
Tone/Style: ${tone}
Length: ${duration}

Generate a professional audition practice script.
          `.trim(),
        },
      ],
    });

    // const generatedScript = response.choices[0]?.message?.content?.trim();
    const generatedScript = response.choices[0]?.message?.content
      ?.replace(/\[.*?\]/g, '')
      ?.replace(/^"|"$/g, '')
      ?.trim();
    if (!generatedScript) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'AI returned an empty script.'
      );
    }



    return generatedScript;
  } catch (err: any) {
    console.error('AI Script Generator Error:', err);

    if (err?.status === 429) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'AI service is busy right now. Please try again later.'
      );
    }

    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to generate practice script.'
    );
  }
};