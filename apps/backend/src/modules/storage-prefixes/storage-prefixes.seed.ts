import { DataSource } from 'typeorm';
import { StoragePrefix } from './entities/storage-prefix.entity';

export async function seedStoragePrefixes(dataSource: DataSource) {
  const repository = dataSource.getRepository(StoragePrefix);

  // Check if default prefix already exists
  const existingDefault = await repository.findOne({
    where: { slug: 'default' },
  });

  if (!existingDefault) {
    const defaultPrefix = repository.create({
      slug: 'default',
      label: 'Default',
      isActive: true,
      sortOrder: 0,
    });
    await repository.save(defaultPrefix);
    console.log('Created default storage prefix');
  } else {
    console.log('Default storage prefix already exists');
  }
}