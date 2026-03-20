import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingOccupationService {
  async handleJobIngestionCompleted(input: {
    source: string;
    inserted: number;
    updated: number;
    fetched: number;
  }): Promise<void> {
    // Optional hook point for future embedding refresh workflows.
    // Keeps ingestion pipeline extensible without coupling to embedding internals.
    console.log(
      `[EmbeddingOccupationService] sync completed for ${input.source}: fetched=${input.fetched}, inserted=${input.inserted}, updated=${input.updated}`,
    );
  }
}
