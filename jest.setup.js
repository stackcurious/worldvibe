// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-lengt';
process.env.API_KEY_SALT = 'test-salt';

// Mock fetch API
global.fetch = jest.fn();

// Mock crypto subtle API
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        digest: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      },
    },
  });
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
  }),
}));

// Mock Redis
jest.mock('@/lib/db/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    hgetall: jest.fn(),
    hset: jest.fn(),
    expire: jest.fn(),
    rpush: jest.fn(),
    ltrim: jest.fn(),
    lrange: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnValue({
      hset: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      rpush: jest.fn().mockReturnThis(),
      ltrim: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
  },
}));

// Cleanup after tests
afterAll(async () => {
  // Add any cleanup code here
  jest.restoreAllMocks();
});