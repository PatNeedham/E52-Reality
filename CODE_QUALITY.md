# Code Quality Setup

This repository is configured with ESLint, Prettier, and TypeScript for maintaining consistent code quality and formatting.

## Configuration Files

- **`.prettierrc`** - Prettier configuration for code formatting
- **`.prettierignore`** - Files and directories to ignore when formatting
- **`.eslintrc.json`** - Root ESLint configuration
- **`frontend/.eslintrc.json`** - Frontend-specific ESLint rules (extends root config)
- **`backend/.eslintrc.json`** - Backend-specific ESLint rules (extends root config)

## Available Scripts

Both frontend and backend have the following scripts available:

### Backend (`/backend`)

```bash
npm run lint        # Run ESLint and auto-fix issues
npm run typecheck   # Run TypeScript type checking
npm run format      # Format code with Prettier
```

### Frontend (`/frontend`)

```bash
npm run lint        # Run ESLint and auto-fix issues
npm run typecheck   # Run TypeScript type checking
npm run format      # Format code with Prettier
```

## GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/code-quality.yaml`) that runs on every pull request to:

1. **Type Checking** - Ensures TypeScript code compiles without errors
2. **Linting** - Checks code quality and style using ESLint
3. **Formatting** - Verifies code is properly formatted with Prettier
4. **Building** - Ensures both frontend and backend build successfully
5. **Testing** - Runs frontend tests

## Code Quality Rules

### ESLint Rules

- No unused variables (except those prefixed with `_`)
- Prefer `const` over `let` where possible
- No `var` usage
- Consistent coding patterns

### Prettier Rules

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width
- Trailing commas in ES5-compatible locations

## Running Code Quality Checks Locally

Before submitting a pull request, run these commands to ensure your code passes all checks:

```bash
# Backend
cd backend
npm run typecheck
npm run lint
npm run format

# Frontend
cd frontend
npm run typecheck
npm run lint
npm run format
```

## IDE Integration

### VS Code

Install these extensions for automatic formatting and linting:

- **ESLint** (ms-vscode.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

Add to your VS Code settings.json:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Other IDEs

Most modern IDEs support ESLint and Prettier. Check your IDE's documentation for setup instructions.
