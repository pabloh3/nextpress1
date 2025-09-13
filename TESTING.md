# Testing Documentation for NextPress Page Builder

This document provides an overview of the comprehensive test suite that has been implemented for the NextPress page builder's nested block functionality.

## Test Setup

### Vitest Configuration
- **Location**: `vitest.config.ts`
- **Purpose**: Frontend testing with React Testing Library
- **Coverage**: Hooks, utilities, and component integration
- **Environment**: jsdom for DOM simulation

### Jest Configuration  
- **Location**: `jest.config.js`
- **Purpose**: Server-side and full component testing
- **Coverage**: Block components, server logic
- **Environment**: Dual setup (node + jsdom)

### Test Scripts
```bash
npm run test           # Run Vitest in watch mode
npm run test:run       # Run Vitest once
npm run test:coverage  # Run with coverage report
npm run test:ui        # Run with Vitest UI
npm run test:jest      # Run Jest tests
```

## Test Categories

### 1. Tree Utilities Tests (`client/src/test/treeUtils.test.ts`)
Tests for recursive block operations that power nested block functionality:

- **findBlockDeep**: Locating blocks in nested structures
- **updateBlockDeep**: Modifying blocks at any nesting level  
- **deleteBlockDeep**: Removing blocks from nested trees
- **duplicateBlockDeep**: Copying blocks with proper ID generation

**Key Test Scenarios**:
- Root level operations
- Deeply nested structures
- Error handling for non-existent blocks
- Maintaining data integrity during operations

### 2. Block Manager Hook Tests (`client/src/test/useBlockManager.test.ts`)
Comprehensive testing of the core block management hook:

- **Block CRUD Operations**: Create, read, update, delete
- **Nested Block Support**: Operations on blocks within containers
- **State Management**: Proper React state updates
- **Error Handling**: Graceful failure for invalid operations

**Key Test Scenarios**:
- Updating root vs nested blocks
- Duplicating containers with children
- Deleting blocks and maintaining tree structure
- Initialization with various block configurations

### 3. Block Component Tests (`client/src/test/HeadingBlock.test.tsx`)
Testing individual block components and their functionality:

- **Renderer Testing**: Proper HTML output and styling
- **Settings Panel Testing**: Form interactions and updates
- **Props Handling**: Content, styles, and configuration
- **Accessibility**: ARIA roles and semantic HTML

**Key Test Scenarios**:
- Different heading levels (H1-H6)
- Text alignment and styling
- Custom CSS classes and inline styles
- Legacy content property support

### 4. BlockRenderer Tests (`client/src/test/BlockRenderer.test.tsx`)
Testing the core component responsible for rendering all blocks:

- **Nested Rendering**: Container blocks with children
- **Selection Logic**: Clicking and highlighting blocks
- **Drag & Drop Integration**: Droppable areas and interactions
- **Preview vs Edit Modes**: Different behavior modes

**Key Test Scenarios**:
- Rendering simple vs container blocks
- Event bubbling prevention in nested structures
- Block controls visibility and interaction
- Empty container states

### 5. Drag & Drop Handler Tests (`client/src/test/useDragAndDropHandler.test.ts`)
Testing the complex drag and drop logic for nested blocks:

- **Reordering**: Within same container
- **Moving Between Containers**: Cross-container transfers
- **Canvas Operations**: Root level movements
- **Library Integration**: Adding new blocks

**Key Test Scenarios**:
- All drag/drop combinations (canvas ↔ container ↔ library)
- Edge cases (unknown targets, same position drops)
- Deep nesting scenarios
- Data integrity during moves

### 6. Integration Tests (`client/src/test/PageBuilder.integration.test.tsx`)
Full workflow testing of the complete page builder:

- **End-to-End Workflows**: Complete user interactions
- **Component Integration**: All parts working together
- **State Synchronization**: Proper data flow
- **User Experience**: Realistic usage scenarios

**Key Test Scenarios**:
- Loading and displaying nested block structures
- Selecting and editing blocks at various levels
- Block operations (duplicate, delete, move)
- Device preview switching
- Save functionality

## Test Utilities and Mocks

### Mock Block Registry
```typescript
const blockRegistry = {
  'core/paragraph': { /* mock paragraph block */ },
  'core/group': { /* mock container block */ },
  'core/columns': { /* mock column container */ }
}
```

### Test Data Factories
```typescript
const createMockBlock = (id, type, children) => ({
  id, type, content, styles, children
})
```

### Setup Files
- **`client/src/test/setup.ts`**: Browser API mocks (IntersectionObserver, ResizeObserver, etc.)
- **Test Providers**: React Testing Library wrappers for DragDropContext, BlockActionsProvider

## Coverage Areas

### ✅ Fully Tested
- Tree manipulation utilities
- Block manager hook functionality  
- Basic block components (Heading, Text, Image)
- Drag and drop logic
- Block renderer with nesting
- Integration workflows

### 🔄 Partially Tested (via integration)
- Complex container blocks (Group, Columns)
- Media handling and file uploads
- Page save/load functionality
- Theme integration

### 📝 Recommended Additional Tests
- Performance testing with large nested structures
- Browser compatibility testing
- Accessibility testing with screen readers
- Mobile drag & drop interactions

## Running Tests

### Local Development
```bash
# Start test runner in watch mode
npm run test

# Run specific test file
npm run test -- treeUtils.test.ts

# Run with coverage
npm run test:coverage
```

### Continuous Integration
Tests are designed to run in CI environments with:
- No external dependencies
- Proper mocking of browser APIs
- Deterministic test data
- Fast execution times

## Test Philosophy

These tests follow the principle of testing **behavior over implementation**:

- **User-focused**: Tests simulate real user interactions
- **Integration-heavy**: Emphasis on component interaction over isolation
- **Maintainable**: Tests should survive refactoring
- **Comprehensive**: Cover edge cases and error conditions

The test suite ensures that the nested block functionality works reliably across all scenarios while maintaining excellent developer experience during refactoring and feature development.