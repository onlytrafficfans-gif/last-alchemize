import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getSurrealDB } from '../../lib/surrealdb';
import { getSupabase } from '../../lib/supabase';
import { TRPCError } from '@trpc/server';

interface ImagePath {
  imagePath?: string;
  images?: string[];
}

export const accountRouter = createTRPCRouter({
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getSurrealDB();

    console.log('[Account] Starting account deletion for:', userId);

    try {
      // Step 1: Collect all image paths before deletion
      const tables = [
        'manifestations',
        'goals',
        'tasks',
        'gratitude_entries',
        'appointments',
      ];

      const imagePaths: string[] = [];

      for (const table of tables) {
        const records = await db.query(`SELECT * FROM ${table} WHERE userId = $userId`, {
          userId,
        }) as any[];

        if (records[0]) {
          const rows = records[0];
          for (const row of rows) {
            if (row.imagePath) imagePaths.push(row.imagePath);
            if (row.images && Array.isArray(row.images)) {
              imagePaths.push(...row.images);
            }
          }
        }
      }

      console.log(`[Account] Found ${imagePaths.length} images to delete`);

      // Step 2: Delete all Supabase storage objects
      if (imagePaths.length > 0) {
        const supabase = getSupabase();

        for (const path of imagePaths) {
          try {
            await supabase.storage.from('user-uploads').remove([path]);
            console.log('[Account] Deleted image:', path);
          } catch (error) {
            console.error('[Account] Failed to delete image:', path, error);
          }
        }
      }

      // Step 3: Delete all user records from SurrealDB
      const deleteQueries = [
        'DELETE FROM manifestations WHERE userId = $userId',
        'DELETE FROM goals WHERE userId = $userId',
        'DELETE FROM goal_completions WHERE goalId IN (SELECT id FROM goals WHERE userId = $userId)',
        'DELETE FROM tasks WHERE userId = $userId',
        'DELETE FROM gratitude_entries WHERE userId = $userId',
        'DELETE FROM appointments WHERE userId = $userId',
        'DELETE FROM users WHERE id = $userId',
      ];

      for (const query of deleteQueries) {
        await db.query(query, { userId });
      }

      console.log('[Account] SurrealDB deletion complete for:', userId);

      return {
        success: true,
        message: 'Account and all associated data have been deleted',
      };
    } catch (error) {
      console.error('[Account] Deletion failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account. Please contact support.',
      });
    }
  }),

  deletionInventory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getSurrealDB();

    try {
      const inventory = {
        userId,
        surrealDb: {
          manifestations: 0,
          goals: 0,
          tasks: 0,
          gratitudeEntries: 0,
          appointments: 0,
          totalRecords: 0,
        },
        storage: {
          images: 0,
          totalSize: 0,
        },
        status: 'ready' as const,
      };

      const tables = [
        { name: 'manifestations', key: 'manifestations' },
        { name: 'goals', key: 'goals' },
        { name: 'tasks', key: 'tasks' },
        { name: 'gratitude_entries', key: 'gratitudeEntries' },
        { name: 'appointments', key: 'appointments' },
      ];

      for (const { name, key } of tables) {
        const result = await db.query(`SELECT COUNT() as count FROM ${name} WHERE userId = $userId`, {
          userId,
        }) as any[];

        if (result[0] && result[0].length > 0) {
          const count = result[0][0].count || 0;
          inventory.surrealDb[key as keyof typeof inventory.surrealDb] = count;
          inventory.surrealDb.totalRecords += count;
        }
      }

      return inventory;
    } catch (error) {
      console.error('[Account] Failed to generate deletion inventory:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve deletion inventory',
      });
    }
  }),
});
