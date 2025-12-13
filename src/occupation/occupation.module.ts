import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Occupation, OccupationSchema } from './occupation.schema';
import { OccupationService } from './occupation.service';
import { OccupationController } from './occupation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Occupation.name, schema: OccupationSchema },
    ]),
  ],
  controllers: [OccupationController],
  providers: [OccupationService],
})
export class OccupationModule {}
