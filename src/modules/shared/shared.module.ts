import { Module } from '@nestjs/common';
import { CloudinaryService } from './schemas/services/cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class SharedModule {}
