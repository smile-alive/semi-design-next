/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import de from '@fibrae/semi-foundation/locale/source/de';
import { render } from '@test/utils/vue';
import Button from '../../button';
import LocaleProvider from '../../locale/locale-provider.vue';
import Upload from '../upload.vue';
import CachedUpload from './fixtures/cached-upload.vue';
import { action, createFile, createObjectURL, fn, getInput, getReplaceInput, prefix, query, renderUpload, revokeObjectURL, selectFiles } from './helpers';

const cropTitle = '裁切图片';
// jsdom never runs CSS animations, so a closing Modal with motion would never unmount
const renderCrop = (props: Record<string, unknown> = {}) => renderUpload({ cropModalProps: { motion: false }, ...props });

class FakeXMLHttpRequest {
    withCredentials = false;
    upload = {};
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {}
}

const getCropperImg = () => query('.semi-cropper img');
// jsdom never loads images, and the cropper only hands out a canvas once the image has loaded
const loadCropperImg = () => fireEvent.load(getCropperImg());
const expectCropperClosed = () => waitFor(() => expect(screen.queryByText(cropTitle)).toBeNull());

// Modal drops a second OK click on the same button within 100ms as a double click; wait the guard out
const pastDoubleClickGuard = () => new Promise((resolve) => setTimeout(resolve, 100));

// jsdom has no canvas implementation; give the cropper a canvas that yields a blob
function mockCropperCanvas() {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () =>
            new Proxy({} as Record<PropertyKey, unknown>, {
                get: (target, key) => target[key] ?? (() => {}),
                set: () => true,
            }) as unknown as RenderingContext
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['cropped'], { type: 'image/png' })));
}

describe('Upload 裁剪', () => {
    beforeEach(() => {
        vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
        createObjectURL.mockImplementation((file) => `blob:${(file as File).name}`);
    });

    it('开启 crop 时对图片文件打开裁剪器', async () => {
        const onFileChange = fn();
        renderCrop({ crop: true, onFileChange });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:avatar.png');
        expect(onFileChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${prefix}-file-card`)).toBeNull();
    });

    it('裁剪弹窗的标题与按钮取自当前语言包', async () => {
        render(LocaleProvider, {
            props: { locale: de },
            slots: {
                default: () => (
                    <Upload action={action} crop cropModalProps={{ motion: false }}>
                        {() => <Button>{() => 'upload'}</Button>}
                    </Upload>
                ),
            },
        });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(de.Upload.cropTitle)).toBeInTheDocument();
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByRole('button', { name: de.Modal.confirm })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: de.Modal.cancel })).toBeInTheDocument();
    });

    it('即使开启 crop，非图片文件也跳过裁剪器', async () => {
        const onFileChange = fn();
        renderCrop({ crop: true, onFileChange });
        await selectFiles([createFile(100, 'note.txt', 'text/plain')]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByText('note.txt')).toBeInTheDocument();
    });

    it('beforeCrop 返回 false 时跳过裁剪器', async () => {
        const beforeCrop = vi.fn<(file: File, fileList: File[]) => boolean>(() => false);
        const onFileChange = fn();
        renderCrop({ crop: true, beforeCrop, onFileChange });
        const file = createFile(100, 'avatar.png', 'image/png');
        await selectFiles([file]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(beforeCrop).toHaveBeenCalledWith(file, [file]);
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(screen.getByText('avatar.png')).toBeInTheDocument();
    });

    it('beforeCrop 抛错时发出 cropError 并保留文件选择', async () => {
        const error = new Error('crop failed');
        const onCropError = fn();
        const onFileChange = fn();
        renderCrop({ crop: true, beforeCrop: () => Promise.reject(error), onCropError, onFileChange });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onCropError).toHaveBeenCalledExactlyOnceWith(error);
        expect(screen.queryByText(cropTitle)).toBeNull();
    });

    it('accept 拒绝的图片不打开裁剪器，只发出 acceptInvalid', async () => {
        const onAcceptInvalid = fn();
        const onFileChange = fn();
        renderCrop({ crop: true, accept: '.png', onAcceptInvalid, onFileChange });
        const before = getInput();
        await selectFiles([createFile(100, 'photo.jpg', 'image/jpeg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(onAcceptInvalid.mock.calls[0][0].map((f: File) => f.name)).toEqual(['photo.jpg']);
        expect(getInput()).not.toBe(before);
        await Promise.resolve();
        expect(screen.queryByText(cropTitle)).toBeNull();
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('只裁剪 accept 接受的图片', async () => {
        mockCropperCanvas();
        const onAcceptInvalid = fn();
        const onFileChange = fn();
        renderCrop({ crop: true, multiple: true, accept: '.png', onAcceptInvalid, onFileChange });
        await selectFiles([createFile(100, 'a.jpg', 'image/jpeg'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png');
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['b.png']);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
    });

    it('超出 limit 的图片先截断再裁剪，只裁剪放得下的', async () => {
        mockCropperCanvas();
        const onExceed = fn();
        const onFileChange = fn();
        renderCrop({ crop: true, multiple: true, limit: 2, onExceed, onFileChange });
        await selectFiles(['a', 'b', 'c', 'd', 'e'].map((name) => createFile(100, `${name}.png`, 'image/png')));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        await loadCropperImg();
        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png', 'b.png']);
        await expectCropperClosed();
        expect(onExceed).toHaveBeenCalledTimes(1);
    });

    it('替换时 accept 拒绝的图片不打开裁剪器，并重置替换选择框', async () => {
        const onAcceptInvalid = fn();
        renderCrop({
            crop: true,
            accept: '.png',
            showReplace: true,
            defaultFileList: [{ uid: '1', name: 'old.png', status: 'success', size: '1KB', url: 'https://x/old.png' }],
            onAcceptInvalid,
        });
        await userEvent.click(query(`button.${prefix}-file-card-replace`));
        const input = getReplaceInput();
        await selectFiles([createFile(100, 'photo.jpg', 'image/jpeg')], input);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getReplaceInput()).not.toBe(input);
        await Promise.resolve();
        expect(screen.queryByText(cropTitle)).toBeNull();
    });

    it('多余的图片排队依次裁剪，不会被静默丢弃', async () => {
        mockCropperCanvas();
        const onFileChange = fn();
        const onCropError = fn();
        renderCrop({ crop: true, multiple: true, onFileChange, onCropError });
        await selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png'), createFile(100, 'note.txt', 'text/plain')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        expect(onFileChange).not.toHaveBeenCalled();
        await loadCropperImg();
        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onCropError).not.toHaveBeenCalled();
        expect(onFileChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png', 'b.png', 'note.txt']);
        await expectCropperClosed();
    });

    it('队列中每张图片使用全新的裁剪器，不继承上一张的缩放', async () => {
        mockCropperCanvas();
        renderCrop({ crop: true, multiple: true });
        await selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        const first = getCropperImg();
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        expect(getCropperImg()).not.toBe(first);
    });

    it('裁剪弹窗打开时再次粘贴不重启当前裁剪队列', async () => {
        mockCropperCanvas();
        const onFileChange = fn();
        renderCrop({ crop: true, multiple: true, addOnPasting: true, onFileChange });
        await selectFiles([createFile(100, 'a.png', 'image/png'), createFile(100, 'b.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        await fireEvent.paste(document.body, {
            clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, 'c.png', 'image/png') }] },
        });
        expect(getCropperImg()).toHaveAttribute('src', 'blob:a.png');
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCropperImg()).toHaveAttribute('src', 'blob:b.png'));
        await loadCropperImg();
        await pastDoubleClickGuard();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onFileChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png', 'b.png']);
    });

    it('取消裁剪时清空队列并重置文件输入框', async () => {
        const onFileChange = fn();
        renderCrop({ crop: true, onFileChange });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        const inputBefore = getInput();
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await expectCropperClosed();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar.png');
        expect(getInput()).not.toBe(inputBefore);
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('拖入图片时打开裁剪器，drop 事件收到的事件与普通模式相同', async () => {
        const dropImage = () =>
            fireEvent.drop(query(`.${prefix}-drag-area`), {
                dataTransfer: { files: [createFile(100, 'avatar.png', 'image/png')] },
            });
        const onPlainDrop = fn();
        const plain = renderCrop({ draggable: true, onDrop: onPlainDrop });
        await dropImage();
        plain.unmount();

        const onDrop = fn();
        const onFileChange = fn();
        renderCrop({ crop: true, draggable: true, onDrop, onFileChange });
        await dropImage();
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(onFileChange).not.toHaveBeenCalled();
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop.mock.calls[0][0].constructor).toBe(onPlainDrop.mock.calls[0][0].constructor);
    });

    it('裁剪模式下粘贴的文件读取失败时发出 pastingError', async () => {
        const onPastingError = fn();
        renderCrop({ crop: true, addOnPasting: true, onPastingError });
        await fireEvent.paste(document.body, {
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

    it('cropModalProps 的 width 生效，style、bodyStyle 与内置高度合并且使用方优先', async () => {
        const onOk = fn();
        mockCropperCanvas();
        const onFileChange = fn();
        renderUpload({
            crop: true,
            onFileChange,
            cropModalProps: {
                motion: false,
                width: 800,
                style: { height: '520px' },
                bodyStyle: { color: 'red' },
                onOk,
            },
        });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        const dialog = await screen.findByRole('dialog');
        expect(query('.semi-modal')).toHaveStyle({ width: '800px', height: '520px' });
        expect(query('.semi-modal-body')).toHaveStyle({ height: '400px', color: 'rgb(255, 0, 0)' });
        expect(dialog).toHaveAccessibleName(cropTitle);
        await loadCropperImg();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        expect(onOk).not.toHaveBeenCalled();
    });

    it('cropModalProps 缺省宽度为 600', async () => {
        renderCrop({ crop: true });
        await selectFiles([createFile(100, 'avatar.png', 'image/png')]);
        await screen.findByRole('dialog');
        expect(query('.semi-modal')).toHaveStyle({ width: '600px', height: '500px' });
    });

    it('KeepAlive：裁剪弹窗打开时失活即取消裁剪，激活后可重新选择同一文件', async () => {
        const onChange = fn();
        render(CachedUpload, {
            props: { uploadProps: { crop: true, cropModalProps: { motion: false }, onChange } as never },
        });
        const image = createFile(100, 'avatar.png', 'image/png');
        await selectFiles([image]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await expectCropperClosed();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.querySelector('[inert]')).toBeNull();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar.png');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await selectFiles([image]);
        expect(await screen.findByText(cropTitle)).toBeInTheDocument();
        expect(getCropperImg()).toHaveAttribute('src', 'blob:avatar.png');
    });
});
