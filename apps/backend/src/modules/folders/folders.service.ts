import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpsertPermissionDto } from './dto/upsert-permission.dto';
import { StoragePrefix } from '../storage-prefixes/entities/storage-prefix.entity';
import { StoragePrefixesService } from '../storage-prefixes/storage-prefixes.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(FolderPermission)
    private readonly permissionsRepository: Repository<FolderPermission>,
    @InjectRepository(StoragePrefix)
    private readonly storagePrefixesRepository: Repository<StoragePrefix>,
    private readonly storagePrefixesService: StoragePrefixesService,
  ) {}

  async listForUser(groupNames: string[], userId: string) {
    if (groupNames.includes('Admin')) {
      return this.foldersRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['permissions', 'permissions.group'],
      });
    }

    const idSet = new Set<string>();

    const ownedRows = await this.foldersRepository.find({
      where: { createdById: userId },
      select: ['id'],
    });
    ownedRows.forEach((f) => idSet.add(f.id));

    if (groupNames.length) {
      const viaGroupFolders = await this.foldersRepository
        .createQueryBuilder('folder')
        .distinct(true)
        .innerJoin('folder.permissions', 'permission')
        .innerJoin('permission.group', 'group')
        .where('group.name IN (:...groupNames)', { groupNames })
        .andWhere('permission.canRead = true')
        .getMany();
      viaGroupFolders.forEach((f) => idSet.add(f.id));
    }

    if (!idSet.size) {
      return [];
    }

    return this.foldersRepository.find({
      where: { id: In([...idSet]) },
      relations: ['permissions', 'permissions.group'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createdById: string, dto: CreateFolderDto) {
    // Handle storage prefix assignment
    let storagePrefixId: string | undefined;

    if (dto.storagePrefixId) {
      // Check if the prefix exists and is active
      const prefixEntity = await this.storagePrefixesRepository.findOneBy({
        id: dto.storagePrefixId,
        isActive: true
      });

      if (prefixEntity) {
        storagePrefixId = prefixEntity.id;
      } else {
        // If prefix not found or not active, use default prefix
        const defaultPrefix = await this.storagePrefixesService.getDefaultPrefix();
        storagePrefixId = defaultPrefix.id;
      }
    }

    const folder = await this.foldersRepository.save(
      this.foldersRepository.create({
        name: dto.name,
        createdById,
        storagePrefixId,
      }),
    );

    if (dto.permissions?.length) {
      const permissions = dto.permissions.map((permission) =>
        this.permissionsRepository.create({
          folderId: folder.id,
          groupId: permission.groupId,
          canRead: permission.canRead,
          canWrite: permission.canWrite,
          canDelete: permission.canDelete,
        }),
      );
      await this.permissionsRepository.save(permissions);
    }

    return this.foldersRepository.findOne({
      where: { id: folder.id },
      relations: ['permissions', 'permissions.group'],
    });
  }

  async getByIdForUser(folderId: string, groupNames: string[], userId: string) {
    const folder = await this.foldersRepository.findOne({
      where: { id: folderId },
      relations: ['permissions', 'permissions.group'],
    });
    if (!folder) {
      throw new NotFoundException('Folder not found.');
    }

    if (groupNames.includes('Admin')) {
      return folder;
    }

    if (folder.createdById === userId) {
      return folder;
    }

    const canRead = folder.permissions.some(
      (permission) =>
        permission.canRead && groupNames.includes(permission.group.name),
    );
    if (!canRead) {
      throw new ForbiddenException('No read access for this folder.');
    }

    return folder;
  }

  async upsertPermission(
    folderId: string,
    dto: UpsertPermissionDto,
    userId: string,
    groupNames: string[],
  ) {
    const folder = await this.foldersRepository.findOneBy({ id: folderId });
    if (!folder) {
      throw new NotFoundException('Folder not found.');
    }

    const isAdmin = groupNames.includes('Admin');
    const isOwner = folder.createdById === userId;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only the folder owner or an admin can change permissions.',
      );
    }

    let permission = await this.permissionsRepository.findOne({
      where: { folderId, groupId: dto.groupId },
    });

    if (!permission) {
      permission = this.permissionsRepository.create({
        folderId,
        groupId: dto.groupId,
      });
    }

    permission.canRead = dto.canRead;
    permission.canWrite = dto.canWrite;
    permission.canDelete = dto.canDelete;

    return this.permissionsRepository.save(permission);
  }
}
