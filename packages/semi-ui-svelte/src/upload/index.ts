import FileCard from './file-card.svelte';
import UploadBase from './upload.svelte';

// Svelte components are functions, so the static subcomponent attaches to the component itself
export const Upload = Object.assign(UploadBase, { FileCard });
export { default as UploadFileCard } from './file-card.svelte';
export type {
    AfterUploadProps,
    AfterUploadResult,
    BeforeUploadObjectResult,
    BeforeUploadProps,
    CustomFile,
    FileCardProps,
    FileItem,
    FileItemStatus,
    PromptPositionType,
    UploadCropModalProps,
    UploadCropProps,
    UploadCustomError,
    UploadCustomRequestArgs,
    UploadFileItemSlotProps,
    UploadFileListHeaderSlotProps,
    UploadHandle,
    UploadListType,
    UploadOnChangeProps,
    UploadPicCloseSlotProps,
    UploadProps,
} from './interface.js';
