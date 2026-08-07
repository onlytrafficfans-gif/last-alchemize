import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getSurrealDB } from '../../lib/surrealdb';

interface Manifestation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  intention: string;
  images: string[];
  isFavorite: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export const manifestationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getSurrealDB();
    const result = await db.query(
      'SELECT * FROM manifestations WHERE userId = $userId ORDER BY createdAt DESC',
      { userId: ctx.user.id }
    ) as any[];
    
    return (result[0] || []) as Manifestation[];
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getSurrealDB();
      const result = await db.query(
        'SELECT * FROM manifestations WHERE id = $id AND userId = $userId',
        { id: input.id, userId: ctx.user.id }
      ) as any[];
      
      const items = result[0] as Manifestation[];
      return items && items.length > 0 ? items[0] : null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        intention: z.string(),
        images: z.array(z.string()),
        isFavorite: z.boolean(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getSurrealDB();
      const id = `manifestations:${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const manifestation = {
        id,
        userId: ctx.user.id,
        ...input,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.create('manifestations', manifestation);
      return manifestation;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        intention: z.string(),
        images: z.array(z.string()),
        isFavorite: z.boolean(),
        order: z.number(),
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
        description: input.description,
        category: input.category,
        intention: input.intention,
        images: input.images,
        isFavorite: input.isFavorite,
        order: input.order,
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
