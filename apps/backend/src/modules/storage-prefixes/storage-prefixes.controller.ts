import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { StoragePrefixesService } from './storage-prefixes.service';
import { CreateStoragePrefixDto } from './dto/create-storage-prefix.dto';
import { UpdateStoragePrefixDto } from './dto/update-storage-prefix.dto';

@Controller('storage-prefixes')
export class StoragePrefixesController {
  constructor(private readonly storagePrefixesService: StoragePrefixesService) {}

  @Get()
  findAll() {
    return this.storagePrefixesService.findAll();
  }

  @Get('admin')
  findAllForAdmin() {
    return this.storagePrefixesService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storagePrefixesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStoragePrefixDto) {
    return this.storagePrefixesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoragePrefixDto) {
    return this.storagePrefixesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storagePrefixesService.remove(id);
  }
}