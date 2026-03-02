import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Occupation, OccupationDocument } from './occupation.schema';
import {
  embeddingOccupation,
  EmbeddingOccupationDocument,
} from '../modules/embedding-occupation/embedding-occupation.schema';
import { OpenAiService } from '../openai.service';
import * as fs from 'fs';
import * as path from 'path';

interface RawOccupation {
  AREA?: number;
  AREA_TITLE?: string;
  AREA_TYPE?: number;
  PRIM_STATE?: string;
  NAICS?: string;
  NAICS_TITLE?: string;
  I_GROUP?: string;
  OWN_CODE?: number;
  OCC_CODE?: string;
  OCC_TITLE?: string;
  O_GROUP?: string;
  TOT_EMP?: string | number;
  EMP_PRSE?: number;
  JOBS_1000?: number;
  LOC_QUOTIENT?: number;
  PCT_TOTAL?: number;
  PCT_RPT?: number;
  H_MEAN?: number;
  A_MEAN?: string | number;
  MEAN_PRSE?: number;
  H_PCT10?: number;
  H_PCT25?: number;
  H_MEDIAN?: number;
  H_PCT75?: number;
  H_PCT90?: number;
  A_PCT10?: string | number;
  A_PCT25?: string | number;
  A_MEDIAN?: string | number;
  A_PCT75?: string | number;
  A_PCT90?: string | number;
}

@Injectable()
export class OccupationService {
  constructor(
    @InjectModel(Occupation.name)
    private occupationModel: Model<OccupationDocument>,
    @InjectModel(embeddingOccupation.name)
    private embeddingOccupationModel: Model<EmbeddingOccupationDocument>,
    private openAiService: OpenAiService,
  ) {}

  async importFromJson(): Promise<{ inserted: number }> {
    const filePath = path.join(process.cwd(), 'jword salary data.json');

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData) as RawOccupation[];

    const formattedData = jsonData.map((item) => ({
      ...item,
      TOT_EMP: this.toNumber(item.TOT_EMP),
      A_MEAN: this.toNumber(item.A_MEAN),
      A_PCT10: this.toNumber(item.A_PCT10),
      A_PCT25: this.toNumber(item.A_PCT25),
      A_MEDIAN: this.toNumber(item.A_MEDIAN),
      A_PCT75: this.toNumber(item.A_PCT75),
      A_PCT90: this.toNumber(item.A_PCT90),
    }));

    const result = await this.occupationModel.insertMany(formattedData, {
      ordered: false,
    });

    return { inserted: result.length };
  }

  async getUniqueOccupationTitles(): Promise<string[]> {
    const titles = await this.occupationModel.distinct('OCC_TITLE').exec();
    const data = titles.filter((title) => title != null).sort();

    // Check if embeddingOccupation collection is empty
    const count = await this.embeddingOccupationModel.countDocuments().exec();

    if (count === 0) {
      // Collection is empty, insert titles
      const titleDocs = data.map((title) => ({ title }));
      await this.embeddingOccupationModel.insertMany(titleDocs);
      console.log(
        `Inserted ${titleDocs.length} occupation titles into embeddingOccupation`,
      );

      // Generate embeddings for all newly inserted titles
      await this.generateEmbeddingsForAll();
    }

    return data;
  }

  async generateEmbeddingsForAll() {
    const occupations = await this.embeddingOccupationModel.find({
      $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
    });

    console.log(`Found ${occupations.length} occupations without embeddings`);

    for (const occ of occupations) {
      if (!occ.title) {
        continue;
      }

      const embedding = await this.openAiService.createEmbedding(occ.title);

      occ.embedding = embedding;
      await occ.save();

      console.log(`Embedding saved for: ${occ.title}`);
    }

    return `All embeddings generated! Total: ${occupations.length}`;
  }

  async findBestMatch(
    userInput: string,
  ): Promise<EmbeddingOccupationDocument | undefined> {
    const queryEmbedding = await this.openAiService.createEmbedding(userInput);

    const result =
      await this.embeddingOccupationModel.aggregate<EmbeddingOccupationDocument>(
        [
          {
            $vectorSearch: {
              index: 'default',
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: 1,
            },
          },
        ],
      );

    return result[0];
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (!value) return null;
    return Number(String(value).replace(/,/g, ''));
  }
}
