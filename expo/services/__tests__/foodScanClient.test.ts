import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { requestFoodAnalysis } from '../foodScanClient';
import { FoodAnalysisSchema } from '../foodAnalysisSchema';
import { parseOptionalNumber } from '../calorieAnalysisService';

const schema = z.object({ foods: z.array(z.string()).min(1) });
const response = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

describe('food scan contract', () => {
  test('sends the image and schema and validates the response', async () => {
    let body: Record<string, unknown> = {};
    const fetcher = (async (_url, init) => {
      body = JSON.parse(String(init?.body));
      expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
      return new Response(JSON.stringify({ object: { foods: ['banana'] } }));
    }) as typeof fetch;
    expect(await requestFoodAnalysis(schema, 'Zm9vZA==', 'Estimate food', { fetcher })).toEqual({ foods: ['banana'] });
    expect(body.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'Estimate food' }, { type: 'image', image: 'Zm9vZA==' }] }]);
    expect(body.schema).toBeDefined();
  });
  test('rejects an incomplete AI response', async () => {
    await expect(requestFoodAnalysis(schema, 'abc', 'scan', { fetcher: response({ object: { foods: [] } }) })).rejects.toThrow('incomplete results');
  });
  test('explains service failures instead of blaming the photo', async () => {
    await expect(requestFoodAnalysis(schema, 'abc', 'scan', { fetcher: response({}, 403) })).rejects.toThrow('unavailable for this app');
    await expect(requestFoodAnalysis(schema, 'abc', 'scan', { fetcher: response({}, 429) })).rejects.toThrow('busy');
  });
  test('aborts stalled requests', async () => {
    const fetcher = (async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })) as typeof fetch;
    await expect(requestFoodAnalysis(schema, 'abc', 'scan', { fetcher, timeoutMs: 10 })).rejects.toThrow('took too long');
  });
  test('blocks oversized photos before contacting the service', async () => {
    let called = false;
    const fetcher = (async () => { called = true; return new Response(); }) as typeof fetch;
    await expect(requestFoodAnalysis(schema, 'a'.repeat(8 * 1024 * 1024 + 1), 'scan', { fetcher })).rejects.toThrow('smaller');
    expect(called).toBe(false);
  });
  test('nutrition schema rejects negative values and non-food photos', () => {
    expect(FoodAnalysisSchema.safeParse({ foods: [] }).success).toBe(false);
    const foodSchema = FoodAnalysisSchema.shape.foods.element;
    expect(foodSchema.shape.calories.safeParse(-1).success).toBe(false);
    expect(foodSchema.shape.calories.safeParse(Infinity).success).toBe(false);
  });
  test('manual nutrition values reject partial numbers and negatives', () => {
    expect(parseOptionalNumber('12g')).toBeNull();
    expect(parseOptionalNumber('-12')).toBeNull();
    expect(parseOptionalNumber('Infinity')).toBeNull();
    expect(parseOptionalNumber('0')).toBe(0);
    expect(parseOptionalNumber('12.5')).toBe(12.5);
  });
});
