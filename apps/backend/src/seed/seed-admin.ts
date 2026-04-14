import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Group } from '../modules/groups/entities/group.entity';
import {
  SUPER_ADMIN_GROUP_NAME,
  syncSuperAdminAccount,
} from './super-admin-bootstrap';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const groupRepo = dataSource.getRepository(Group);

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME;

    if (!email) {
      throw new Error('SUPER_ADMIN_EMAIL must be set');
    }
    if (!password) {
      throw new Error('SUPER_ADMIN_PASSWORD must be set');
    }
    if (!name) {
      throw new Error('SUPER_ADMIN_NAME must be set');
    }

    const existingGroup = await groupRepo.findOne({
      where: { name: SUPER_ADMIN_GROUP_NAME },
    });
    await syncSuperAdminAccount(userRepo, groupRepo, { email, password, name });
    if (!existingGroup) {
      console.log(`Created group "${SUPER_ADMIN_GROUP_NAME}"`);
    } else {
      console.log(`Group "${SUPER_ADMIN_GROUP_NAME}" already exists`);
    }
    console.log(`Synchronized protected super admin ${email}`);
  } finally {
    await app.close();
  }
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
