import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    existsBy: jest.fn(),
    find: jest.fn(),
  };

  const mockGroupRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      groupIds: ['123e4567-e89b-12d3-a456-426614174000'],
    };

    it('should create a user successfully', async () => {
      // Mock repository responses
      mockUserRepository.existsBy.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockReturnValue({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed-password',
        groups: [],
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed-password',
        groups: [],
      });
      mockGroupRepository.find.mockResolvedValue([
        {
          id: createUserDto.groupIds[0],
          name: 'Test Group',
          users: [],
        },
      ]);
      mockGroupRepository.save.mockResolvedValue({
        id: createUserDto.groupIds[0],
        name: 'Test Group',
        users: [{ id: 'user-uuid' }],
      });

      // Execute
      const result = await service.createUser(createUserDto);

      // Verify
      expect(result).toEqual({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
      });
      expect(mockUserRepository.existsBy).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed-password',
        groups: [],
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockGroupRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: expect.anything() }),
          relations: ['users'],
        })
      );
      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.existsBy.mockResolvedValue(true);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'Email already exists.',
      );
    });

    it('should throw BadRequestException if no groupIds provided', async () => {
      const invalidDto = { ...createUserDto, groupIds: [] };
      // Ensure existsBy returns false so we get past the email check
      mockUserRepository.existsBy.mockResolvedValue(false);

      await expect(service.createUser(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createUser(invalidDto)).rejects.toThrow(
        'At least one group must be specified',
      );
    });

    it('should throw NotFoundException if group does not exist', async () => {
      mockUserRepository.existsBy.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockGroupRepository.find.mockResolvedValue([]); // No groups found

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        `Group(s) not found: ${createUserDto.groupIds[0]}`,
      );
    });

    it('should handle duplicate groupIds correctly', async () => {
      const dtoWithDuplicates = {
        ...createUserDto,
        groupIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174000', // duplicate
        ],
      };

      mockUserRepository.existsBy.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockReturnValue({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed-password',
        groups: [],
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed-password',
        groups: [],
      });
      mockGroupRepository.find.mockResolvedValue([
        {
          id: createUserDto.groupIds[0],
          name: 'Test Group',
          users: [],
        },
      ]);
      mockGroupRepository.save.mockResolvedValue({
        id: createUserDto.groupIds[0],
        name: 'Test Group',
        users: [{ id: 'user-uuid' }],
      });

      const result = await service.createUser(dtoWithDuplicates);

      expect(result).toEqual({
        id: 'user-uuid',
        email: createUserDto.email,
        name: createUserDto.name,
      });
      // Should only query for unique groupIds
      expect(mockGroupRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: expect.anything() }),
          relations: ['users'],
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all users with their groups', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          passwordHash: 'hash1',
          groups: [
            { id: 'group-1', name: 'Group 1' },
            { id: 'group-2', name: 'Group 2' },
          ],
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          passwordHash: 'hash2',
          groups: [
            { id: 'group-1', name: 'Group 1' },
          ],
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          groups: [
            { id: 'group-1', name: 'Group 1' },
            { id: 'group-2', name: 'Group 2' },
          ],
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          groups: [
            { id: 'group-1', name: 'Group 1' },
          ],
        },
      ]);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        relations: ['groups'],
      });
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});