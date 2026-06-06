import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosService } from './todos.service';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('status') status?: string) {
    return this.todosService.findAll(user.id, status);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    const todo = await this.todosService.findOne(user.id, id);
    if (!todo) throw new NotFoundException();
    return todo;
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTodoDto) {
    return this.todosService.create(user.id, dto);
  }

  @Patch(':id')
  async update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateTodoDto) {
    const todo = await this.todosService.update(user.id, id, dto);
    if (!todo) throw new NotFoundException();
    return todo;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    const deleted = await this.todosService.remove(user.id, id);
    if (!deleted) throw new NotFoundException();
  }
}
