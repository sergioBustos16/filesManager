import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { FileStatus } from './entities/file-status.enum';
import { StorageService } from '../storage/storage.service';
import { UploadRequestDto } from './dto/upload-request.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { FolderPermission } from '../folders/entities/folder-permission.entity';
import { Folder } from '../folders/entities/folder.entity';
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @InjectRepository(FolderPermission)
    private readonly permissionsRepository: Repository<FolderPermission>,
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    private readonly storageService: StorageService,
  ) {}

  async list(folderId: string, groupNames: string[], userId: string) {
    await this.assertCanRead(folderId, groupNames, userId);
    return this.filesRepository.find({
      where: { folderId, status: FileStatus.READY },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadRequest(
    folderId: string,
    dto: UploadRequestDto,
    groupNames: string[],
    userId: string,
  ) {
    await this.assertCanWrite(folderId, groupNames, userId);
    this.validateUpload(dto.mimeType, dto.size);
    const fileId = randomUUID();

    // Get the folder to retrieve the storage prefix
    const folder = await this.foldersRepository.findOne({
      where: { id: folderId },
      relations: ['storagePrefix'],
    });

    const prefixSlug = folder?.storagePrefix?.slug;
    return this.storageService.createUploadRequest(
      folderId,
      fileId,
      dto.mimeType,
      prefixSlug,
    );
  }

  async create(
    folderId: string,
    dto: CreateFileDto,
    groupNames: string[],
    userId: string,
  ) {
    await this.assertCanWrite(folderId, groupNames, userId);

    // Verify the file exists in storage before registering metadata
    const exists = await this.storageService.fileExists(dto.path);
    if (!exists) {
      throw new NotFoundException(
        'File not found in storage. Please upload first.',
      );
    }

    const file = this.filesRepository.create({
      folderId,
      name: dto.name,
      mimeType: dto.mimeType,
      size: dto.size,
      path: dto.path,
      status: FileStatus.READY,
      createdById: userId,
    });
    return this.filesRepository.save(file);
  }

  async downloadRequest(
    folderId: string,
    fileId: string,
    groupNames: string[],
    userId: string,
  ) {
    await this.assertCanRead(folderId, groupNames, userId);
    const file = await this.filesRepository.findOneBy({ id: fileId, folderId });
    if (!file) {
      throw new NotFoundException('File not found.');
    }
    const signedUrl = await this.storageService.getDownloadUrl(file.path);
    return { signedUrl };
  }

  async delete(
    folderId: string,
    fileId: string,
    groupNames: string[],
    userId: string,
  ) {
    await this.assertCanDelete(folderId, groupNames, userId);
    const file = await this.filesRepository.findOneBy({ id: fileId, folderId });
    if (!file) {
      throw new NotFoundException('File not found.');
    }
    await this.storageService.deleteObject(file.path);
    await this.filesRepository.remove(file);
    return { success: true };
  }

  private async assertCanRead(
    folderId: string,
    groupNames: string[],
    userId: string,
  ) {
    return this.assertPermission(folderId, groupNames, userId, 'canRead');
  }

  private async assertCanWrite(
    folderId: string,
    groupNames: string[],
    userId: string,
  ) {
    return this.assertPermission(folderId, groupNames, userId, 'canWrite');
  }

  private async assertCanDelete(
    folderId: string,
    groupNames: string[],
    userId: string,
  ) {
    return this.assertPermission(folderId, groupNames, userId, 'canDelete');
  }

  private async assertPermission(
    folderId: string,
    groupNames: string[],
    userId: string,
    permission: 'canRead' | 'canWrite' | 'canDelete',
  ) {
    if (groupNames.includes('Admin')) {
      return;
    }
    const folder = await this.foldersRepository.findOneBy({ id: folderId });
    if (folder?.createdById === userId) {
      return;
    }
    if (!groupNames.length) {
      throw new ForbiddenException(
        `No ${permission.replace('can', '').toLowerCase()} access for this folder.`,
      );
    }
    const count = await this.permissionsRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.group', 'group')
      .where('permission.folderId = :folderId', { folderId })
      .andWhere('group.name IN (:...groupNames)', { groupNames })
      .andWhere(`permission.${permission} = true`)
      .getCount();
    if (!count) {
      throw new ForbiddenException(
        `No ${permission.replace('can', '').toLowerCase()} access for this folder.`,
      );
    }
  }

  private validateUpload(mimeType: string, size: number) {
    const imageMimes = ['image/png', 'image/jpeg', 'image/webp'];
    const docMimes = ['application/pdf'];
    const knownMime = [...imageMimes, ...docMimes].includes(mimeType);
    if (!knownMime) {
      throw new UnprocessableEntityException('MIME type is not allowed.');
    }

    const maxSize = imageMimes.includes(mimeType)
      ? Number(process.env.UPLOAD_MAX_IMAGE_BYTES ?? 25 * 1024 * 1024)
      : Number(process.env.UPLOAD_MAX_PDF_BYTES ?? 50 * 1024 * 1024);

    if (size > maxSize) {
      throw new UnprocessableEntityException(
        'File size exceeds allowed limit.',
      );
    }
  }
}
