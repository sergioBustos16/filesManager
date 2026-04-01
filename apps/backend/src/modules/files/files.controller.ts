import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { FilesService } from './files.service';
import { UploadRequestDto } from './dto/upload-request.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthUser } from '../../common/types';

@Controller('folders/:folderId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  list(@Param('folderId', ParseUUIDPipe) folderId: string, @CurrentUser() user: AuthUser) {
    return this.filesService.list(folderId, user.groups, user.sub);
  }

  @Post('upload-request')
  uploadRequest(
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadRequestDto,
  ) {
    return this.filesService.uploadRequest(folderId, dto, user.groups, user.sub);
  }

  @Post()
  create(
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFileDto,
  ) {
    return this.filesService.create(folderId, dto, user.groups, user.sub);
  }

  @Get(':fileId/download-request')
  downloadRequest(
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.downloadRequest(folderId, fileId, user.groups, user.sub);
  }

  @Delete(':fileId')
  delete(
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.delete(folderId, fileId, user.groups, user.sub);
  }
}
