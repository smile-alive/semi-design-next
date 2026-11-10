import type { ComponentType } from 'react';

// Kept out of index.tsx: public declarations name this type, and index.d.ts would pull in dnd-kit's declarations,
// which use the global JSX namespace that @types/react 19 no longer declares
export type SortableHandle = (WrapperComponent: ComponentType) => ComponentType;
