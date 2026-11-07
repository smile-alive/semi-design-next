import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { click, createFile, createObjectURL, fn, getCardNames, getInput, installFakeXhr, lastFileList, renderUpload, revokeObjectURL, selectFiles, type FakeXhr } from './helpers';

vi.mock('../../cropper/cropper.svelte', async () => ({ default: (await import('./cropper-stub.svelte')).default }));

const cropModalProps = { motion: false };

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
    createObjectURL.mockReset();
    createObjectURL.mockImplementation((item) => `blob:crop-${(item as File).name}`);
    revokeObjectURL.mockReset();
});

const dialog = () => screen.queryByRole('dialog');

describe('Upload 裁剪', () => {
    it('crop 开启时选择图片先弹出裁剪框，不立即上传', async () => {
        renderUpload({ crop: true, cropModalProps });
        await selectFiles([createFile(10, 'a.png')]);
        await waitFor(() => expect(dialog()).toBeInTheDocument());
        expect(screen.getByText('裁切图片')).toBeInTheDocument();
        expect(screen.getByTestId('cropper-stub')).toHaveAttribute('src', 'blob:crop-a.png');
        expect(requests).toHaveLength(0);
        expect(getCardNames()).toEqual([]);
    });

    it('非图片文件不裁剪，直接上传', async () => {
        renderUpload({ crop: true, cropModalProps });
        await selectFiles([createFile(10, 'a.txt', 'text/plain')]);
        expect(dialog()).toBeNull();
        expect(requests).toHaveLength(1);
        expect(getCardNames()).toEqual(['a.txt']);
    });

    it('beforeCrop 返回 false 时跳过裁剪', async () => {
        const beforeCrop = vi.fn<(file: File, files: File[]) => boolean>(() => false);
        renderUpload({ crop: true, cropModalProps, beforeCrop });
        const picked = createFile(10, 'a.png');
        await selectFiles([picked]);
        await waitFor(() => expect(requests).toHaveLength(1));
        expect(beforeCrop).toHaveBeenCalledWith(picked, [picked]);
        expect(dialog()).toBeNull();
    });

    it('beforeCrop 抛错时上报 cropError 并跳过裁剪', async () => {
        const onCropError = fn();
        const failure = new Error('boom');
        renderUpload({
            crop: true,
            cropModalProps,
            onCropError,
            beforeCrop: () => {
                throw failure;
            },
        });
        await selectFiles([createFile(10, 'a.png')]);
        await waitFor(() => expect(onCropError).toHaveBeenCalledWith(failure));
        expect(dialog()).toBeNull();
        await waitFor(() => expect(requests).toHaveLength(1));
    });

    it('取消：关闭裁剪框、释放对象 URL、不上传，并重置选择框', async () => {
        renderUpload({ crop: true, cropModalProps });
        const before = getInput();
        await selectFiles([createFile(10, 'a.png')]);
        await waitFor(() => expect(dialog()).toBeInTheDocument());
        await click(screen.getByRole('button', { name: '取消' }));
        await waitFor(() => expect(dialog()).toBeNull());
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:crop-a.png');
        expect(requests).toHaveLength(0);
        expect(getCardNames()).toEqual([]);
        expect(getInput()).not.toBe(before);
    });

    it('确认：用裁剪结果上传，保留文件名与类型', async () => {
        const onChange = fn();
        renderUpload({ crop: true, cropModalProps, onChange });
        await selectFiles([createFile(10, 'a.png')]);
        await waitFor(() => expect(dialog()).toBeInTheDocument());
        await click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(requests).toHaveLength(1));
        await waitFor(() => expect(dialog()).toBeNull());
        const uploaded = requests[0].requestBody.get('a.png') as File;
        expect(uploaded.name).toBe('a.png');
        expect(uploaded.type).toBe('image/png');
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['a.png']);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:crop-a.png');
    });

    it('多张图片依次裁剪，最后一并加入列表，非图片一起上传', async () => {
        const onCropError = fn();
        renderUpload({ crop: true, cropModalProps, multiple: true, onCropError });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'note.txt', 'text/plain'), createFile(10, 'b.png')]);
        await waitFor(() => expect(screen.getByTestId('cropper-stub')).toHaveAttribute('src', 'blob:crop-a.png'));
        await click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(screen.getByTestId('cropper-stub')).toHaveAttribute('src', 'blob:crop-b.png'));
        expect(requests).toHaveLength(0);
        // Modal ignores a second click on the same button within its 100ms debounce window
        await new Promise((resolve) => setTimeout(resolve, 150));
        await click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getCardNames()).toEqual(['a.png', 'b.png', 'note.txt']));
        expect(onCropError).not.toHaveBeenCalled();
        expect(requests).toHaveLength(3);
    });

    it('crop 配置的文案、cropModalProps 的 width 与 style 生效，且样式与默认高度合并', async () => {
        renderUpload({ crop: { modalTitle: '自定义标题', modalOkText: '好', modalCancelText: '算了' }, cropModalProps: { motion: false, width: 720, style: 'margin-top: 5px' } });
        await selectFiles([createFile(10, 'a.png')]);
        await waitFor(() => expect(dialog()).toBeInTheDocument());
        expect(screen.getByText('自定义标题')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '好' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '算了' })).toBeInTheDocument();
        const content = document.querySelector<HTMLElement>('.semi-modal');
        expect(content).toHaveStyle({ width: '720px', height: '500px', marginTop: '5px' });
    });

    it('crop 开启时拖入的图片也先裁剪', async () => {
        renderUpload({ crop: true, cropModalProps, draggable: true });
        await fireEvent.drop(document.querySelector('.semi-upload-drag-area') as HTMLElement, { dataTransfer: { files: [createFile(10, 'drop.png')] } });
        await waitFor(() => expect(screen.getByTestId('cropper-stub')).toHaveAttribute('src', 'blob:crop-drop.png'));
    });
});
