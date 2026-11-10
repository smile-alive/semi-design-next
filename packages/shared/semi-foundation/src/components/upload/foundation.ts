import { isPlainObject } from 'es-toolkit';
import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import type { Locale } from '../../locale/index';
import { isPromise, createId } from '../../utils/index';
import { strings, numbers } from './constants';
import { getFileSize, byteKB, mapFileTree, removeUnlessPrevented } from './utils';

const { FILE_STATUS_UPLOADING, FILE_STATUS_SUCCESS, FILE_STATUS_UPLOAD_FAIL, FILE_STATUS_VALID_FAIL, FILE_STATUS_WAIT_UPLOAD, TRIGGER_AUTO } = strings;

export interface XhrError extends Error {
    status: XMLHttpRequest['status'];
    method: string;
    url: string;
}

export type FileItemStatus = 'success' | 'uploadFail' | 'validateFail' | 'validating' | 'uploading' | 'wait';

export interface BaseFileItem {
    showReplace?: boolean;
    showRetry?: boolean;
    response?: any;
    event?: Event;
    status: FileItemStatus;
    name: string;
    size: string;
    uid: string;
    url?: string;
    fileInstance?: File;
    percent?: number;
    _sizeInvalid?: boolean;
    preview?: boolean;
    validateMessage?: any;
    shouldUpload?: boolean;
}

// customRequest may pass any object to onError; only `status` is read
export type UploadErrorSource = XMLHttpRequest | { status?: number };

export interface CustomFile extends File {
    uid?: string;
    _sizeInvalid?: boolean;
    status?: string;
}

export interface BeforeUploadObjectResult {
    shouldUpload?: boolean;
    status?: string;
    autoRemove?: boolean;
    validateMessage?: unknown;
    fileInstance?: CustomFile;
}

export interface AfterUploadResult {
    autoRemove?: boolean;
    status?: string;
    validateMessage?: unknown;
    name?: string;
    url?: string;
}

/** The members of a drag event the foundation reads; DOM events and React synthetic events both satisfy it */
export type UploadDragEvent = Pick<DragEvent, 'preventDefault' | 'stopPropagation' | 'currentTarget' | 'target' | 'dataTransfer'>;

/** E is the host's drop event, which the foundation passes on to onDrop */
export interface UploadAdapter<P extends UploadBaseProps = UploadBaseProps, S extends UploadBaseState = UploadBaseState, E = unknown> extends DefaultAdapter<P, S> {
    notifyFileSelect: (files: Array<CustomFile>) => void;
    notifyError: (error: XhrError, fileInstance: CustomFile, fileList: Array<BaseFileItem>, xhr: UploadErrorSource) => void;
    notifySuccess: (body: any, fileInstance: CustomFile, newFileList: Array<BaseFileItem>) => void;
    notifyProgress: (percent: number, fileInstance: CustomFile, newFileList: Array<BaseFileItem>) => void;
    notifyRemove: (file: CustomFile | undefined, newFileList: Array<BaseFileItem>, fileItem: BaseFileItem) => void;
    notifySizeError: (file: CustomFile, fileList: Array<BaseFileItem>) => void;
    notifyExceed: (files: Array<File>) => void;
    notifyBeforeUpload: ({ file, fileList }: { file: BaseFileItem; fileList: Array<BaseFileItem> }) => boolean | BeforeUploadObjectResult | Promise<BeforeUploadObjectResult>;
    notifyAfterUpload: ({ response, file, fileList }: { response: any; file: BaseFileItem; fileList: Array<BaseFileItem> }) => AfterUploadResult;
    /** Clears the input's value, so picking the same file again fires change */
    resetInput: () => void;
    resetReplaceInput: () => void;
    openReplacePicker: () => void;
    notifyBeforeRemove: (file: BaseFileItem, fileList: Array<BaseFileItem>) => boolean | Promise<boolean>;
    notifyBeforeClear: (fileList: Array<BaseFileItem>) => boolean | Promise<boolean>;
    notifyChange: ({ currentFile, fileList }: { currentFile?: BaseFileItem | null; fileList: Array<BaseFileItem> }) => void;
    notifyClear: () => void;
    notifyPreviewClick: (file: BaseFileItem) => void;
    notifyRetry: (fileItem: BaseFileItem) => void;
    notifyDrop: (e: E, files: Array<File>, fileList: Array<BaseFileItem>) => void;
    notifyAcceptInvalid: (invalidFiles: Array<File>) => void;
    notifyPastingError: (error: Error) => void;
    notifyCropError: (error: Error) => void;
    /** The canvas of the crop area, null while no cropper is mounted */
    getCropperCanvas: () => HTMLCanvasElement | null;
}

export interface CustomRequestArgs {
    fileName: string;
    data: Record<string, any>;
    file: BaseFileItem;
    fileInstance: File;
    onProgress: (e?: ProgressEvent) => unknown;
    onError: (userXhr: UploadErrorSource, e?: ProgressEvent) => unknown;
    onSuccess: (response: any, e?: ProgressEvent) => unknown;
    withCredentials: boolean;
    action: string;
}

export interface UploadBaseProps {
    action: string;
    accept?: string;
    addOnPasting?: boolean;
    afterUpload?: (object: { file: BaseFileItem; fileList: Array<BaseFileItem>; response: any }) => AfterUploadResult;
    beforeUpload?: (object: { file: BaseFileItem; fileList: Array<BaseFileItem> }) => boolean | BeforeUploadObjectResult | Promise<BeforeUploadObjectResult>;
    // Method syntax on purpose: bivariance lets the UI Props, which declare loose callback shapes, satisfy this
    customRequest?(object: CustomRequestArgs): void;
    data?: Record<string, any> | ((file: File) => Record<string, any>);
    defaultFileList?: Array<BaseFileItem>;
    directory?: boolean;
    disabled?: boolean;
    fileList?: Array<BaseFileItem>;
    fileName?: string;
    headers?: Record<string, any> | ((file: File) => Record<string, string>);
    limit?: number;
    maxSize?: number;
    minSize?: number;
    name?: string;
    transformFile?: (file: File) => File;
    uploadTrigger?: 'auto' | 'custom';
    withCredentials?: boolean;
    crop?: boolean | { quality?: number };
    beforeCrop?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
}

export interface UploadBaseState {
    fileList: BaseFileItem[];
    dragAreaStatus: 'default' | 'legal';
    /** The uid of the item a pending replace will overwrite; the list may change while the user picks the file */
    replaceUid: string;
    cropperVisible: boolean;
    cropperFile: File | null;
    cropperSrc: string;
    pendingImageFiles: File[];
    /** Non-image files that bypass cropping but are uploaded together */
    nonImageFiles: File[];
    /** Image files already cropped, accumulated until the queue drains */
    croppedFiles: File[];
    isReplaceOperation: boolean;
}

export interface FileCardFlagOptions {
    disabled?: boolean;
    /** The default for files without their own `showRetry` */
    showRetry?: boolean;
    showReplace?: boolean;
}

export interface FileCardFlags {
    showRetry: boolean;
    showReplace: boolean;
    /** The progress bar of the list card */
    showListProgress: boolean;
    /** The progress ring of the picture card */
    showPicProgress: boolean;
    /** The hover layer of the picture card; the replace button takes its place */
    showPreview: boolean;
    failed: boolean;
}

function isImageFile(file: File) {
    return file.type.startsWith('image/');
}

export default class UploadFoundation<P extends UploadBaseProps = UploadBaseProps, S extends UploadBaseState = UploadBaseState, E extends UploadDragEvent = UploadDragEvent> extends BaseFoundation<UploadAdapter<P, S, E>, P, S> {
    // Every objectURL this instance created, by uid: a controlled fileList cannot say which urls the foundation owns
    #localUrls: Record<string, string> = {};
    // Only for a controlled fileList, whose prop is still the old list until the parent's commit: a later async
    // beforeUpload result of the same batch builds on this list instead of that stale prop
    #latestFileList: Array<BaseFileItem> | null = null;
    // Entered minus left elements: moving between the area and its children fires dragenter on the new element before
    // dragleave on the old one, so the area is left only when the count returns to 0
    #dragDepth = 0;

    static override readonly propKeys = ['fileList'];

    #syncLocalUrlsFromFileList() {
        const fileList = this.getFileList();
        const next: Record<string, string> = {};
        if (!Array.isArray(fileList)) {
            this.#localUrls = {};
            return;
        }
        fileList.forEach((item: any) => {
            const uid = item && item.uid;
            const url = item && item.url;
            const fileInstance = item && item.fileInstance;
            if (uid && typeof url === 'string' && url.startsWith('blob:') && fileInstance instanceof File) {
                next[uid] = url;
            }
        });
        this.#localUrls = next;
    }

    #releaseFileUrl(uid: string) {
        if (!uid) {
            return;
        }
        const url = this.#localUrls && this.#localUrls[uid];
        if (!url) {
            return;
        }
        this.#releaseBlob(url);
        const next = { ...this.#localUrls };
        delete next[uid];
        this.#localUrls = next;
    }

    // Only for truly removed files; unmount must not revoke (see destroy)
    #releaseAllFileUrls() {
        const localUrls = this.#localUrls;
        if (!localUrls || typeof localUrls !== 'object') {
            return;
        }
        Object.keys(localUrls).forEach((uid) => {
            const url = localUrls[uid];
            if (url) {
                this.#releaseBlob(url);
            }
        });
        this.#localUrls = {};
    }

    #getFileIndex(file: CustomFile | BaseFileItem, fileList: Array<BaseFileItem>) {
        return fileList.findIndex((item) => item.uid === file.uid);
    }

    #createURL(fileInstance: CustomFile, uid: string) {
        const url = URL.createObjectURL(fileInstance);
        const next = { ...this.#localUrls };
        if (uid && next[uid] && next[uid] !== url) {
            this.#releaseBlob(next[uid]);
        }
        if (uid) {
            next[uid] = url;
        }
        this.#localUrls = next;
        return url;
    }

    #releaseBlob(url: string) {
        URL.revokeObjectURL(url);
    }

    #updateFileListInternal(newFileList: Array<BaseFileItem>, callback?: () => void) {
        if (this.isControlledComponent('fileList')) {
            this.#latestFileList = newFileList;
        }
        this.setState({ fileList: newFileList }, () => {
            // the prop now shows what the parent kept, which a parent that refused the write leaves unchanged
            if (this.#latestFileList === newFileList) {
                this.#latestFileList = null;
            }
            callback?.();
        });
    }

    #getLatestFileList() {
        return this.#latestFileList ?? this.getFileList();
    }

    /** The step every incoming file goes through: transformFile, then uid, then the size check on the final File */
    #prepareFile(file: CustomFile, fileList: Array<BaseFileItem>) {
        const { transformFile } = this.getProps();
        if (transformFile) {
            file = transformFile(file);
        }
        if (!file.uid) {
            file.uid = createId();
        }
        if (this.checkFileSize(file)) {
            file._sizeInvalid = true;
            file.status = FILE_STATUS_VALID_FAIL;
            this.adapter.notifySizeError(file, fileList);
        }
        return file;
    }

    #replaceFileList(files: Array<CustomFile>) {
        const { uploadTrigger } = this.getProps();
        // the old list is gone, and no clear button exists at limit 1 to release its urls
        this.#releaseAllFileUrls();
        const currentFiles = files.map((item) => this.buildFileItem(item, uploadTrigger));
        this.adapter.notifyChange({ fileList: currentFiles, currentFile: currentFiles[0] });
        this.#updateFileListInternal(currentFiles, () => {
            if (uploadTrigger === TRIGGER_AUTO) {
                this.#startUpload(currentFiles);
            }
        });
    }

    #addFilesToList(files: Array<CustomFile>) {
        const fileList = this.getFileList().slice();
        const { uploadTrigger } = this.getProps();
        const currentFiles = files.map((item) => this.buildFileItem(item, uploadTrigger));
        let lastAdded: BaseFileItem | undefined;
        for (const file of currentFiles) {
            const index = fileList.findIndex((item: BaseFileItem) => item.uid === file.uid);
            if (index !== -1) {
                fileList[index] = file;
            } else {
                fileList.push(file);
                lastAdded = file;
            }
        }
        if (lastAdded) {
            this.adapter.notifyChange({ fileList, currentFile: lastAdded });
        }
        this.#updateFileListInternal(fileList, () => {
            if (uploadTrigger === TRIGGER_AUTO) {
                this.#startUpload(currentFiles);
            }
        });
    }

    #startUpload(fileList: Array<BaseFileItem>) {
        fileList.forEach((file) => {
            if (!file._sizeInvalid) {
                this.#upload(file);
            }
        });
    }

    #upload(file: BaseFileItem) {
        const { beforeUpload } = this.getProps();
        if (typeof beforeUpload === 'undefined') {
            this.#post(file);
            return;
        }
        if (typeof beforeUpload === 'function') {
            const fileList = this.#getLatestFileList();
            const buResult = this.adapter.notifyBeforeUpload({ file, fileList });
            switch (true) {
                case buResult === true: {
                    this.#post(file);
                    break;
                }
                case buResult === false: {
                    const newResult = { shouldUpload: false, status: strings.FILE_STATUS_VALID_FAIL };
                    this.#handleBeforeUploadResultInObject(newResult, file);
                    break;
                }
                case buResult && isPromise(buResult): {
                    Promise.resolve(buResult as Promise<BeforeUploadObjectResult>).then(
                        (resolveData) => {
                            let newResult = { shouldUpload: true };
                            if (isPlainObject(resolveData)) {
                                newResult = { ...newResult, ...resolveData };
                            }
                            this.#handleBeforeUploadResultInObject(newResult, file);
                        },
                        (rejectVal) => {
                            let newResult = { shouldUpload: false, status: strings.FILE_STATUS_VALID_FAIL };
                            if (isPlainObject(rejectVal)) {
                                newResult = { ...newResult, ...rejectVal };
                            }
                            this.#handleBeforeUploadResultInObject(newResult, file);
                        }
                    );
                    break;
                }

                case typeof buResult === 'object':
                    this.#handleBeforeUploadResultInObject({ shouldUpload: true, ...(buResult as BeforeUploadObjectResult) }, file);
                    break;
                default:
                    break;
            }
        }
    }

    #handleBeforeUploadResultInObject({ shouldUpload, status, autoRemove, validateMessage, fileInstance }: Partial<BeforeUploadObjectResult>, file: BaseFileItem) {
        let newFileList: Array<BaseFileItem> = this.#getLatestFileList().slice();
        let currentFile = file;
        if (autoRemove) {
            this.#releaseFileUrl(file.uid);
            newFileList = newFileList.filter((item) => item.uid !== file.uid);
        } else {
            const index = this.#getFileIndex(file, newFileList);
            if (index < 0) {
                return;
            }
            currentFile = { ...newFileList[index], shouldUpload };
            if (status) {
                currentFile.status = status as FileItemStatus;
            }
            if (validateMessage) {
                currentFile.validateMessage = validateMessage;
            }
            if (fileInstance) {
                fileInstance.uid = file.uid;
                this.#releaseFileUrl(file.uid);
                Object.assign(currentFile, {
                    fileInstance,
                    size: getFileSize(fileInstance.size),
                    name: fileInstance.name,
                    url: this.#createURL(fileInstance, file.uid),
                });
            }
            newFileList[index] = currentFile;
        }

        this.#updateFileListInternal(newFileList);
        this.adapter.notifyChange({ fileList: newFileList, currentFile });

        if (shouldUpload) {
            this.#post(currentFile);
        }
    }

    #post(file: BaseFileItem) {
        const { fileInstance } = file;
        const option = this.getProps();
        const { action } = option;

        let { data } = option;
        if (typeof data === 'function') {
            data = data(fileInstance);
        }

        const fileName = option.name || option.fileName || fileInstance.name;

        if (option.customRequest) {
            return option.customRequest({
                fileName,
                data,
                file,
                fileInstance,
                onProgress: (e?: ProgressEvent) => this.#handleProgress({ e, fileInstance }),
                onError: (userXhr: UploadErrorSource, e?: ProgressEvent) => this.#handleError({ e, xhr: userXhr, fileInstance }),
                onSuccess: (response: any, e?: ProgressEvent) => this.#handleSuccess({ response, fileInstance, e, isCustomRequest: true }),
                withCredentials: option.withCredentials,
                action: option.action,
            });
        }

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        if (data) {
            Object.keys(data).forEach((key) => {
                formData.append(key, data[key]);
            });
        }
        formData.append(fileName, fileInstance);
        xhr.open('post', action, true);

        if (option.withCredentials) {
            xhr.withCredentials = true;
        }

        // Unmount and React Activity hiding both run destroy and the host cannot tell them apart, so a request outlives
        // the component and keeps notifying the adapter (Vue drops emits after unmount)
        xhr.upload.onprogress = (e: ProgressEvent) => this.#handleProgress({ e, fileInstance });
        xhr.onload = (e: ProgressEvent) => this.#handleOnLoad({ e, xhr, fileInstance });
        xhr.onerror = (e: ProgressEvent) => this.#handleError({ e, xhr, fileInstance });

        let headers = option.headers || {};
        if (typeof headers === 'function') {
            headers = headers(fileInstance);
        }

        for (const item in headers) {
            if (Object.hasOwn(headers, item) && headers[item] !== null) {
                xhr.setRequestHeader(item, headers[item]);
            }
        }

        xhr.send(formData);
    }

    #handleProgress({ e, fileInstance }: { e?: ProgressEvent; fileInstance: File }) {
        const newFileList = this.#getLatestFileList().slice();
        let percent = 0;
        if (e?.total > 0) {
            percent = Number(((e.loaded / e.total) * 100 * numbers.PROGRESS_COEFFICIENT).toFixed(0)) || 0;
        }
        const index = this.#getFileIndex(fileInstance, newFileList);
        if (index < 0) {
            return;
        }
        newFileList[index] = { ...newFileList[index], percent, status: FILE_STATUS_UPLOADING as FileItemStatus };

        this.adapter.notifyProgress(percent, fileInstance, newFileList);
        this.#updateFileListInternal(newFileList);
        this.adapter.notifyChange({ fileList: newFileList, currentFile: newFileList[index] });
    }

    #handleOnLoad({ e, xhr, fileInstance }: { e?: ProgressEvent; xhr: XMLHttpRequest; fileInstance: File }) {
        const fileList = this.#getLatestFileList();
        const index = this.#getFileIndex(fileInstance, fileList);
        if (index < 0) {
            return;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
            this.#handleError({ e, xhr, fileInstance });
        } else {
            this.#handleSuccess({ e, xhr, fileInstance });
        }
    }

    #handleSuccess({ e, fileInstance, isCustomRequest = false, xhr, response }: { e?: ProgressEvent; fileInstance: CustomFile; isCustomRequest?: boolean; xhr?: XMLHttpRequest; response?: any }) {
        const fileList = this.#getLatestFileList();
        let body: any = null;
        const index = this.#getFileIndex(fileInstance, fileList);
        if (index < 0) {
            return;
        }
        if (isCustomRequest) {
            body = response;
        } else {
            body = this.getBody(xhr);
        }
        const newFileList = fileList.slice();
        const { afterUpload } = this.getProps();
        // autoRemove splices it out below, so keep it for onChange
        let currentFile: BaseFileItem = {
            ...newFileList[index],
            status: FILE_STATUS_SUCCESS as FileItemStatus,
            percent: 100,
            response: body,
        };
        if (e) {
            currentFile.event = e;
        }
        newFileList[index] = currentFile;
        this.adapter.notifyProgress(100, fileInstance, newFileList);

        if (afterUpload && typeof afterUpload === 'function') {
            const { autoRemove, status, validateMessage, name, url } =
                this.adapter.notifyAfterUpload({
                    response: body,
                    file: currentFile,
                    fileList: newFileList,
                }) || {};
            // afterUpload already received currentFile, so the result goes into a copy
            currentFile = { ...currentFile };
            if (status) {
                currentFile.status = status as FileItemStatus;
            }
            if (validateMessage) {
                currentFile.validateMessage = validateMessage;
            }
            if (name) {
                currentFile.name = name;
            }
            if (url) {
                this.#releaseFileUrl(currentFile.uid);
                currentFile.url = url;
            }
            newFileList[index] = currentFile;
            if (autoRemove) {
                this.#releaseFileUrl(currentFile.uid);
                newFileList.splice(index, 1);
            }
        }
        this.adapter.notifySuccess(body, fileInstance, newFileList);
        this.adapter.notifyChange({ fileList: newFileList, currentFile });
        this.#updateFileListInternal(newFileList);
    }

    #handleError({ e, xhr, fileInstance }: { e?: ProgressEvent; xhr: UploadErrorSource; fileInstance: CustomFile }) {
        const fileList = this.#getLatestFileList();
        const index = this.#getFileIndex(fileInstance, fileList);
        if (index < 0) {
            return;
        }
        const { action } = this.getProps();
        const newFileList = fileList.slice();
        const error = this.getError({ action, xhr, fileName: fileInstance.name });

        newFileList[index] = {
            ...newFileList[index],
            status: FILE_STATUS_UPLOAD_FAIL as FileItemStatus,
            response: error,
            event: e,
        };

        this.adapter.notifyError(error, fileInstance, newFileList, xhr);
        this.#updateFileListInternal(newFileList);
        this.adapter.notifyChange({ currentFile: newFileList[index], fileList: newFileList });
    }

    async #handleDirectoryDrop(e: E) {
        const fileList = this.getFileList().slice();
        const items = [].slice.call(e.dataTransfer.items);
        const files = await mapFileTree(items);
        this.#selectFiles(files, false);
        this.setState({ dragAreaStatus: 'default' });
        this.adapter.notifyDrop(e, files, fileList);
    }

    /** When accept leaves nothing it returns undefined after calling `reset`: a remounted input fires change again when the same file is picked */
    #acceptFiles(files: Array<File>, reset?: () => void): Array<File> | undefined {
        const { accept } = this.getProps();
        if (typeof accept === 'undefined') {
            return files;
        }
        const invalidFiles = files.filter((item) => !this.checkFileFormat(accept, item));
        if (invalidFiles.length !== 0) {
            this.adapter.notifyAcceptInvalid(invalidFiles);
        }
        const accepted = files.filter((item) => !invalidFiles.includes(item));
        if (accepted.length === 0) {
            reset?.();
            return undefined;
        }
        return accepted;
    }

    // Surplus files are dropped before the crop round so the user never crops a file the limit would drop
    #fitLimit(files: Array<File>) {
        const { limit } = this.getProps();
        const used = this.getFileList().length;
        if (typeof limit === 'undefined' || used + files.length <= limit) {
            return files;
        }
        if (limit === 1) {
            return files.slice(-1);
        }
        this.adapter.notifyExceed(files);
        return files.slice(0, Math.max(0, limit - used));
    }

    #dispatchFiles(files: Array<File>, isReplaceOperation: boolean) {
        if (isReplaceOperation) {
            this.#replaceFile(files[0]);
        } else {
            this.#addSelected(files);
        }
    }

    // a throwing beforeCrop skips cropping, so the user is never blocked
    async #shouldCrop(file: File, files: Array<File>) {
        const { beforeCrop } = this.getProps();
        if (!beforeCrop) {
            return true;
        }
        try {
            return (await beforeCrop(file, files)) !== false;
        } catch (error) {
            this.adapter.notifyCropError(error as Error);
            return false;
        }
    }

    async #startCrop(files: Array<File>, isReplaceOperation: boolean) {
        const imageFiles = files.filter(isImageFile);
        if (!(await this.#shouldCrop(imageFiles[0], files))) {
            this.#dispatchFiles(files, isReplaceOperation);
            return;
        }
        const [first, ...rest] = isReplaceOperation ? [imageFiles[0]] : imageFiles;
        this.setState({
            cropperVisible: true,
            cropperFile: first,
            cropperSrc: URL.createObjectURL(first),
            pendingImageFiles: rest,
            nonImageFiles: isReplaceOperation ? [] : files.filter((file) => !isImageFile(file)),
            croppedFiles: [],
            isReplaceOperation,
        });
    }

    #selectFiles(currentFileList: Array<File>, allowCrop: boolean) {
        let files = this.#acceptFiles(currentFileList, () => this.adapter.resetInput());
        if (!files) {
            return;
        }
        if (allowCrop && this.getProps().crop && files.some(isImageFile)) {
            // a paste behind the open modal would restart the round and drop the results and queue of the running one
            if (this.getStates().cropperVisible) {
                return;
            }
            files = this.#fitLimit(files);
            if (files.some(isImageFile)) {
                void this.#startCrop(files, false);
                return;
            }
        }
        this.#addSelected(files);
    }

    #addSelected(selected: Array<File>) {
        const { limit } = this.getProps();

        const fileList = this.getFileList();

        let files = selected.map((file: CustomFile) => this.#prepareFile(file, fileList));

        const total = fileList.length + files.length;
        if (typeof limit !== 'undefined') {
            if (total > limit) {
                if (limit === 1) {
                    files = files.slice(-1);
                    this.adapter.notifyFileSelect(files);
                    this.adapter.resetInput();
                    this.#replaceFileList(files);
                    return;
                }
                this.adapter.notifyExceed(files);
                // clamped: the list may already be over the limit, and a negative count would slice from the end
                const restNum = Math.max(0, limit - fileList.length);
                files = files.slice(0, restNum);
            }
        }

        this.adapter.notifyFileSelect(files);
        this.adapter.resetInput();
        this.#addFilesToList(files);
    }

    #replaceFile(file: File) {
        const { uploadTrigger } = this.getProps();
        const { replaceUid } = this.getStates();
        const fileList = this.getFileList();
        const index = fileList.findIndex((item) => item.uid === replaceUid);
        if (index < 0) {
            // the item was removed while the user picked the file
            this.adapter.resetReplaceInput();
            return;
        }
        const newFile = this.#prepareFile(file, fileList);
        this.adapter.notifyFileSelect([newFile]);
        const newFileItem = this.buildFileItem(newFile, uploadTrigger);
        const newFileList = [...fileList];

        this.#releaseFileUrl(replaceUid);
        newFileList.splice(index, 1, newFileItem);
        this.adapter.notifyChange({ currentFile: newFileItem, fileList: newFileList });
        this.#updateFileListInternal(newFileList, () => {
            this.adapter.resetReplaceInput();
            if (!newFileItem._sizeInvalid) {
                this.#upload(newFileItem);
            }
        });
    }

    /** Adds the files of a paste on the page while addOnPasting is on and the Upload is not disabled */
    #handlePasting = (e: ClipboardEvent) => {
        const { addOnPasting, disabled } = this.getProps();
        if (!addOnPasting || disabled || !e.clipboardData) {
            return;
        }

        const files: File[] = [];
        for (const item of e.clipboardData.items) {
            if (item.kind !== 'file') {
                continue;
            }
            try {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                } else {
                    this.adapter.notifyPastingError(new Error('Failed to read a pasted file from the clipboard'));
                }
            } catch (error) {
                this.adapter.notifyPastingError(error as Error);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            this.addFiles(files);
        }
    };

    protected override initOnce() {
        this.#syncLocalUrlsFromFileList();
    }

    protected getError({ action, xhr, message, fileName }: { action: string; xhr: UploadErrorSource; message?: string; fileName: string }): XhrError {
        const status = xhr ? xhr.status : 0;
        const msg = message || `cannot post ${fileName} to ${action}, xhr status: ${status}`;
        return Object.assign(new Error(msg), { status, method: 'post', url: action });
    }

    protected getBody(xhr: XMLHttpRequest) {
        if (!xhr) {
            return;
        }
        const text = xhr.responseText || xhr.response;
        if (!text) {
            return text;
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            return text;
        }
    }

    protected checkFileSize({ size }: File) {
        const { maxSize, minSize } = this.getProps();
        let isIllegal = false;
        if (size > maxSize * byteKB || size < minSize * byteKB) {
            isIllegal = true;
        }
        return isIllegal;
    }

    protected buildFileItem(fileInstance: CustomFile, uploadTrigger: string) {
        const { _sizeInvalid, status } = fileInstance;
        // rest spread does not copy File properties, so delete in place
        delete fileInstance._sizeInvalid;
        delete fileInstance.status;

        const _file: BaseFileItem = {
            status: (status || (uploadTrigger === TRIGGER_AUTO ? FILE_STATUS_UPLOADING : FILE_STATUS_WAIT_UPLOAD)) as FileItemStatus,
            name: fileInstance.name,
            size: getFileSize(fileInstance.size),
            uid: fileInstance.uid,
            percent: 0,
            fileInstance,
            url: this.#createURL(fileInstance, fileInstance.uid),
        };

        if (_sizeInvalid) {
            _file._sizeInvalid = true;
        }

        if (isImageFile(fileInstance)) {
            _file.preview = true;
        }

        return _file;
    }

    // Dropped files bypass the input's accept filter
    protected checkFileFormat(accept: string, file: File) {
        const acceptTypes = accept
            .split(',')
            .map((type) => type.trim())
            .filter((type) => type);
        const mimeType = file.type || '';
        const baseMimeType = mimeType.replace(/\/.*$/, '');

        return acceptTypes.some((type) => {
            if (type.charAt(0) === '.') {
                const fileName = file.name || '';
                return fileName.toLowerCase().endsWith(type.toLowerCase());
            }
            if (type.endsWith('/*')) {
                const acceptBaseMimeType = type.replace(/\/.*$/, '');
                return baseMimeType === acceptBaseMimeType;
            }
            if (/^[^/]+\/[^/]+$/.test(type)) {
                return mimeType === type;
            }
            return false;
        });
    }

    static getFileCardFlags(file: Pick<BaseFileItem, 'status' | 'percent' | 'showRetry' | 'showReplace'>, options: FileCardFlagOptions): FileCardFlags {
        const { status, percent } = file;
        const showRetry = !options.disabled && status === FILE_STATUS_UPLOAD_FAIL && Boolean(file.showRetry ?? options.showRetry);
        const showReplace = !options.disabled && status === FILE_STATUS_SUCCESS && Boolean(file.showReplace ?? options.showReplace);
        return {
            showRetry,
            showReplace,
            showListProgress: status === FILE_STATUS_UPLOADING && percent !== undefined && percent !== 100,
            showPicProgress: status === FILE_STATUS_UPLOADING && percent !== 100,
            showPreview: status === FILE_STATUS_SUCCESS && !showReplace,
            failed: status === FILE_STATUS_VALID_FAIL || status === FILE_STATUS_UPLOAD_FAIL,
        };
    }

    /** The built-in message of a card whose file carries none of its own; undefined when the file's own message applies */
    static getFallbackValidateMessage(file: Pick<BaseFileItem, 'status' | 'validateMessage' | '_sizeInvalid'>, locale: Pick<Locale['Upload'], 'fail' | 'illegalSize'>): string | undefined {
        if (file.validateMessage) {
            return undefined;
        }
        if (file._sizeInvalid) {
            return locale.illegalSize;
        }
        return file.status === FILE_STATUS_UPLOAD_FAIL ? locale.fail : undefined;
    }

    static getInitialState({ defaultFileList }: UploadBaseProps): UploadBaseState {
        return {
            fileList: defaultFileList ?? [],
            replaceUid: '',
            dragAreaStatus: 'default',
            cropperVisible: false,
            cropperFile: null,
            cropperSrc: '',
            pendingImageFiles: [],
            nonImageFiles: [],
            croppedFiles: [],
            isReplaceOperation: false,
        };
    }

    /** Closes the cropper and drops the queue; the files already cropped are discarded */
    cancelCrop = () => {
        const { cropperSrc } = this.getStates();
        if (cropperSrc) {
            URL.revokeObjectURL(cropperSrc);
        }
        this.setState({
            cropperVisible: false,
            cropperFile: null,
            cropperSrc: '',
            pendingImageFiles: [],
            nonImageFiles: [],
            croppedFiles: [],
            isReplaceOperation: false,
        });
        this.adapter.resetInput();
        this.adapter.resetReplaceInput();
    };

    confirmCrop = async () => {
        const { cropperFile, cropperSrc, pendingImageFiles, nonImageFiles, croppedFiles, isReplaceOperation } = this.getStates();
        const { crop } = this.getProps();
        try {
            const canvas = this.adapter.getCropperCanvas();
            if (!canvas || !cropperFile) {
                throw new Error('Cropper instance not found');
            }
            const quality = (typeof crop === 'object' ? crop.quality : undefined) ?? 0.92;
            const type = cropperFile.type || 'image/png';
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), type, quality);
            });
            // Chrome encodes only png, jpeg and webp (png otherwise), so the file takes the type of the bytes it holds
            const name = blob.type === type ? cropperFile.name : cropperFile.name.replace(/(\.[^.]*)?$/, `.${blob.type.slice('image/'.length)}`);
            const croppedFile = new File([blob], name, { type: blob.type, lastModified: cropperFile.lastModified });
            const nextCropped = [...croppedFiles, croppedFile];

            if (pendingImageFiles.length > 0) {
                const [next, ...rest] = pendingImageFiles;
                URL.revokeObjectURL(cropperSrc);
                this.setState({
                    cropperFile: next,
                    cropperSrc: URL.createObjectURL(next),
                    pendingImageFiles: rest,
                    croppedFiles: nextCropped,
                });
                return;
            }
            this.cancelCrop();
            this.#dispatchFiles([...nextCropped, ...nonImageFiles], isReplaceOperation);
        } catch (error) {
            this.adapter.notifyCropError(error as Error);
        }
    };

    /** A fileList prop that goes back to undefined clears the list (a form reset) and leaves it uncontrolled */
    override handlePropsChange() {
        if (this.getProp('fileList') === undefined) {
            this.#updateFileListInternal([]);
        }
    }

    getFileList() {
        const props = this.getProps();
        return props.fileList === undefined ? this.getState('fileList') : props.fileList || [];
    }

    // The listener is all destroy undoes. Requests outlive it and keep notifying, and an open crop dialog stays open
    // (unmount and hiding both run destroy, and the host cannot tell them apart); objectURLs are not revoked because a
    // controlled parent may keep the blob urls, so previews would break after remount.
    override init() {
        document.body.addEventListener('paste', this.#handlePasting, { signal: this.signal });
    }

    /** Entry for picked, dropped and pasted files: with crop on, images are cropped before they are added */
    addFiles = (currentFileList: FileList | Array<File>) => {
        this.#selectFiles(Array.from(currentFileList), true);
    };

    /** Remembers the item to replace and opens the replace picker; does nothing while disabled */
    startReplace = (uid: string) => {
        if (this.getProps().disabled) {
            return;
        }
        this.setState({ replaceUid: uid });
        this.adapter.openReplacePicker();
    };

    /** Entry for the file picked to replace the item `replaceUid` names; with crop on, an image is cropped first */
    handleReplaceChange = (currentFileList: FileList | Array<File>) => {
        const newFile = Array.from(currentFileList).pop();
        if (!newFile || !this.#acceptFiles([newFile], () => this.adapter.resetReplaceInput())) {
            return;
        }
        if (this.getProps().crop && isImageFile(newFile)) {
            void this.#startCrop([newFile], true);
        } else {
            this.#replaceFile(newFile);
        }
    };

    insertFileToList = (files: Array<CustomFile>, index?: number) => {
        const { limit, uploadTrigger } = this.getProps();
        const fileList = this.getFileList();

        const accepted = this.#acceptFiles(Array.from(files));
        if (!accepted) {
            return;
        }
        let currentFileList = accepted.map((file) => this.#prepareFile(file, fileList));
        const total = fileList.length + currentFileList.length;
        if (typeof limit !== 'undefined') {
            if (total > limit) {
                if (limit === 1) {
                    currentFileList = currentFileList.slice(-1);
                    this.adapter.notifyFileSelect(currentFileList);
                    this.adapter.resetInput();
                    this.#replaceFileList(currentFileList);
                    return;
                }
                this.adapter.notifyExceed(currentFileList);
                const restNum = Math.max(0, limit - fileList.length);
                currentFileList = currentFileList.slice(0, restNum);
            }
        }

        const fileItemList = currentFileList.map((file) => this.buildFileItem(file, uploadTrigger));
        const newFileList = fileList.slice();
        if (typeof index !== 'undefined') {
            newFileList.splice(index, 0, ...fileItemList);
        } else {
            newFileList.push(...fileItemList);
        }

        this.adapter.notifyFileSelect(currentFileList);
        this.adapter.notifyChange({ fileList: newFileList, currentFile: null });
        this.#updateFileListInternal(newFileList, () => {
            if (uploadTrigger === TRIGGER_AUTO) {
                this.#startUpload(fileItemList);
            }
        });
    };

    manualUpload = () => {
        const waitToUploadFileList = this.#getLatestFileList().filter((item: BaseFileItem) => item.status === FILE_STATUS_WAIT_UPLOAD);
        this.#startUpload(waitToUploadFileList);
    };

    handleRemove = (file: BaseFileItem) => {
        const { disabled } = this.getProps();
        if (disabled) {
            return;
        }
        const fileList = this.getFileList();

        removeUnlessPrevented(this.adapter.notifyBeforeRemove(file, fileList), () => {
            // the list may have changed while beforeRemove was pending
            const newFileList = this.#getLatestFileList().slice();
            const index = this.#getFileIndex(file, newFileList);
            if (index < 0) {
                return;
            }
            newFileList.splice(index, 1);

            this.#releaseFileUrl(file.uid);

            this.adapter.notifyRemove(file.fileInstance, newFileList, file);
            this.#updateFileListInternal(newFileList);
            this.adapter.notifyChange({ fileList: newFileList, currentFile: file });
        });
    };

    handleClear = () => {
        const { disabled } = this.getProps();
        const fileList = this.getFileList();
        if (disabled) {
            return;
        }

        void Promise.resolve(this.adapter.notifyBeforeClear(fileList)).then(
            (res) => {
                if (res === false) {
                    return;
                }
                this.#releaseAllFileUrls();
                this.#updateFileListInternal([]);
                this.adapter.notifyClear();
                this.adapter.notifyChange({ fileList: [] });
            },
            () => {}
        );
    };

    handleDragEnter = (e: UploadDragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.#dragDepth++;
        const { disabled } = this.getProps();
        if (!disabled) {
            this.setState({ dragAreaStatus: 'legal' });
        }
    };

    handleDrop = (e: E) => {
        // otherwise the browser opens the dropped file
        e.preventDefault();
        e.stopPropagation();
        this.#dragDepth = 0;
        const { disabled, directory } = this.getProps();
        const fileList = this.getFileList().slice();
        if (!disabled) {
            if (directory) {
                void this.#handleDirectoryDrop(e);
                return;
            }
            const files: File[] = Array.from(e.dataTransfer.files);
            this.addFiles(files);
            this.setState({ dragAreaStatus: 'default' });
            this.adapter.notifyDrop(e, files, fileList);
        }
    };

    handleDragOver = (e: UploadDragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    handleDragLeave = (e: UploadDragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.#dragDepth = Math.max(0, this.#dragDepth - 1);
        if (this.#dragDepth === 0) {
            this.setState({ dragAreaStatus: 'default' });
        }
    };

    retry = (fileItem: BaseFileItem) => {
        if (this.getProps().disabled) {
            return;
        }
        this.adapter.notifyRetry(fileItem);
        if (fileItem.fileInstance) {
            this.#post(fileItem);
        }
    };

    handlePreviewClick = (fileItem: BaseFileItem) => {
        this.adapter.notifyPreviewClick(fileItem);
    };
}
