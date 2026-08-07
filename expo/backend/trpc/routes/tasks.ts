import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getSurrealDB } from '../../lib/surrealdb';

export const tasksRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getSurrealDB();
    const result = await db.query(
      'SELECT * FROM tasks WHERE userId = $userId ORDER BY orderIndex, createdAt DESC',
      { userId: ctx.user.id }
    ) as any[];
    
    return result[0] || [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        notes: z.string(),
        dueDate: z.number().nullable(),
        dueTime: z.string().nullable(),
        priority: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getSurrealDB();
      const id = `tasks:${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const task = {
        id,
        userId: ctx.user.id,
        ...input,
        isDone: false,
        orderIndex: 0,
        completedDate: null,
        reminderEnabled: false,
        reminderTime: null,
        notificationId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.create('tasks', task);
      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        notes: z.string(),
        isDone: z.boolean(),
        dueDate: z.number().nullable(),
        dueTime: z.string().nullable(),
        priority: z.string().nullable(),
        order: z.number(),
        completedDate: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getSurrealDB();

      const existing = await db.select(input.id) as any;
      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      const updated = await db.update(input.id, {
        title: input.title,
        notes: input.notes,
        isDone: input.isDone,
        dueDate: input.dueDate,
        dueTime: input.dueTime,
        priority: input.priority,
        orderIndex: input.order,
        completedDate: input.completedDate,
        updatedAt: Date.now(),
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getSurrealDB();

      const existing = await db.select(input.id) as any;
      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      await db.delete(input.id);
      return { success: true };
    }),
});
