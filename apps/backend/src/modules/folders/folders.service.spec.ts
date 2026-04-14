import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Folder } from './entities/folder.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { FoldersService } from './folders.service';

describe('FoldersService', () => {
  let service: FoldersService;

  const mockFoldersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPermissionsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        {
          provide: getRepositoryToken(Folder),
          useValue: mockFoldersRepository,
        },
        {
          provide: getRepositoryToken(FolderPermission),
          useValue: mockPermissionsRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
    jest.clearAllMocks();
  });

  it('includes folders in listForUser when a matching group only has delete access', async () => {
    mockFoldersRepository.find.mockResolvedValueOnce([]);
    mockFoldersRepository.createQueryBuilder.mockImplementation(() => {
      const conditions: string[] = [];
      const builder = {
        distinct: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation((condition: string) => {
          conditions.push(condition);
          return builder;
        }),
        andWhere: jest.fn().mockImplementation((condition: string) => {
          conditions.push(condition);
          return builder;
        }),
        getMany: jest.fn().mockImplementation(async () => {
          const joined = conditions.join(' ');
          const hasViewCondition =
            joined.includes('permission.canRead = true') &&
            joined.includes('permission.canWrite = true') &&
            joined.includes('permission.canDelete = true');

          return hasViewCondition ? [{ id: 'folder-delete-only' }] : [];
        }),
      };

      return builder;
    });
    mockFoldersRepository.find.mockResolvedValueOnce([
      { id: 'folder-delete-only', name: 'Folder Delete Only' },
    ]);

    const result = await service.listForUser(['Reviewers'], 'user-1');

    expect(result).toEqual([
      { id: 'folder-delete-only', name: 'Folder Delete Only' },
    ]);
  });

  it('allows getByIdForUser when a matching group only has delete access', async () => {
    const folder = {
      id: 'folder-1',
      createdById: 'owner-1',
      permissions: [
        {
          canRead: false,
          canWrite: false,
          canDelete: true,
          group: { name: 'Reviewers' },
        },
      ],
    };
    mockFoldersRepository.findOne.mockResolvedValue(folder);

    const result = await service.getByIdForUser('folder-1', ['Reviewers'], 'user-1');

    expect(result).toBe(folder);
  });

  it('normalizes create permissions so write access also saves read access', async () => {
    const dto: CreateFolderDto = {
      name: 'Invoices',
      permissions: [
        {
          groupId: 'group-1',
          canRead: false,
          canWrite: true,
          canDelete: false,
        },
      ],
    };

    mockFoldersRepository.create.mockImplementation((value) => value);
    mockFoldersRepository.save.mockResolvedValue({ id: 'folder-1' });
    mockPermissionsRepository.create.mockImplementation((value) => value);
    mockPermissionsRepository.save.mockResolvedValue(undefined);
    mockFoldersRepository.findOne.mockResolvedValue({
      id: 'folder-1',
      name: 'Invoices',
      permissions: [],
    });

    await service.create('user-1', dto, ['Admin']);

    expect(mockPermissionsRepository.create).toHaveBeenCalledWith({
      folderId: 'folder-1',
      groupId: 'group-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
    });
  });

  it('normalizes upsertPermission so write access also saves read access', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });
    mockPermissionsRepository.findOne.mockResolvedValue({
      id: 'perm-1',
      folderId: 'folder-1',
      groupId: 'group-1',
      canRead: false,
      canWrite: false,
      canDelete: false,
    });
    mockPermissionsRepository.save.mockImplementation(async (value) => value);

    const result = await service.upsertPermission(
      'folder-1',
      {
        groupId: 'group-1',
        canRead: false,
        canWrite: true,
        canDelete: false,
      },
      'owner-1',
      ['Admin'],
    );

    expect(result).toMatchObject({
      canRead: true,
      canWrite: true,
      canDelete: false,
    });
  });

  it('rejects upsertPermission when the caller owns the folder but is not an admin', async () => {
    mockFoldersRepository.findOneBy.mockResolvedValue({
      id: 'folder-1',
      createdById: 'owner-1',
    });

    await expect(
      service.upsertPermission(
        'folder-1',
        {
          groupId: 'group-1',
          canRead: true,
          canWrite: false,
          canDelete: false,
        },
        'owner-1',
        ['Editors'],
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects create when the caller is not in the Admin group', async () => {
    await expect(
      service.create(
        'user-1',
        {
          name: 'Restricted Folder',
          permissions: [],
        },
        ['Editors'],
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
