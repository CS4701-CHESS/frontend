# CLAUDE.md - Guidelines for CS4701 Chess Frontend

## Build Commands
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build project for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint for code linting

## Code Style Guidelines
- **Imports**: Group imports by type (React, Next.js, custom components, types)
- **Types**: Use TypeScript types, avoid `any` when possible
- **Components**: Functional components with React hooks, client components with "use client" directive
- **Tailwind**: Use Tailwind for styling, extract constants for reusable values
- **Constants**: Define constants in UPPERCASE at the top of files
- **Error Handling**: Use try/catch for async operations
- **Naming**:
  - Components: PascalCase (e.g., `Navbar.tsx`)
  - Variables/functions: camelCase
  - Constants: UPPERCASE_SNAKE_CASE

## Project Structure
- `/src/app`: Next.js app router pages and layouts
- `/src/components`: Reusable UI components
- Chess.js and react-chessboard for chess functionality