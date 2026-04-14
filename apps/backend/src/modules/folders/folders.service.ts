import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpsertPermissionDto } from './dto/upsert-permission.dto';
@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(FolderPermission)
    private readonly permissionsRepository: Repository<FolderPermission>,
    private readonly configService: ConfigService,
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
        .andWhere(
          '(permission.canRead = true OR permission.canWrite = true OR permission.canDelete = true)',
        )
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

  async create(createdById: string, dto: CreateFolderDto, groupNames: string[]) {
    if (!groupNames.includes('Admin')) {
      throw new ForbiddenException('Only admins can create folders.');
    }

    let gcsBucketName: string | null = null;
    const rawBucket = dto.gcsBucketName?.trim();
    if (rawBucket) {
      if (!groupNames.includes('Admin')) {
        throw new ForbiddenException('Only admins can assign a GCS bucket.');
      }
      const allowed =
        this.configService.get<string[]>('storage.gcsAllowedBuckets') ?? [];
      if (!allowed.includes(rawBucket)) {
        throw new BadRequestException(
          `GCS bucket "${rawBucket}" is not in the allowed list.`,
        );
      }
      gcsBucketName = rawBucket;
    }

    const folder = await this.foldersRepository.save(
      this.foldersRepository.create({
        name: dto.name,
        createdById,
        gcsBucketName,
      }),
    );

    if (dto.permissions?.length) {
      const permissions = dto.permissions.map((permission) =>
        this.normalizePermissionFlags({
          folderId: folder.id,
          groupId: permission.groupId,
          canRead: permission.canRead,
          canWrite: permission.canWrite,
          canDelete: permission.canDelete,
        }),
      );
      const createdPermissions = permissions.map((permission) =>
        this.permissionsRepository.create({
          ...permission,
        }),
      );
      await this.permissionsRepository.save(createdPermissions);
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

    const canAccess = folder.permissions.some(
      (permission) =>
        this.canAccessFolder(permission) &&
        groupNames.includes(permission.group.name),
    );
    if (!canAccess) {
      throw new ForbiddenException('No access for this folder.');
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
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only admins can change folder permissions.',
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

    const normalized = this.normalizePermissionFlags(dto);
    permission.canRead = normalized.canRead;
    permission.canWrite = normalized.canWrite;
    permission.canDelete = normalized.canDelete;

    return this.permissionsRepository.save(permission);
  }

  private canAccessFolder(permission: FolderPermission) {
    return permission.canRead || permission.canWrite || permission.canDelete;
  }

  private normalizePermissionFlags<T extends {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>(permission: T): T {
    return {
      ...permission,
      canRead: permission.canWrite ? true : permission.canRead,
    };
  }
}
