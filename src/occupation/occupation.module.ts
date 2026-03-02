import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Occupation, OccupationSchema } from './occupation.schema';
import { OccupationService } from './occupation.service';
import { OccupationController } from './occupation.controller';
import {
  embeddingOccupation,
  embeddingOccupationSchema,
} from '../modules/embedding-occupation/embedding-occupation.schema';
import { OpenAiService } from '../openai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Occupation.name, schema: OccupationSchema },
      { name: embeddingOccupation.name, schema: embeddingOccupationSchema },
    ]),
  ],
  controllers: [OccupationController],
  providers: [OccupationService, OpenAiService],
})
export class OccupationModule {}
