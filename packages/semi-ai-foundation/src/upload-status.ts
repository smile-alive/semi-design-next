import { strings } from '@fibrae/semi-foundation/components/upload/constants';

export function isUploadProgressVisible({ percent, status }: { percent?: number; status?: string }) {
    return percent !== undefined && percent !== 100 && status === strings.FILE_STATUS_UPLOADING;
}

export function isUploadFailed(status?: string) {
    return status === strings.FILE_STATUS_UPLOAD_FAIL || status === strings.FILE_STATUS_VALID_FAIL;
}
