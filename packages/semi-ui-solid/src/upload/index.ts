import FileCard from './file-card';
import Upload from './upload';

export default Object.assign(Upload, { FileCard });
export type { UploadElement, UploadHandle, UploadProps } from './upload';
export type { FileCardProps } from './file-card';
export type { AfterUploadProps, AfterUploadResult, BeforeUploadObjectResult, BeforeUploadProps, CropProps, CustomError, FileItem, OnChangeProps, PromptPositionType, RenderFileItemProps, RenderFileListTitleProps, RenderPictureCloseProps, UploadCropModalProps, UploadListType, customRequestArgs } from './interface';
export type { FileItemStatus } from '@fibrae/semi-foundation/upload/foundation';
