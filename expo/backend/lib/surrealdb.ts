import Surreal from 'surrealdb.js';

let db: Surreal | null = null;
let initializationPromise: Promise<Surreal> | null = null;
let initError: Error | null = null;
let isInitialized = false;

export async function initSurrealDB(maxRetries = 3): Promise<Surreal> {
  if (isInitialized && db) {
    return db;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        db = new Surreal();

        const endpoint = process.env.RORK_DB_ENDPOINT;
        const namespace = process.env.RORK_DB_NAMESPACE;
        const token = process.env.RORK_DB_TOKEN;

        if (!endpoint || !namespace || !token) {
          throw new Error('Missing required SurrealDB configuration: RORK_DB_ENDPOINT, RORK_DB_NAMESPACE, RORK_DB_TOKEN');
        }

        await db.connect(endpoint, {
          namespace,
          database: namespace,
          auth: token,
        });

        isInitialized = true;
        initError = null;
        console.log('[SurrealDB] Connected successfully');
        return db;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        db = null;

        const remainingAttempts = maxRetries - attempt - 1;
        if (remainingAttempts > 0) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.error(`[SurrealDB] Connection failed (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delayMs}ms:`, lastError.message);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    initError = lastError || new Error('Unknown SurrealDB initialization error');
    console.error('[SurrealDB] Failed to initialize after', maxRetries, 'attempts:', initError.message);
    throw initError;
  })();

  return initializationPromise;
}

export async function getSurrealDB(): Promise<Surreal> {
  if (!isInitialized || !db) {
    throw new Error('SurrealDB not initialized. Call initSurrealDB() first.');
  }
  return db;
}

export function isReady(): boolean {
  return isInitialized && db !== null && initError === null;
}

export function getInitError(): Error | null {
  return initError;
}

export interface User {
  [key: string]: unknown;
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}
