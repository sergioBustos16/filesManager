import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AssignUserDto, CreateGroupDto } from './dto';
import { AdminGuard } from '../../common/admin.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  list() {
    return this.groupsService.list();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Post(':groupId/users')
  assign(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: AssignUserDto,
  ) {
    return this.groupsService.assignUser(groupId, dto);
  }
}
