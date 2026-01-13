import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompensationController } from './compensation.controller';
import { CompensationService } from './compensation.service';
import { CompensationSchema } from './compensation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Compensation', schema: CompensationSchema },
    ]),
  ],
  controllers: [CompensationController],
  providers: [CompensationService],
  exports: [CompensationService],
})
export class CompensationModule {}
