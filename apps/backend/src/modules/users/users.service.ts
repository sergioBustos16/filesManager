import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthUser } from '../../common/types';
import { isProtectedSuperAdmin } from '../../common/authz';

@Injectable()
export class UsersService {
  private static readonly ADMIN_GROUP_NAME = 'Admin';

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
  ) {}

  async createUser(dto: CreateUserDto, actor: AuthUser) {
    // Check if email already exists
    const exists = await this.usersRepository.existsBy({ email: dto.email });
    if (exists) {
      throw new ConflictException('Email already exists.');
    }

    const effectiveGroupIds = await this.resolveEffectiveGroupIds(dto, actor);

    if (effectiveGroupIds.length === 0) {
      throw new BadRequestException('At least one group must be specified');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      isSuperAdmin: false,
      groups: [],
    });
    const savedUser = await this.usersRepository.save(user);

    const uniqueGroupIds = [...new Set(effectiveGroupIds)];

    const groups = await this.groupsRepository.find({
      where: { id: In(uniqueGroupIds) },
      relations: ['users'],
    });

    if (groups.length !== uniqueGroupIds.length) {
      const foundGroupIds = groups.map((g) => g.id);
      const missingGroupIds = uniqueGroupIds.filter(
        (id: string) => !foundGroupIds.includes(id),
      );
      throw new NotFoundException(`Group(s) not found: ${missingGroupIds.join(', ')}`);
    }

    for (const group of groups) {
      const alreadyInGroup = group.users?.some((u) => u.id === savedUser.id);
      if (!alreadyInGroup) {
        if (!group.users) {
          group.users = [];
        }
        group.users.push(savedUser);
        await this.groupsRepository.save(group);
      }
    }

    // Return user data without password
    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
    };
  }

  async findAll() {
    const users = await this.usersRepository.find({
      relations: ['groups'],
    });

    // Map to exclude password hash and format groups
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      groups: user.groups.map(group => ({
        id: group.id,
        name: group.name,
      })),
    }));
  }

  private async resolveEffectiveGroupIds(dto: CreateUserDto, actor: AuthUser) {
    const requestedGroupIds = [...new Set(dto.groupIds ?? [])];
    const adminGroup = await this.groupsRepository.findOne({
      where: { name: UsersService.ADMIN_GROUP_NAME },
    });
    const requestsAdminMembership =
      dto.isAdmin === true ||
      (!!adminGroup && requestedGroupIds.includes(adminGroup.id));

    if (!requestsAdminMembership) {
      return requestedGroupIds;
    }

    if (!isProtectedSuperAdmin(actor)) {
      throw new ForbiddenException(
        'Only the protected super admin can create admin users.',
      );
    }

    if (!adminGroup) {
      throw new NotFoundException('Admin group not found.');
    }

    return [...new Set([...requestedGroupIds, adminGroup.id])];
  }
}
