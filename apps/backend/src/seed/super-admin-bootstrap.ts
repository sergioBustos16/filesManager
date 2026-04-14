import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Group } from '../modules/groups/entities/group.entity';
import { User } from '../modules/users/entities/user.entity';

export const SUPER_ADMIN_GROUP_NAME = 'Admin';

type SuperAdminConfig = {
  email: string;
  password: string;
  name: string;
};

export async function syncSuperAdminAccount(
  userRepo: Repository<User>,
  groupRepo: Repository<Group>,
  config: SuperAdminConfig,
) {
  let adminGroup = await groupRepo.findOne({
    where: { name: SUPER_ADMIN_GROUP_NAME },
  });

  if (!adminGroup) {
    adminGroup = groupRepo.create({ name: SUPER_ADMIN_GROUP_NAME });
    adminGroup = await groupRepo.save(adminGroup);
  }

  const passwordHash = await bcrypt.hash(config.password, 10);
  const existingSuperAdmin = await userRepo.findOne({
    where: { isSuperAdmin: true },
    relations: ['groups'],
  });
  const userByEmail = await userRepo.findOne({
    where: { email: config.email },
    relations: ['groups'],
  });
  let user = userByEmail ?? existingSuperAdmin;

  if (!user) {
    user = userRepo.create({
      email: config.email,
      name: config.name,
      passwordHash,
      isSuperAdmin: true,
      groups: [adminGroup],
    });
    return userRepo.save(user);
  }

  if (
    existingSuperAdmin &&
    userByEmail &&
    existingSuperAdmin.id !== userByEmail.id
  ) {
    existingSuperAdmin.isSuperAdmin = false;
    await userRepo.save(existingSuperAdmin);
  }

  user.email = config.email;
  user.name = config.name;
  user.passwordHash = passwordHash;
  user.isSuperAdmin = true;

  const groups = user.groups ?? [];
  if (!groups.some((group) => group.id === adminGroup.id)) {
    user.groups = [...groups, adminGroup];
  }

  return userRepo.save(user);
}
