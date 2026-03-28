import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Occupation, OccupationDocument } from './occupation.schema';
import {
  JobPosting,
  JobPostingDocument,
} from '../modules/job-ingestion/job-posting.schema';
import {
  embeddingOccupation,
  EmbeddingOccupationDocument,
} from '../modules/embedding-occupation/embedding-occupation.schema';
import { OpenAiService } from '../openai.service';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
    private readonly occupationModel: Model<OccupationDocument>,
    @InjectModel(JobPosting.name)
    private readonly jobPostingModel: Model<JobPostingDocument>,
    @InjectModel(embeddingOccupation.name)
    private readonly embeddingOccupationModel: Model<EmbeddingOccupationDocument>,
    private readonly openAiService: OpenAiService,
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
    const [occupationTitles, jobTitles] = await Promise.all([
      this.occupationModel
        .distinct('OCC_TITLE', { A_MEDIAN: { $gt: 0 } })
        .exec(),
      this.jobPostingModel
        .distinct('title', {
          $or: [{ salaryMin: { $gt: 0 } }, { salaryMax: { $gt: 0 } }],
        })
        .exec(),
    ]);

    const data = this.normalizeAndDedupeTitles([
      ...occupationTitles,
      ...jobTitles,
    ]);

    await this.syncEmbeddingTitles(data);

    return data;
  }

  async generateEmbeddingsForAll(limit?: number) {
    const occupations = await this.embeddingOccupationModel.find({
      $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
    });

    const pending =
      typeof limit === 'number' ? occupations.slice(0, limit) : occupations;

    console.log(`Found ${pending.length} occupations without embeddings`);

    for (const occ of pending) {
      if (!occ.title) {
        continue;
      }

      const embedding = await this.openAiService.createEmbedding(occ.title);

      occ.embedding = embedding;
      await occ.save();

      console.log(`Embedding saved for: ${occ.title}`);
    }

    return `All embeddings generated! Total: ${pending.length}`;
  }

  private normalizeAndDedupeTitles(
    rawTitles: Array<string | null | undefined>,
  ): string[] {
    const titleMap = new Map<string, string>();

    for (const rawTitle of rawTitles) {
      if (typeof rawTitle !== 'string') {
        continue;
      }

      const cleaned = this.cleanTitleForList(rawTitle);
      if (!cleaned) {
        continue;
      }

      const normalized = cleaned.toLowerCase();
      const existing = titleMap.get(normalized);

      if (!existing || cleaned.length < existing.length) {
        titleMap.set(normalized, cleaned);
      }
    }

    return [...titleMap.values()].sort((a, b) => a.localeCompare(b));
  }

  private cleanTitleForList(rawTitle: string): string {
    return rawTitle
      .replaceAll('\uFFFD', ' ')
      .replaceAll(/[?]{2,}/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/^[^\p{L}\p{N}(.]+/gu, '')
      .replaceAll(/[^\p{L}\p{N})]+$/gu, '')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  private async syncEmbeddingTitles(titles: string[]): Promise<void> {
    if (titles.length === 0) {
      return;
    }

    const existingDocs = await this.embeddingOccupationModel
      .find({}, { title: 1, _id: 0 })
      .lean()
      .exec();

    const existing = new Set(
      existingDocs
        .map((doc) =>
          typeof doc.title === 'string'
            ? doc.title.replaceAll(/\s+/g, ' ').trim().toLowerCase()
            : '',
        )
        .filter(Boolean),
    );

    const newTitles = titles.filter(
      (title) =>
        !existing.has(title.replaceAll(/\s+/g, ' ').trim().toLowerCase()),
    );

    if (newTitles.length > 0) {
      await this.embeddingOccupationModel.insertMany(
        newTitles.map((title) => ({ title })),
        { ordered: false },
      );
      console.log(
        `Inserted ${newTitles.length} new occupation titles into embeddingOccupation`,
      );
    }

    await this.generateEmbeddingsForAll(20);
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
    return Number(String(value).replaceAll(',', ''));
  }
}
