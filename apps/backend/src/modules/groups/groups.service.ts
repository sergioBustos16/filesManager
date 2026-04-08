import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { AssignUserDto, CreateGroupDto } from './dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  list() {
    return this.groupsRepository.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateGroupDto) {
    const group = this.groupsRepository.create({ name: dto.name });
    return this.groupsRepository.save(group);
  }

  async assignUser(groupId: string, dto: AssignUserDto) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });
    if (!group) {
      throw new NotFoundException('Group not found.');
    }
    const user = await this.usersRepository.findOneBy({ id: dto.userId });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const alreadyInGroup = group.users.some(
      (existingUser) => existingUser.id === user.id,
    );
    if (!alreadyInGroup) {
      group.users.push(user);
      await this.groupsRepository.save(group);
    }

    return { success: true };
  }
}
