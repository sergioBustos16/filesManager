import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoragePrefix } from './entities/storage-prefix.entity';

@Injectable()
export class StoragePrefixesSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(StoragePrefix)
    private readonly storagePrefixRepository: Repository<StoragePrefix>,
  ) {}

  async onModuleInit() {
    // Check if default prefix exists
    const existingDefault = await this.storagePrefixRepository.findOne({
      where: { slug: 'default' },
    });

    if (!existingDefault) {
      const defaultPrefix = this.storagePrefixRepository.create({
        slug: 'default',
        label: 'Default',
        isActive: true,
        sortOrder: 0,
      });
      await this.storagePrefixRepository.save(defaultPrefix);
      console.log('✅ Seeded default storage prefix');
    }
  }
}