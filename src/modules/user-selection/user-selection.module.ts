import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSelectionController } from './user-selection.controller';
import { UserSelectionService } from './user-selection.service';
import { UserSelection, UserSelectionSchema } from './user-selection.schema';
import {
  Occupation,
  OccupationSchema,
} from '../../occupation/occupation.schema';

import { PaypowerModule } from '../paypower/paypower.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSelection.name, schema: UserSelectionSchema },
      { name: Occupation.name, schema: OccupationSchema },
    ]),
    PaypowerModule,
  ],
  controllers: [UserSelectionController],
  providers: [UserSelectionService],
  exports: [UserSelectionService],
})
export class UserSelectionModule {}
