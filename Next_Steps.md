What's left (~1.5 hours):

Basic testing (30-45 min)
Documentation/README (30-45 min)
Final polish


Step 33: Add Basic Testing
Let's add some unit tests for the core business logic.
Create: src/__tests__/feature-flags.test.ts
typescriptimport { evaluateFeatureFlag, FlagRule } from '@/lib/feature-flags';

describe('Feature Flag Evaluation', () => {
  describe('Percentage Rollout', () => {
    it('should enable flag for users under threshold', () => {
      const rule: FlagRule = { type: 'percentage', value: 50 };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'user-1', environment: 'PROD' }
      );
      
      expect(result.enabled).toBeDefined();
      expect(result.reason).toContain('User hash');
    });

    it('should be deterministic for same user', () => {
      const rule: FlagRule = { type: 'percentage', value: 30 };
      
      const result1 = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'user-123', environment: 'PROD' }
      );
      
      const result2 = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'user-123', environment: 'PROD' }
      );
      
      expect(result1.enabled).toBe(result2.enabled);
    });
  });

  describe('Allowlist', () => {
    it('should enable for users in allowlist', () => {
      const rule: FlagRule = {
        type: 'allowlist',
        userIds: ['alice', 'bob'],
      };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'alice', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('User in allowlist');
    });

    it('should disable for users not in allowlist', () => {
      const rule: FlagRule = {
        type: 'allowlist',
        userIds: ['alice', 'bob'],
      };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'charlie', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('User not in allowlist');
    });
  });

  describe('AND Logic', () => {
    it('should enable only if all conditions are met', () => {
      const rule: FlagRule = {
        type: 'and',
        rules: [
          { type: 'allowlist', userIds: ['alice'] },
          { type: 'percentage', value: 100 },
        ],
      };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'alice', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(true);
    });

    it('should disable if any condition fails', () => {
      const rule: FlagRule = {
        type: 'and',
        rules: [
          { type: 'allowlist', userIds: ['alice'] },
          { type: 'percentage', value: 0 },
        ],
      };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'alice', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(false);
    });
  });

  describe('OR Logic', () => {
    it('should enable if any condition is met', () => {
      const rule: FlagRule = {
        type: 'or',
        rules: [
          { type: 'allowlist', userIds: ['bob'] },
          { type: 'allowlist', userIds: ['alice'] },
        ],
      };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        true,
        rule,
        { userId: 'alice', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(true);
    });
  });

  describe('Global Flag Disable', () => {
    it('should disable flag when globally disabled', () => {
      const rule: FlagRule = { type: 'percentage', value: 100 };
      
      const result = evaluateFeatureFlag(
        'test-flag',
        false, // globally disabled
        rule,
        { userId: 'user-1', environment: 'PROD' }
      );
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag is globally disabled');
    });
  });
});

Install testing dependencies:
bashnpm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest

Create Jest config: jest.config.js
javascriptconst nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)

Create: jest.setup.js
javascriptimport '@testing-library/jest-dom'

Update package.json to add test script:
json"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch"
}
