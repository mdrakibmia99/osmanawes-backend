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
  userId: string,
  payload: IScriptGeneratorPayload
): Promise<string> => {
  const userData = await User.findById(userId).lean();

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { subscriptionType, scriptGeneratedCount } = userData;

  let scriptLimit = 0;
  let isUnlimited = false;

  switch (subscriptionType) {
    case SUBSCRIPTION_TYPES.FREE:
      scriptLimit = 10;
      break;

    case SUBSCRIPTION_TYPES.PRO:
      scriptLimit = 50;
      break;

    case SUBSCRIPTION_TYPES.PREMIUM:
      isUnlimited = true;
      break;

    default:
      scriptLimit = 10;
  }

  // 🔒 enforce limit (skip for premium)
  if (!isUnlimited && (scriptGeneratedCount ?? 0) >= scriptLimit) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Script generation limit reached for ${subscriptionType} plan`
    );
  }

  console.log('Generating script with payload:', payload);
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

    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          scriptGeneratedCount: 1,
        },
      },
      {
        new: true,
      }
    );

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