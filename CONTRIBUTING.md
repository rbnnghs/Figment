# Contributing to Figment

Thank you for your interest in contributing to Figment! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Check Node.js version**: Ensure you have Node.js 22.0.0 or higher
4. **Install dependencies**: `npm install`
5. **Run pre-build checks**: `node scripts/pre-build.js`
6. **Build the project**: `npm run build`

> **Note**: For detailed development setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md)

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development mode
npm run dev

# Test the MCP server
npm run test:mcp
```

## Project Structure

- `src/` - Main source code
  - `main.ts` - Figma plugin entry point
  - `ui.tsx` - Plugin UI components
  - `extractor.ts` - Design data extraction logic
  - `mcp-server.ts` - MCP server implementation
  - `types.ts` - TypeScript type definitions
- `scripts/` - Build and utility scripts
- `docs/` - Documentation
- `bin/` - Executable scripts

## Code Style

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for public functions
- Use meaningful variable and function names

## Testing

Before submitting a pull request:

1. **Build the project**: `npm run build`
2. **Test the MCP server**: `npm run test:mcp`
3. **Test the plugin** in Figma
4. **Check for console errors** in the browser console

## Submitting Changes

1. **Create a feature branch** from `main`
2. **Make your changes** following the code style
3. **Test thoroughly** before submitting
4. **Write a clear commit message**
5. **Submit a pull request** with a detailed description

## Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(ui): add screenshot capture functionality`
- `fix(extractor): handle null node types gracefully`
- `docs(readme): update installation instructions`

## Issues and Bug Reports

When reporting issues:

1. **Check existing issues** first
2. **Provide detailed steps** to reproduce
3. **Include error messages** and console logs
4. **Describe expected vs actual behavior**
5. **Include system information** (OS, Figma version, etc.)

## Questions and Discussion

- **GitHub Issues** for bug reports and feature requests
- **GitHub Discussions** for questions and general discussion

## License

By contributing to Figment, you agree that your contributions will be licensed under the MIT License.
