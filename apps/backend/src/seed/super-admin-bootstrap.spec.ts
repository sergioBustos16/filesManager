import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Group } from '../modules/groups/entities/group.entity';
import { User } from '../modules/users/entities/user.entity';
import {
  SUPER_ADMIN_GROUP_NAME,
  syncSuperAdminAccount,
} from './super-admin-bootstrap';

jest.mock('bcrypt');

describe('syncSuperAdminAccount', () => {
  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<User>;

  const mockGroupRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Group>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the Admin group and a protected super admin when neither exists', async () => {
    (mockGroupRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    (mockGroupRepo.create as jest.Mock).mockImplementation((value) => value);
    (mockGroupRepo.save as jest.Mock).mockResolvedValue({
      id: 'admin-group-id',
      name: SUPER_ADMIN_GROUP_NAME,
    });
    (mockUserRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (mockUserRepo.create as jest.Mock).mockImplementation((value) => value);
    (mockUserRepo.save as jest.Mock).mockResolvedValue({});

    await syncSuperAdminAccount(mockUserRepo, mockGroupRepo, {
      email: 'super@example.com',
      password: 'password123',
      name: 'Super Admin',
    });

    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'super@example.com',
        name: 'Super Admin',
        isSuperAdmin: true,
      }),
    );
  });

  it('promotes an existing user to protected super admin and ensures Admin membership', async () => {
    const adminGroup = { id: 'admin-group-id', name: SUPER_ADMIN_GROUP_NAME };
    (mockGroupRepo.findOne as jest.Mock).mockResolvedValue(adminGroup);
    (mockUserRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-id',
        email: 'super@example.com',
        name: 'Existing User',
        isSuperAdmin: false,
        groups: [],
      });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (mockUserRepo.save as jest.Mock).mockResolvedValue({});

    await syncSuperAdminAccount(mockUserRepo, mockGroupRepo, {
      email: 'super@example.com',
      password: 'password123',
      name: 'Super Admin',
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Super Admin',
        isSuperAdmin: true,
        groups: [adminGroup],
      }),
    );
  });
});
