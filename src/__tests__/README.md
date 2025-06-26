# Test Suite Documentation

This directory contains comprehensive unit tests for the Soapstone application.

## Overview

The test suite is built using Jest and provides coverage for all major components of the application including:

- Authentication (OAuth client, storage)
- Database utilities
- Firehose ingestion
- Page components and rendering
- Environment validation
- Utility functions

## Running Tests

### Prerequisites

Make sure you have installed the testing dependencies:

```bash
yarn install
```

### Available Commands

```bash
# Run all tests once
yarn test

# Run tests in watch mode (automatically re-runs when files change)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

### Test Configuration

Tests are configured in `package.json` with the following settings:

- **Test Environment**: Node.js
- **Test Pattern**: `**/__tests__/**/*.test.ts`
- **Setup File**: `src/__tests__/setup.ts`
- **Coverage**: Excludes lexicon files and the main index.ts

## Test Structure

```
src/__tests__/
├── db.test.ts           # Database utilities
├── geo.test.ts          # Geo URI parsing
├── id-resolver.test.ts  # Identity resolution
├── ingester.test.ts     # Firehose ingestion
├── setup.ts             # Jest setup and mocks
└── README.md            # This file
```

## Mocking Strategy

The test suite uses comprehensive mocking to isolate units under test:

### External Dependencies

- **@atproto/oauth-client-node**: Mocked OAuth client
- **@atproto/sync**: Mocked Firehose
- **@atproto/identity**: Mocked ID resolver
- **knex**: Mocked database client
- **uhtml/ssr**: Mocked template engine

### Database Mocking

Database operations are mocked using a chainable mock that simulates Knex query builder behavior:

```typescript
const mockDb = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  // ... etc
}
```

### Environment Variables

Test environment variables are set in `setup.ts` to ensure consistent test conditions.

## Test Categories

### Unit Tests

Each test file focuses on a specific module or component:

- **Authentication**: Tests OAuth client creation and session/state storage
- **Database**: Tests database connection, migration, and type interfaces
- **Utilities**: Tests helper functions like geo URI parsing and ID resolution
- **Ingestion**: Tests firehose event handling and data processing

### Integration Testing

While primarily unit tests, some tests verify integration between components:

- View utilities working with page components
- Database storage classes working with OAuth client
- Ingester handling various event types and database operations

## Coverage Goals

The test suite aims for high coverage across:

- **Functions**: All exported functions should be tested
- **Branches**: All conditional logic paths should be covered
- **Lines**: Most lines of code should be executed during tests
- **Edge Cases**: Error conditions and unusual inputs should be tested

## Writing New Tests

When adding new tests, follow these conventions:

### File Naming

- Test files should end with `.test.ts`
- Place test files in the appropriate subdirectory
- Mirror the source file structure in the test directory

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test implementation
    })

    it('should handle edge case', () => {
      // Test implementation
    })

    it('should throw error for invalid input', () => {
      // Test implementation
    })
  })
})
```

### Mocking Guidelines

1. Mock external dependencies at the module level
2. Use `jest.clearAllMocks()` in `beforeEach` to reset mock state
3. Mock return values that tests depend on
4. Verify that mocks are called with expected parameters

### Assertions

- Use descriptive test names that explain what is being tested
- Make assertions specific and meaningful
- Test both success and failure cases
- Verify mock calls when testing integration points

## Troubleshooting

### Common Issues

1. **Module path resolution**: Ensure the `moduleNameMapping` in Jest config matches your import paths
2. **Mock timing**: Use `jest.clearAllMocks()` if tests are interfering with each other
3. **Async operations**: Remember to `await` async operations and use `resolves`/`rejects` matchers

### Debug Tips

```bash
# Run a specific test file
yarn test auth/client.test.ts

# Run tests matching a pattern
yarn test --testNamePattern="should handle"

# Run with verbose output
yarn test --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests should pass in CI environments. The setup file configures environment variables and mocks to work without external dependencies.

## Maintenance

- Update tests when changing functionality
- Add tests for new features
- Remove tests for deprecated features
- Keep mocks up to date with actual API changes
- Review coverage reports to identify untested code paths