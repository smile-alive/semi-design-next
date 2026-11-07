/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import CachedUpload from './fixtures/cached-upload.vue';
import { createFile, fn, getCardNames, installFakeXhr, renderUpload, selectFiles, type FakeXhr } from './helpers';

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
});

describe('卸载或缓存进行中的 Upload', () => {
    it('卸载后请求不被中止，后续进度与响应不报错', async () => {
        const view = renderUpload();
        await selectFiles([createFile(100, 'pending.png')]);
        view.unmount();
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');

        await requests[0].uploadProgress({ loaded: 40, total: 100 });
        await requests[0].respond(200, '{"ok":true}');

        expect(requests[0].aborted).toBe(false);
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        warn.mockRestore();
        error.mockRestore();
    });

    it('KeepAlive 缓存期间上传完成：success 发出一次，重新激活后文件为成功状态', async () => {
        const onSuccess = fn();
        render(CachedUpload, { props: { uploadProps: { onSuccess } as never } });
        await selectFiles([createFile(100, 'cached.png')]);
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByText('other page')).toBeInTheDocument();

        await requests[0].respond(200, '{"ok":true}');
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));

        expect(requests[0].aborted).toBe(false);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['cached.png']);
        expect(screen.queryByRole('progressbar')).toBeNull();
    });
});
