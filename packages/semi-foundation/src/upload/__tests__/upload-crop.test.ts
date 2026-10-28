import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import UploadFoundation, { type BaseFileItem, type UploadAdapter, type UploadBaseProps, type UploadBaseState } from '../foundation';

function createFoundation(props: Partial<UploadBaseProps> = {}, fileList: BaseFileItem[] = []) {
    const allProps = { action: '', crop: true, uploadTrigger: 'custom', ...props };
    let state = {
        fileList,
        replaceUid: 'old',
        cropperVisible: false,
        cropperFile: null,
        cropperSrc: '',
        pendingImageFiles: [],
        nonImageFiles: [],
        croppedFiles: [],
        isReplaceOperation: false,
    } as UploadBaseState;
    const canvas = {
        toBlob: (callback: BlobCallback, type?: string) => callback(new Blob(['cropped'], { type })),
    } as unknown as HTMLCanvasElement;
    const adapter = {
        getContext: () => undefined,
        getContexts: () => ({}),
        getProp: (key) => allProps[key],
        getProps: () => allProps,
        getState: (key) => state[key],
        getStates: () => state,
        setState: (next) => {
            state = { ...state, ...next };
        },
        updateFileList: (list) => {
            state = { ...state, fileList: list };
        },
        notifyFileSelect: vi.fn<UploadAdapter['notifyFileSelect']>(),
        notifyCropError: vi.fn<(error: Error) => void>(),
        notifyChange: () => {},
        notifySizeError: () => {},
        notifyAcceptInvalid: () => {},
        updateLocalUrls: () => {},
        resetInput: vi.fn<UploadAdapter['resetInput']>(),
        resetReplaceInput: vi.fn<UploadAdapter['resetReplaceInput']>(),
        getCropperCanvas: vi.fn<UploadAdapter['getCropperCanvas']>(() => canvas),
    };
    const foundation = new UploadFoundation(adapter as unknown as UploadAdapter);
    return { foundation, adapter, getState: () => state };
}

const createFile = (name: string, type: string) => new File(['x'], name, { type });
const names = (files: File[]) => files.map((file) => file.name);
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('Upload foundation 裁剪队列', () => {
    let revoke: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;

    beforeEach(() => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        revoke = vi.fn<typeof URL.revokeObjectURL>();
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('图片依次裁剪，队列清空后与非图片文件一起加入列表', async () => {
        const { foundation, adapter, getState } = createFoundation();
        foundation.addFiles([createFile('a.png', 'image/png'), createFile('b.png', 'image/png'), createFile('note.txt', 'text/plain')]);
        await settle();
        expect(getState()).toMatchObject({ cropperVisible: true, cropperSrc: 'blob:a.png' });
        expect(names(getState().pendingImageFiles)).toEqual(['b.png']);
        expect(names(getState().nonImageFiles)).toEqual(['note.txt']);
        expect(adapter.notifyFileSelect).not.toHaveBeenCalled();

        await foundation.confirmCrop();
        expect(getState()).toMatchObject({ cropperVisible: true, cropperSrc: 'blob:b.png' });
        expect(revoke).toHaveBeenCalledWith('blob:a.png');
        expect(adapter.notifyFileSelect).not.toHaveBeenCalled();

        await foundation.confirmCrop();
        expect(revoke).toHaveBeenCalledWith('blob:b.png');
        expect(getState()).toMatchObject({ cropperVisible: false, cropperFile: null, cropperSrc: '' });
        expect(adapter.notifyFileSelect).toHaveBeenCalledTimes(1);
        expect(names(adapter.notifyFileSelect.mock.calls[0][0])).toEqual(['a.png', 'b.png', 'note.txt']);
        expect(getState().fileList.map((item) => item.name)).toEqual(['a.png', 'b.png', 'note.txt']);
    });

    it('取消时清空队列、释放预览地址并重置两个输入框', async () => {
        const { foundation, adapter, getState } = createFoundation();
        foundation.addFiles([createFile('a.png', 'image/png'), createFile('b.png', 'image/png')]);
        await settle();
        foundation.cancelCrop();
        expect(revoke).toHaveBeenCalledWith('blob:a.png');
        expect(getState()).toMatchObject({ cropperVisible: false, pendingImageFiles: [], croppedFiles: [] });
        expect(adapter.resetInput).toHaveBeenCalledTimes(1);
        expect(adapter.resetReplaceInput).toHaveBeenCalledTimes(1);
        expect(adapter.notifyFileSelect).not.toHaveBeenCalled();
    });

    it.each([false, true])('beforeCrop 拒绝裁剪时直接加入，抛错通过 adapter 通知：%s', async (throws) => {
        const error = new Error('boom');
        const beforeCrop = () => (throws ? Promise.reject(error) : false);
        const { foundation, adapter, getState } = createFoundation({ beforeCrop });
        const file = createFile('a.png', 'image/png');
        foundation.addFiles([file]);
        await settle();
        expect(getState().cropperVisible).toBe(false);
        expect(adapter.notifyFileSelect).toHaveBeenCalledWith([file]);
        expect(adapter.notifyCropError.mock.calls).toEqual(throws ? [[error]] : []);
    });

    it('替换只裁剪最后选中的那一个文件，结果替换 replaceUid 对应的条目', async () => {
        const old = { uid: 'old', name: 'old.png', size: '1KB', status: 'success' } as BaseFileItem;
        const { foundation, adapter, getState } = createFoundation({}, [old]);
        foundation.handleReplaceChange([createFile('a.png', 'image/png'), createFile('b.png', 'image/png')]);
        await settle();
        expect(getState()).toMatchObject({ isReplaceOperation: true, pendingImageFiles: [], nonImageFiles: [] });

        await foundation.confirmCrop();
        expect(names(adapter.notifyFileSelect.mock.calls[0][0])).toEqual(['b.png']);
        expect(getState().fileList.map((item) => item.name)).toEqual(['b.png']);
    });

    it('画布按 png 回退编码时，输出文件的类型与扩展名跟随实际内容', async () => {
        const { foundation, adapter, getState } = createFoundation();
        // Chrome encodes only png, jpeg and webp and answers anything else with png
        adapter.getCropperCanvas.mockReturnValue({
            toBlob: (callback: BlobCallback, type?: string) => callback(new Blob(['cropped'], { type: ['image/jpeg', 'image/webp'].includes(type) ? type : 'image/png' })),
        } as unknown as HTMLCanvasElement);
        foundation.addFiles([createFile('anim.gif', 'image/gif')]);
        await settle();
        await foundation.confirmCrop();
        const [cropped] = adapter.notifyFileSelect.mock.calls[0][0];
        expect([cropped.name, cropped.type]).toEqual(['anim.png', 'image/png']);
        expect(getState().fileList[0]).toMatchObject({ name: 'anim.png' });
    });

    it('画布按原类型编码时保留原文件名', async () => {
        const { foundation, adapter } = createFoundation();
        foundation.addFiles([createFile('photo.jpg', 'image/jpeg')]);
        await settle();
        await foundation.confirmCrop();
        const [cropped] = adapter.notifyFileSelect.mock.calls[0][0];
        expect([cropped.name, cropped.type]).toEqual(['photo.jpg', 'image/jpeg']);
    });

    it('没有裁剪画布时通过 adapter 通知错误，队列保持不变', async () => {
        const { foundation, adapter, getState } = createFoundation();
        foundation.addFiles([createFile('a.png', 'image/png')]);
        await settle();
        adapter.getCropperCanvas.mockReturnValue(null);
        await foundation.confirmCrop();
        expect(adapter.notifyCropError).toHaveBeenCalledTimes(1);
        expect(getState().cropperVisible).toBe(true);
        expect(adapter.notifyFileSelect).not.toHaveBeenCalled();
    });
});
