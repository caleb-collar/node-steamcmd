# Contributing to node-steamcmd

Thank you for your interest in contributing to node-steamcmd! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/node-steamcmd.git
   cd node-steamcmd
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development Workflow

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run linting:
   ```bash
   npm run lint
   ```
4. Run tests:
   ```bash
   npm test
   ```
5. Commit your changes with a descriptive message
6. Push to your fork and open a Pull Request

## Code Style

This project uses [Standard JS](https://standardjs.com/) for code formatting. Key points:

- 2 spaces for indentation
- No semicolons (Standard automatically adds them)
- Single quotes for strings
- No unused variables
- Space after keywords (`if`, `for`, `function`, etc.)

Run the linter to check your code:

```bash
npm run lint
```

## Testing

We use [Vitest](https://vitest.dev/) for testing. Tests are organized into:

- **Unit tests** (`tests/unit/`): Test individual functions in isolation
- **Integration tests** (`tests/integration/`): Test the module as a whole

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Writing Tests

- Place unit tests in `tests/unit/` with the naming convention `<module>.test.js`
- Use descriptive test names that explain the expected behavior
- Mock external dependencies (file system, network, child processes)
- Aim for >80% code coverage

Example test structure:

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("moduleName", () => {
  describe("functionName", () => {
    it("should do something when given valid input", () => {
      // Arrange
      const input = "test";

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

## Pull Request Guidelines

### Before Submitting

- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npm test` and ensure all tests pass
- [ ] Add tests for new functionality
- [ ] Update documentation if needed (README, JSDoc comments)
- [ ] Update CHANGELOG.md for user-facing changes

### PR Description

- Clearly describe what the PR does
- Reference any related issues (`Fixes #123`, `Closes #456`)
- Include before/after examples if applicable

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR

## Commit Messages

Follow conventional commit format when possible:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(api): add progress callback support
fix(download): handle network timeout errors
docs: update README with async/await examples
test(install): add tests for validation
```

## Reporting Issues

### Bug Reports

When filing a bug report, include:

1. Node.js version (`node --version`)
2. Operating system and version
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Error messages/stack traces

### Feature Requests

When requesting a feature:

1. Describe the use case
2. Explain the expected behavior
3. Provide examples if possible

## Project Structure

```
node-steamcmd/
├── bin/steamcmd          # CLI entry point
├── src/
│   ├── steamcmd.js       # Main module export
│   ├── download.js       # SteamCMD binary download
│   ├── install.js        # Steam app/workshop installation
│   └── env.js            # Platform-specific paths
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── types/
│   └── steamcmd.d.ts     # TypeScript definitions
└── package.json
```

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

## License

By contributing to node-steamcmd, you agree that your contributions will be licensed under the MIT License.
