import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../folders/entities/folder.entity';
import { FolderPermission } from '../folders/entities/folder-permission.entity';
import { StorageService } from '../storage/storage.service';
import { FileStatus } from './entities/file-status.enum';
import { FileEntity } from './entities/file.entity';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  const mockFilesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockPermissionsRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockFoldersRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockStorageService = {
    createUploadRequest: jest.fn(),
    fileExists: jest.fn(),
    getDownloadUrl: jest.fn(),
    deleteObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFilesRepository,
        },
        {
          provide: getRepositoryToken(FolderPermission),
          useValue: mockPermissionsRepository,
        },
        {
          provide: getRepositoryToken(Folder),
          useValue: mockFoldersRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    jest.clearAllMocks();
  });

  function mockPermissionQueryForDeleteOnlyAccess() {
    mockPermissionsRepository.createQueryBuilder.mockImplementation(() => {
      const conditions: string[] = [];
      const builder = {} as {
        innerJoin: jest.Mock;
        where: jest.Mock;
        andWhere: jest.Mock;
        getCount: jest.Mock;
      };

      builder.innerJoin = jest.fn().mockReturnValue(builder);
      builder.where = jest.fn().mockImplementation((condition: string) => {
        conditions.push(condition);
        return builder;
      });
      builder.andWhere = jest.fn().mockImplementation((condition: string) => {
        conditions.push(condition);
        return builder;
      });
      builder.getCount = jest.fn().mockImplementation(async () => {
        const joined = conditions.join(' ');
        const allowsView =
          joined.includes('permission.canRead = true') &&
          joined.includes('permission.canWrite = true') &&
          joined.includes('permission.canDelete = true');

        return allowsView ? 1 : 0;
      });

      return builder;
    });
  }

  it('allows list when a matching group only has delete access', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });
    mockPermissionQueryForDeleteOnlyAccess();
    mockFilesRepository.find.mockResolvedValue([
      { id: 'file-1', folderId: 'folder-1', status: FileStatus.READY },
    ]);

    const result = await service.list('folder-1', ['Reviewers'], 'user-1');

    expect(result).toEqual([
      { id: 'file-1', folderId: 'folder-1', status: FileStatus.READY },
    ]);
  });

  it('allows downloadRequest when a matching group only has delete access', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });
    mockPermissionQueryForDeleteOnlyAccess();
    mockFilesRepository.findOne.mockResolvedValue({
      id: 'file-1',
      folderId: 'folder-1',
      path: 'folder-1/file.pdf',
      folder: { gcsBucketName: null },
    });
    mockStorageService.getDownloadUrl.mockResolvedValue('https://download.test/file.pdf');

    const result = await service.downloadRequest('folder-1', 'file-1', ['Reviewers'], 'user-1');

    expect(result).toEqual({ signedUrl: 'https://download.test/file.pdf' });
  });

  it('keeps uploadRequest restricted when a matching group only has delete access', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });
    mockPermissionQueryForDeleteOnlyAccess();

    await expect(
      service.uploadRequest(
        'folder-1',
        { mimeType: 'application/pdf', size: 1024 },
        ['Reviewers'],
        'user-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('still throws not found when downloadRequest cannot find the file', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });
    mockPermissionQueryForDeleteOnlyAccess();
    mockFilesRepository.findOne.mockResolvedValue(null);

    await expect(
      service.downloadRequest('folder-1', 'missing-file', ['Reviewers'], 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
