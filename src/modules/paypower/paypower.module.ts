import { Module } from '@nestjs/common';
import { PaypowerController } from './paypower.controller';
import { PaypowerService } from './paypower.service';
import { OpenAiService } from '../../openai.service';

@Module({
  controllers: [PaypowerController],
  providers: [PaypowerService, OpenAiService],
  exports: [PaypowerService],
})
export class PaypowerModule {}
