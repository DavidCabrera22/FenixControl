import { Module } from '@nestjs/common';
import { ThirdPartiesController } from './third-parties.controller';
import { ThirdPartiesService } from './third-parties.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThirdPartiesController],
  providers: [ThirdPartiesService],
})
export class ThirdPartiesModule {}
