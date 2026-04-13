import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoragePrefix } from './entities/storage-prefix.entity';

@Injectable()
export class StoragePrefixesService {
  constructor(
    @InjectRepository(StoragePrefix)
    private readonly storagePrefixesRepository: Repository<StoragePrefix>,
  ) {}

  async findAll(): Promise<StoragePrefix[]> {
    return this.storagePrefixesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async findAllForAdmin(): Promise<StoragePrefix[]> {
    return this.storagePrefixesRepository.find({
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async findOne(id: string): Promise<StoragePrefix> {
    const prefix = await this.storagePrefixesRepository.findOneBy({ id });
    if (!prefix) {
      throw new NotFoundException(`Storage prefix with ID ${id} not found`);
    }
    return prefix;
  }

  async findBySlug(slug: string): Promise<StoragePrefix | null> {
    return this.storagePrefixesRepository.findOneBy({ slug, isActive: true });
  }

  async getDefaultPrefix(): Promise<StoragePrefix> {
    const prefix = await this.storagePrefixesRepository.findOne({
      where: { slug: 'default', isActive: true },
    });
    if (!prefix) {
      throw new NotFoundException('Default storage prefix not found');
    }
    return prefix;
  }

  async create(data: Partial<StoragePrefix>): Promise<StoragePrefix> {
    const prefix = this.storagePrefixesRepository.create(data);
    return this.storagePrefixesRepository.save(prefix);
  }

  async update(id: string, data: Partial<StoragePrefix>): Promise<StoragePrefix> {
    const prefix = await this.findOne(id);
    Object.assign(prefix, data);
    return this.storagePrefixesRepository.save(prefix);
  }

  async remove(id: string): Promise<void> {
    const prefix = await this.findOne(id);
    await this.storagePrefixesRepository.remove(prefix);
  }
}