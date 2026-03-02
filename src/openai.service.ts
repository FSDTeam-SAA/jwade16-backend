import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
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
}
