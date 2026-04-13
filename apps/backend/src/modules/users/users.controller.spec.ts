import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminGuard } from '../../common/admin.guard';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        AdminGuard,
        JwtAuthGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        groupIds: ['123e4567-e89b-12d3-a456-426614174000'],
      };

      const expectedResult = {
        id: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUsersService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should propagate errors from service', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        groupIds: ['123e4567-e89b-12d3-a456-426614174000'],
      };

      mockUsersService.createUser.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedResult = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          groups: [{ id: 'group-1', name: 'Group 1' }],
        },
      ];

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should propagate errors from service', async () => {
      mockUsersService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });
});