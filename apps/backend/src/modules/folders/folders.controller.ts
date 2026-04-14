import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpsertPermissionDto } from './dto/upsert-permission.dto';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthUser } from '../../common/types';
import { AdminGuard } from '../../common/admin.guard';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.foldersService.listForUser(user.groups, user.sub);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFolderDto) {
    return this.foldersService.create(user.sub, dto, user.groups);
  }

  @Get(':folderId')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ) {
    return this.foldersService.getByIdForUser(folderId, user.groups, user.sub);
  }

  @Put(':folderId/permissions')
  upsertPermission(
    @CurrentUser() user: AuthUser,
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Body() dto: UpsertPermissionDto,
  ) {
    return this.foldersService.upsertPermission(
      folderId,
      dto,
      user.sub,
      user.groups,
    );
  }
}
