import { Module } from '@nestjs/common';
import { PaypowerController } from './paypower.controller';
import { PaypowerService } from './paypower.service';

@Module({
  controllers: [PaypowerController],
  providers: [PaypowerService],
  exports: [PaypowerService],
})
export class PaypowerModule {}
