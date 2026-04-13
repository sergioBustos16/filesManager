import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { buildTypeOrmConfig } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { FoldersModule } from './modules/folders/folders.module';
import { FilesModule } from './modules/files/files.module';
import { StoragePrefixesModule } from './modules/storage-prefixes/storage-prefixes.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: buildTypeOrmConfig,
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    FoldersModule,
    FilesModule,
    StoragePrefixesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
