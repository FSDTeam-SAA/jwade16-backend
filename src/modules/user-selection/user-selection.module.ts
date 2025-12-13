import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSelectionController } from './user-selection.controller';
import { UserSelectionService } from './user-selection.service';
import { UserSelection, UserSelectionSchema } from './user-selection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSelection.name, schema: UserSelectionSchema },
    ]),
  ],
  controllers: [UserSelectionController],
  providers: [UserSelectionService],
  exports: [UserSelectionService],
})
export class UserSelectionModule {}
