import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import de from '@fibrae/semi-foundation/locale/source/de';
import { IconUser } from '@fibrae/semi-icons-solid';
import Upload, { type UploadProps } from '..';
import Button from '../../button';
import { LocaleProvider } from '../../locale';

type UploadCallback<K extends keyof UploadProps> = NonNullable<UploadProps[K]>;

// Crop smoke tests; kept in their own file so stray async side effects of other Upload tests cannot affect them.

const action = 'https://semi.bytendance.com';
const cropTitle = '裁切图片';

function renderUpload(props: Partial<UploadProps> = {}) {
    return render(() => (
        // jsdom never runs CSS animations, so a closing Modal with motion would never unmount
        <Upload action={action} cropModalProps={{ motion: false }} {...props}>
            <Button theme="light" icon={<IconUser />}>
                upload
            </Button>
        </Upload>
    ));
}

const getInput = () => document.querySelector(`.${BASE_CLASS_PREFIX}-upload-hidden-input`) as HTMLInputElement;
const getReplaceInput = () => document.querySelector(`.${BASE_CLASS_PREFIX}-upload-hidden-input-replace`) as HTMLInputElement;

function selectFiles(files: File[], input = getInput()) {
    fireEvent.change(input, { target: { files } });
}

const createFile = (size = 100, name = 'avatar.png', type = 'image/png') => new File([new ArrayBuffer(size)], name, { type });

class FakeXMLHttpRequest {
    withCredentials = false;
    upload = {};
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {}
}

describe('Upload 裁剪', () => {
    const createObjectURL = vi.fn<typeof URL.createObjectURL>();
    const revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();

    beforeAll(() => {
        window.URL.createObjectURL = createObjectURL;
        window.URL.revokeObjectURL = revokeObjectURL;
    });

    beforeEach(() => {
        vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
        createObjectURL.mockImplementation((file) => `blob:${(file as File).name}`);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    const getCropperImg = () => document.querySelector(`.${BASE_CLASS_PREFIX}-cropper img`) as HTMLImageElement;
    // jsdom never loads images, and the cropper only hands out a canvas once the image has loaded
    const loadCropperImg = () => fireEvent.load(getCropperImg());

    const expectCropperClosed = () => waitFor(() => expect(screen.queryByText(cropTitle)).toBeNull());

    // Modal drops a second OK click on the same button within 100ms as a double click, and the OK button stays the
    // same element while its loading toggles; confirming the next image is a separate click, so wait the guard out
    const pastDoubleClickGuard = () => {
        return new Promise((resolve) => setTimeout(resolve, 100));
    };

    // jsdom has no canvas implementation; give the cropper a canvas that yields a blob
    const mockCropperCanvas = () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => new Proxy({} as Record<PropertyKey, unknown>, { get: (target, key) => target[key] ?? (() => {}), set: () => true }) as unknown as RenderingContext);
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['cropped'], { type: 'image/png' })));
    };

    it('开启 crop 时对图片文件打开裁剪器', async () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, onFileChange });
        selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:avatar.png');
        expect(onFileChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-file-card`)).toBeNull();
    });

    it('裁剪弹窗的标题与按钮取自当前语言包', async () => {
        render(() => (
            <LocaleProvider locale={de}>
                <Upload action={action} crop cropModalProps={{ motion: false }}>
                    <Button>upload</Button>
                </Upload>
            </LocaleProvider>
        ));
        selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(de.Upload.cropTitle)).toBeInTheDocument();
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByRole('button', { name: de.Modal.confirm })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: de.Modal.cancel })).toBeInTheDocument();
    });

    it('即使开启 crop，非图片文件也跳过裁剪器', async () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, onFileChange });
        selectFiles([createFile(100, 'note.txt', 'text/plain')]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByText('note.txt')).toBeInTheDocument();
    });

    it('beforeCrop 返回 false 时跳过裁剪器', async () => {
        const beforeCrop = vi.fn<UploadCallback<'beforeCrop'>>(() => false);
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, beforeCrop, onFileChange });
        const file = createFile(100, 'avatar.png', 'image/png');
        selectFiles([file]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(beforeCrop).toHaveBeenCalledWith(file, [file]);
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByText('avatar.png')).toBeInTheDocument();
    });

    it('beforeCrop 抛错时通过 adapter 保留 onCropError 回调与文件选择', async () => {
        const error = new Error('crop failed');
        const onCropError = vi.fn<UploadCallback<'onCropError'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, beforeCrop: () => Promise.reject(error), onCropError, onFileChange });
        selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onCropError).toHaveBeenCalledExactlyOnceWith(error);
        expect(screen.queryByText(cropTitle)).toBeNull();
    });

    it('accept 拒绝的图片不打开裁剪器，只触发 onAcceptInvalid', async () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, accept: '.png', onAcceptInvalid, onFileChange });
        const valueSetter = vi.spyOn(getInput(), 'value', 'set');
        selectFiles([createFile(100, 'photo.jpg', 'image/jpeg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(onAcceptInvalid.mock.calls[0][0].map((f) => f.name)).toEqual(['photo.jpg']);
        expect(valueSetter).toHaveBeenCalledWith('');
        await Promise.resolve();
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('只裁剪 accept 接受的图片', async () => {
        mockCropperCanvas();
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, multiple: true, accept: '.png', onAcceptInvalid, onFileChange });
        selectFiles([createFile(100, 'a.jpg', 'image/jpeg'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png');
        loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f) => f.name)).toEqual(['b.png']);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
    });

    it('超出 limit 的图片先截断再裁剪，只裁剪放得下的', async () => {
        mockCropperCanvas();
        const onExceed = vi.fn<UploadCallback<'onExceed'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, multiple: true, limit: 2, onExceed, onFileChange });
        selectFiles(['a', 'b', 'c', 'd', 'e'].map((name) => createFile(100, `${name}.png`, 'image/png')));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        loadCropperImg();
        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f) => f.name)).toEqual(['a.png', 'b.png']);
        await expectCropperClosed();
        expect(onExceed).toHaveBeenCalledTimes(1);
    });

    it('替换时 accept 拒绝的图片不打开裁剪器，并清空替换选择框的值', async () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({
            crop: true,
            accept: '.png',
            showReplace: true,
            defaultFileList: [{ uid: '1', name: 'old.png', status: 'success', size: '1KB', url: 'https://x/old.png' }],
            onAcceptInvalid,
        });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-file-card-replace`) as HTMLElement);
        const valueSetter = vi.spyOn(getReplaceInput(), 'value', 'set');
        selectFiles([createFile(100, 'photo.jpg', 'image/jpeg')], getReplaceInput());
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(valueSetter).toHaveBeenCalledWith('');
        await Promise.resolve();
        expect(screen.queryByText(cropTitle)).toBeNull();
    });

    it('多余的图片排队依次裁剪，不会被静默丢弃', async () => {
        mockCropperCanvas();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        const onCropError = vi.fn<UploadCallback<'onCropError'>>();
        renderUpload({ crop: true, multiple: true, onFileChange, onCropError });
        selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png'), createFile(100, 'note.txt', 'text/plain')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        loadCropperImg();

        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        expect(onFileChange).not.toHaveBeenCalled();
        loadCropperImg();

        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onCropError).not.toHaveBeenCalled();
        expect(onFileChange.mock.calls[0][0].map((f) => f.name)).toEqual(['a.png', 'b.png', 'note.txt']);
        await expectCropperClosed();
    });

    it('队列中每张图片使用全新的裁剪器，不继承上一张的缩放', async () => {
        mockCropperCanvas();
        renderUpload({ crop: true, multiple: true });
        selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        const first = getCropperImg();
        loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        expect(getCropperImg()).not.toBe(first);
    });

    it('裁剪弹窗打开时再次粘贴不重启当前裁剪队列', async () => {
        mockCropperCanvas();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, multiple: true, addOnPasting: true, onFileChange });
        selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        fireEvent.paste(document.body, { clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, 'c.png', 'image/png') }] } });
        await Promise.resolve();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        loadCropperImg();
        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f) => f.name)).toEqual(['a.png', 'b.png']);
    });

    it('取消裁剪时清空队列并清空文件输入框的值', async () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, onFileChange });
        selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        const valueSetter = vi.spyOn(getInput(), 'value', 'set');

        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await expectCropperClosed();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar.png');
        expect(valueSetter).toHaveBeenCalledWith('');
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('拖入图片时打开裁剪器，onDrop 收到的事件与普通模式相同', async () => {
        const dropImage = () => fireEvent.drop(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-drag-area`) as HTMLElement, { dataTransfer: { files: [createFile(100, 'avatar.png', 'image/png')] } });
        const onPlainDrop = vi.fn<UploadCallback<'onDrop'>>();
        const plain = renderUpload({ draggable: true, onDrop: onPlainDrop });
        dropImage();
        plain.unmount();

        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ crop: true, draggable: true, onDrop, onFileChange });
        dropImage();
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(onFileChange).not.toHaveBeenCalled();
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop.mock.calls[0][0].constructor).toBe(onPlainDrop.mock.calls[0][0].constructor);
    });

    it('裁剪模式下粘贴的文件读取失败时调用 onPastingError', async () => {
        const onPastingError = vi.fn<UploadCallback<'onPastingError'>>();
        renderUpload({ crop: true, addOnPasting: true, onPastingError });
        fireEvent.paste(document.body, {
            clipboardData: {
                items: [
                    { kind: 'file', getAsFile: () => createFile(100, 'avatar.png', 'image/png') },
                    { kind: 'file', getAsFile: () => null },
                ],
            },
        });
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(onPastingError).toHaveBeenCalledTimes(1);
    });
});
