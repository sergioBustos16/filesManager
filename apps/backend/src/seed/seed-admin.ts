import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Group } from '../modules/groups/entities/group.entity';

const ADMIN_GROUP_NAME = 'Admin';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const groupRepo = dataSource.getRepository(Group);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME;

    if (!email) {
      throw new Error('ADMIN_EMAIL must be set');
    }
    if (!password) {
      throw new Error('ADMIN_PASSWORD must be set');
    }
    if (!name) {
      throw new Error('ADMIN_NAME must be set');
    }

    let group = await groupRepo.findOne({ where: { name: ADMIN_GROUP_NAME } });
    if (!group) {
      group = groupRepo.create({ name: ADMIN_GROUP_NAME });
      await groupRepo.save(group);
      console.log(`Created group "${ADMIN_GROUP_NAME}"`);
    } else {
      console.log(`Group "${ADMIN_GROUP_NAME}" already exists`);
    }

    let user = await userRepo.findOne({
      where: { email },
      relations: ['groups'],
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = userRepo.create({
        email,
        name,
        passwordHash,
        groups: [group],
      });
      await userRepo.save(user);
      console.log(
        `Created admin user ${email} (password from ADMIN_PASSWORD or default)`,
      );
    } else {
      const inAdmin = user.groups?.some((g) => g.name === ADMIN_GROUP_NAME);
      if (!inAdmin) {
        user.groups = [...(user.groups ?? []), group];
        await userRepo.save(user);
        console.log(`Added ${email} to "${ADMIN_GROUP_NAME}"`);
      } else {
        console.log(`User ${email} is already in "${ADMIN_GROUP_NAME}"`);
      }
    }
  } finally {
    await app.close();
  }
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
