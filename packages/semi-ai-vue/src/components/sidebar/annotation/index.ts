import AnnotationContent from './annotation-content.vue';
import Annotation from './annotation.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const AnnotationWithParts: typeof Annotation & { AnnotationContent: typeof AnnotationContent } = Object.assign(Annotation, { AnnotationContent });
export default AnnotationWithParts;
export type { AnnotationProps, AnnotationEmits, AnnotationSlots, AnnotationItem, AnnotationInfo, AnnotationHeaderSlotProps, AnnotationItemSlotProps } from './interface';
