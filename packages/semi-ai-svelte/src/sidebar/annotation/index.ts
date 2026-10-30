import AnnotationContent from './annotation-content.svelte';
import AnnotationBase from './annotation.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const Annotation: typeof AnnotationBase & { AnnotationContent: typeof AnnotationContent } = Object.assign(AnnotationBase, { AnnotationContent });
export type { AnnotationContentProps, AnnotationHeaderSnippetProps, AnnotationInfo, AnnotationItem, AnnotationItemSnippetProps, AnnotationProps } from './interface.js';
