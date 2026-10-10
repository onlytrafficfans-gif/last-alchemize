import { z } from 'zod';

type AiMessage = { role: 'user' | 'assistant'; content: string | ({ type: 'text'; text: string } | { type: 'image'; image: string })[] };
type RequestOptions = { fetcher?: typeof fetch; timeoutMs?: number };

/** Existing Rork contract: POST /llm/object {messages, schema} -> {object}. */
export async function requestFoodAnalysis<T extends z.ZodType>(
  schema: T,
  imageBase64: string,
  prompt: string,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  if (!imageBase64 || imageBase64.length > 8 * 1024 * 1024) {
    throw new Error('Choose a smaller food photo and try again.');
  }
  return requestAiObject(schema, [{ role: 'user', content: [
    { type: 'text', text: prompt }, { type: 'image', image: imageBase64 },
  ] }], 'Food analysis', options);
}

export async function requestAiObject<T extends z.ZodType>(
  schema: T, messages: AiMessage[], feature: string, options: RequestOptions = {},
): Promise<z.infer<T>> {
  const base = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
  const endpoint = new URL('/llm/object', base);
  if (endpoint.protocol !== 'https:') throw new Error(`${feature} requires a secure service connection.`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);
  try {
    const response = await (options.fetcher ?? fetch)(endpoint.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        schema: z.toJSONSchema(schema),
      }),
    });
    if (!response.ok) {
      if (response.status === 429) throw new Error(`${feature} is busy. Wait a moment and retry, or enter values manually.`);
      if (response.status === 401 || response.status === 403) throw new Error(`${feature} is unavailable for this app. You can still enter values manually.`);
      throw new Error(`${feature} could not complete this request. Retry or enter values manually.`);
    }
    const data: unknown = await response.json();
    const envelope = z.object({ object: z.unknown() }).safeParse(data);
    if (!envelope.success) throw new Error(`${feature} returned incomplete results. Retry or enter values manually.`);
    const analysis = schema.safeParse(envelope.data.object);
    if (!analysis.success) throw new Error(`${feature} returned incomplete results. Retry or enter values manually.`);
    return analysis.data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`${feature} took too long. Check your connection and retry, or enter values manually.`);
    if (error instanceof TypeError) throw new Error(`Could not reach ${feature.toLowerCase()}. Check your internet connection and retry.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
