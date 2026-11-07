import UploadFileCard from './file-card.vue';
import Upload from './upload.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const UploadWithParts: typeof Upload & { FileCard: typeof UploadFileCard } = Object.assign(Upload, {
    FileCard: UploadFileCard,
});
export default UploadWithParts;
export { default as UploadFileCard } from './file-card.vue';
export type * from './interface';
