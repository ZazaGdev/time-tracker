# Time Tracker - Project Structure

This document describes the organized project structure for the Angular Time Tracker application.

## Project Structure

```
src/app/
├── components/                 # Reusable UI components
│   ├── timer-form/            # Timer form component
│   │   ├── timer-form.component.ts
│   │   ├── timer-form.component.html
│   │   └── timer-form.component.scss
│   ├── manage-form/           # Management form component
│   │   ├── manage-form.component.ts
│   │   ├── manage-form.component.html
│   │   └── manage-form.component.scss
│   └── reports-view/          # Reports view component
│       ├── reports-view.component.ts
│       ├── reports-view.component.html
│       └── reports-view.component.scss
│
├── core/                      # Core application logic
│   ├── models/               # Data models and interfaces
│   │   └── index.ts         # Category, Subcategory, Tag, Session, ActiveTimer
│   ├── services/            # Business logic services
│   │   ├── timer.service.ts      # Timer management
│   │   ├── taxonomy.service.ts   # Categories, subcategories, tags
│   │   ├── report.service.ts     # Reporting functionality
│   │   └── index.ts             # Service exports
│   ├── data/                # Data layer
│   │   ├── db.service.ts        # Dexie database configuration
│   │   ├── seed-data.ts         # Sample data seeding
│   │   └── index.ts             # Data layer exports
│   └── index.ts             # Core module exports
│
├── pages/                   # Page components (route targets)
│   ├── timer/              # Timer page
│   │   └── timer.page.ts   # Uses timer-form component
│   ├── manage/             # Management page
│   │   └── manage.component.ts  # Uses manage-form component
│   └── reports/            # Reports page
│       └── reports.component.ts # Uses reports-view component
│
├── app.component.ts        # Root component
├── app.routes.ts          # Application routing
├── app.config.ts         # App configuration
└── app.scss             # Global component styles
```

## Key Principles

### 1. Component Organization
- All component-related files (TS, HTML, SCSS) are grouped in single directories
- Components are organized by feature/responsibility
- Each component directory contains all its assets

### 2. Core Module Structure
- **models/**: TypeScript interfaces and data models
- **services/**: Injectable services for business logic
- **data/**: Database and data access layer
- Barrel exports (index.ts) for clean imports

### 3. Page Components
- Page components are route targets
- They compose UI from reusable components
- Minimal logic, mainly orchestration

### 4. Import Strategy
```typescript
// Good: Use barrel exports
import { TimerService, TaxonomyService } from '../../core/services';
import { Category, Subcategory } from '../../core/models';

// Avoid: Direct file imports
import { TimerService } from '../../core/services/timer.service';
```

## Benefits

1. **Scalability**: Easy to add new features and components
2. **Maintainability**: Related files are co-located
3. **Reusability**: Components can be easily shared
4. **Clean Imports**: Barrel exports reduce import complexity
5. **Separation of Concerns**: Clear boundaries between layers

## Usage Examples

### Adding a New Component
```bash
# Create component directory
mkdir src/app/components/new-feature

# Add component files
touch src/app/components/new-feature/new-feature.component.ts
touch src/app/components/new-feature/new-feature.component.html
touch src/app/components/new-feature/new-feature.component.scss
```

### Adding a New Service
```typescript
// Create service in core/services/
// Export in core/services/index.ts
export * from './new-feature.service';

// Use in components
import { NewFeatureService } from '../../core/services';
```

This structure promotes maintainable, scalable Angular applications following best practices.