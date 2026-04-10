import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
  ) {}

  async createUser(dto: CreateUserDto) {
    // Check if email already exists
    const exists = await this.usersRepository.existsBy({ email: dto.email });
    if (exists) {
      throw new ConflictException('Email already exists.');
    }

    // Validate that at least one group is provided
    if (!dto.groupIds || dto.groupIds.length === 0) {
      throw new BadRequestException('At least one group must be specified');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      groups: [],
    });
    const savedUser = await this.usersRepository.save(user);

    const uniqueGroupIds = [...new Set(dto.groupIds)];

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
      groups: user.groups.map(group => ({
        id: group.id,
        name: group.name,
      })),
    }));
  }
}