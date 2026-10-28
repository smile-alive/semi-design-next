import { strings } from './chat/constants';

export function isUploadProgressVisible({ percent, status }: { percent?: number; status?: string }) {
    return percent !== undefined && percent !== 100 && status === strings.FILE_STATUS.UPLOADING;
}
