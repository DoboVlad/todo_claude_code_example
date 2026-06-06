import { Injectable } from '@nestjs/common';
import { Todo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, status?: string): Promise<Todo[]> {
    const where: { userId: string; completed?: boolean } = { userId };
    if (status === 'active') where.completed = false;
    else if (status === 'completed') where.completed = true;
    return this.prisma.todo.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  findOne(userId: string, id: string): Promise<Todo | null> {
    return this.prisma.todo.findFirst({ where: { id, userId } });
  }

  create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({ data: { userId, title: dto.title } });
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<Todo | null> {
    const existing = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return this.prisma.todo.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.todo.deleteMany({ where: { id, userId } });
    return count > 0;
  }
}
