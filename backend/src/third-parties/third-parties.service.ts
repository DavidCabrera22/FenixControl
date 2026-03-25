import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';

@Injectable()
export class ThirdPartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateThirdPartyDto) {
    return this.prisma.thirdParty.create({ data: dto });
  }

  async findAll() {
    return this.prisma.thirdParty.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.thirdParty.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ThirdParty ${id} not found`);
    return record;
  }

  async update(id: string, dto: UpdateThirdPartyDto) {
    await this.findOne(id);
    return this.prisma.thirdParty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.thirdParty.delete({ where: { id } });
  }
}
