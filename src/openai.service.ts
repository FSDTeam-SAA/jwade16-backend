import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  private readonly textModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY;
    console.log('OPENAI_API_KEY loaded:', apiKey ? '✓ Present' : '✗ Missing');
    console.log(
      'API Key (masked):',
      apiKey ? apiKey.substring(0, 10) + '...' : 'undefined',
    );

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.textModel =
      this.configService.get<string>('OPENAI_TEXT_MODEL') || 'gpt-4o-mini';
  }

  async createEmbedding(text: string): Promise<number[]> {
    console.log('createEmbedding called with:', text);
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      console.log('Embedding created successfully');
      return response.data[0].embedding;
    } catch (error) {
      console.error(
        'Embedding error:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async generatePersonalizedPaypowerExplanation(input: {
    score: number;
    tierLabel: string;
    baseDescription: string;
    recommendedActions: string[];
    answers?: unknown;
  }): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.textModel,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            'You are a compensation coach. Generate a personalized, concise explanation of a PayPower score. Keep tone supportive, clear, and practical. Avoid medical, legal, or financial guarantees. Return plain text only.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Create personalized score explanation',
            requirements: {
              maxLength: '120-180 words',
              style: 'personalized and non-generic',
              include: [
                'what this score says right now',
                '2-3 specific insights based on user answers',
                'clear next step',
              ],
            },
            input,
          }),
        },
      ],
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Your score shows your current pay readiness and highlights where focused improvements can raise your position. Prioritize one action this week and track progress over time.'
    );
  }
}
