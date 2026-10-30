import { flushSync } from 'svelte';
import { createEvent, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { AfterUploadProps, AfterUploadResult, BeforeUploadObjectResult, BeforeUploadProps, FileItem, UploadProps } from '../interface';
import { action, click, createFile, createObjectURL, defaultFileList, fn, getCardNames, getDragArea, getInput, getPicCards, getReplaceInput, installFakeXhr, lastFileList, prefix, PROGRESS_COEFFICIENT, query, renderUpload, revokeObjectURL, selectFiles, type FakeXhr } from './helpers';

type BeforeUpload = NonNullable<UploadProps['beforeUpload']>;

const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
const getCard = (name: string) => screen.getByText(name).closest(`.${prefix}-file-card`) as HTMLElement;
const replaceButton = () => query(`button.${prefix}-file-card-replace`);

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
});

/**
 * Opening the native file browser cannot be tested in jsdom; tests only check that the hidden input is clicked.
 */
describe('Upload 请求', () => {
    it('class 与 style 落在根元素', () => {
        const { container } = renderUpload({ class: 'test', style: 'color: red', action: '' });
        const root = query('div.test', container);
        expect(root).toHaveClass(prefix);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('action 与 withCredentials', async () => {
        renderUpload({ withCredentials: true, data: { semiKey: 123456 } });
        await selectFiles([file]);
        expect(requests[0].url).toEqual(action);
        expect(requests[0].withCredentials).toEqual(true);
    });

    it('data、headers 与 name', async () => {
        const headers = { 'x-tt-header': 'semi' };
        const name = 'bytedance.jpeg';
        renderUpload({ data: { semiKey: 123456 }, name, headers });
        await selectFiles([file]);
        const requestBody = Array.from(requests[0].requestBody);
        expect(requestBody[0][0]).toEqual('semiKey');
        expect(requestBody[0][1]).toEqual('123456');
        expect(requests[0].requestHeaders).toEqual(headers);
        expect(requestBody[1][0]).toEqual(name);
    });

    it('data 与 headers 为函数', async () => {
        const headers = { 'x-tt-header': 'semi' };
        const data = { semiKey: 123456 };
        const getData = vi.fn<(file: File) => typeof data>(() => data);
        const getHeaders = vi.fn<(file: File) => typeof headers>(() => headers);
        renderUpload({ data: getData, headers: getHeaders });
        await selectFiles([file]);
        const requestBody = Array.from(requests[0].requestBody);
        expect(requestBody[0][0]).toEqual('semiKey');
        expect(requestBody[0][1]).toEqual('123456');
        expect(getData).toHaveBeenCalledExactlyOnceWith(file);
        expect(requests[0].requestHeaders).toEqual(headers);
        expect(getHeaders).toHaveBeenCalledExactlyOnceWith(file);
    });

    it('fileName 属性', async () => {
        renderUpload({ fileName: 'customFileName' });
        await selectFiles([createFile(100, 'test.jpg')]);
        expect(Array.from(requests[0].requestBody)[0][0]).toEqual('customFileName');
    });

    it('transformFile 函数', async () => {
        const transformFile = vi.fn<(origin: File) => File>((origin) => new File([origin], `transformed-${origin.name}`, { type: origin.type }));
        renderUpload({ transformFile });
        const origin = createFile(100, 'origin.png');
        await selectFiles([origin]);
        expect(transformFile).toHaveBeenCalledWith(origin);
        expect(getCardNames()).toEqual(['transformed-origin.png']);
        expect((Array.from(requests[0].requestBody)[0][1] as File).name).toEqual('transformed-origin.png');
    });

    it('customRequest 替代内置请求，且不创建 XMLHttpRequest', async () => {
        const customRequest = vi.fn<(args: { onSuccess: (body: unknown) => void }) => void>(({ onSuccess }) => {
            setTimeout(() => onSuccess({ url: 'https://example.com/file.jpg' }), 100);
        });
        const onChange = fn();
        renderUpload({ customRequest, onChange });
        const selected = createFile(100, 'custom.png');
        await selectFiles([selected]);
        expect(customRequest).toHaveBeenCalledTimes(1);
        expect(customRequest.mock.calls[0][0]).toMatchObject({ fileInstance: selected, fileName: 'custom.png', action });
        expect(requests).toHaveLength(0);
        await waitFor(() => expect(lastFileList(onChange)[0].status).toEqual('success'));
        expect(lastFileList(onChange)[0].response).toEqual({ url: 'https://example.com/file.jpg' });
    });

    it('progress', async () => {
        const onProgress = fn();
        renderUpload({ onProgress });
        await selectFiles([file]);
        await requests[0].uploadProgress({ loaded: 40, total: 100 });
        await requests[0].uploadProgress({ loaded: 80, total: 100 });
        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress.mock.calls[0][0]).toEqual(40 * PROGRESS_COEFFICIENT);
        expect(onProgress.mock.calls[0][1]).toBe(file);
        expect(onProgress.mock.calls[1][0]).toEqual(80 * PROGRESS_COEFFICIENT);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(80 * PROGRESS_COEFFICIENT));
    });

    it('success', async () => {
        const body = [{ id: 12, comment: 'Hey there' }];
        const onSuccess = fn();
        const onChange = fn();
        renderUpload({ onSuccess, onChange });
        await selectFiles([file]);
        await requests[0].respond(200, JSON.stringify(body));
        expect(onSuccess).toHaveBeenCalledTimes(1);
        const [responseBody, fileInstance, fileList] = onSuccess.mock.calls[0];
        expect(responseBody).toEqual(body);
        expect(fileInstance).toBe(file);
        expect(fileList.map((item: FileItem) => item.status)).toEqual(['success']);
        expect(lastFileList(onChange)[0]).toMatchObject({ status: 'success', percent: 100, response: body });
    });

    it('error', async () => {
        const onError = fn();
        renderUpload({ onError });
        await selectFiles([file]);
        await requests[0].respond(404, '[{ "id": 12, "comment": "Hey there" }]');
        expect(onError).toHaveBeenCalledTimes(1);
        const [error, fileInstance, fileList, xhr] = onError.mock.calls[0];
        expect(error.method).toEqual('post');
        expect(error.status).toEqual(404);
        expect(error.message).toMatch(/xhr status: 404$/);
        expect(fileInstance).toBeInstanceOf(File);
        expect(Array.isArray(fileList)).toEqual(true);
        expect(xhr).toBeInstanceOf(XMLHttpRequest);
        expect(screen.getByText('上传失败')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    });

    it('retry', async () => {
        const onRetry = fn();
        const fileInstance = createFile(200, 'semi.jpg');
        renderUpload({
            fileList: [{ uid: '2', name: 'test.jpeg', status: 'uploadFail', size: '222KB', preview: true, fileInstance }],
            onRetry,
        });
        await click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry.mock.calls[0][0].fileInstance).toBeInstanceOf(File);
        expect(requests).toHaveLength(1);
    });

    it('重试缺少 File 对象的文件时发出 retry 且不发送请求', async () => {
        const onRetry = fn();
        renderUpload({ fileList: defaultFileList, onRetry });
        await click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
    });

    it('fileChange', async () => {
        const onFileChange = fn();
        renderUpload({ onFileChange });
        await selectFiles([file]);
        expect(onFileChange).toHaveBeenCalledExactlyOnceWith([file]);
    });

    it('change 事件只收到组件对象，不收到隐藏 input 冒泡的原生 change', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(10, 'a.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).not.toBeInstanceOf(Event);
        expect(Object.keys(onChange.mock.calls[0][0]).toSorted()).toEqual(['currentFile', 'fileList']);
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('a.png');
    });

    it('一次选择多个文件只发出一次 change，并带上全部新增项', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [{ fileList, currentFile }] = onChange.mock.calls[0];
        expect(fileList.map((item: FileItem) => item.name)).toEqual(['a.png', 'b.png', 'c.png']);
        expect(currentFile.name).toBe('c.png');
    });

    it('上传、上报各执行一次', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(100, 'once.png')]);
        expect(requests).toHaveLength(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});

describe('Upload 选择校验', () => {
    it('accept', () => {
        const accept = 'application/pdf,image/png,image/jpeg';
        renderUpload({ accept });
        expect(getInput()).toHaveAttribute('accept', accept);
        expect(getReplaceInput()).toHaveAttribute('accept', accept);
    });

    it('minSize、maxSize 与 sizeError', async () => {
        const kb1 = 1024 * 1024;
        const onSizeError = fn();
        renderUpload({ maxSize: kb1 * 3, minSize: kb1 * 2, onSizeError });
        await selectFiles([createFile(kb1 * 4, 'bigSemi.jpeg')]);
        await selectFiles([createFile(kb1, 'smallSemi.jpeg')]);
        expect(onSizeError).toHaveBeenCalledTimes(2);
        const [firstArgs, secondArgs] = onSizeError.mock.calls;
        expect(firstArgs[0]).toBeInstanceOf(File);
        expect(firstArgs[0].name).toEqual('bigSemi.jpeg');
        expect(firstArgs[1]).toEqual([]);
        expect(secondArgs[0].name).toEqual('smallSemi.jpeg');
        expect(secondArgs[1].map((item: FileItem) => item.name)).toEqual(['bigSemi.jpeg']);
        expect(screen.getAllByText('文件尺寸不合法')).toHaveLength(2);
        expect(requests).toHaveLength(0);
    });

    it('limit 与 exceed', async () => {
        const onExceed = fn();
        renderUpload({ limit: 2, onExceed });
        await selectFiles([createFile(1024, 'fileA'), createFile(1024, 'fileB'), createFile(1024, 'fileC')]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['fileA', 'fileB']);
    });

    it('limit=1 时选择新文件替换旧文件，也不发出 exceed', async () => {
        const onChange = fn();
        const onExceed = fn();
        renderUpload({ limit: 1, fileList: defaultFileList, onChange, onExceed });
        await selectFiles([createFile(100, 'a.png'), createFile(100, 'b.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['b.png']);
        expect(getCardNames()).toEqual(['b.png']);
        expect(onExceed).not.toHaveBeenCalled();
    });

    it('已有文件数超过 limit 时，选择与 insert 都不再追加文件', async () => {
        const onExceed = fn();
        const items = Array.from({ length: 3 }, (_, i) => ({ uid: `d${i}`, name: `d${i}.png`, status: 'success' as const, size: '1KB', url: `https://example.com/d${i}.png` }));
        const view = renderUpload({ fileList: items, limit: 2, onExceed });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
        view.call((handle) => handle.insert([createFile(10, 'e.png'), createFile(10, 'f.png')]));
        expect(onExceed).toHaveBeenCalledTimes(2);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
    });

    it('exceed 在选择文件与 insert 两条路径都收到截断前的全部文件', async () => {
        const onExceed = fn();
        const view = renderUpload({ limit: 2, onExceed });
        await selectFiles([createFile(10, 'a'), createFile(10, 'b'), createFile(10, 'c')]);
        expect(onExceed.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a', 'b', 'c']);
        view.call((handle) => handle.insert([createFile(10, 'd'), createFile(10, 'e')]));
        expect(onExceed.mock.calls[1][0].map((f: File) => f.name)).toEqual(['d', 'e']);
    });

    it('文件变更时的 acceptInvalid', async () => {
        const onAcceptInvalid = fn();
        const onFileChange = fn();
        renderUpload({ accept: 'image/png', onAcceptInvalid, onFileChange });
        await selectFiles([createFile(100, 'a.jpg', 'image/jpg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(onAcceptInvalid.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.jpg']);
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('accept 拒绝的文件发出 acceptInvalid，其余照常加入', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ fileList: defaultFileList, accept: '.png', onAcceptInvalid });
        const pdf = createFile(100, 'doc.pdf', 'application/pdf');
        await selectFiles([pdf, createFile(100, 'ok.png')]);
        expect(onAcceptInvalid).toHaveBeenCalledWith([pdf]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'ok.png']);
    });

    it('所有文件被 accept 拒绝后重置选择框，再选同一文件仍会发出 acceptInvalid', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', onAcceptInvalid });
        const before = getInput();
        await selectFiles([createFile(10, 'a.jpg', 'image/jpeg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getInput()).not.toBe(before);
    });

    it('accept 的扩展名接受大写文件名，不接受仅以相同字母结尾的文件名', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', onAcceptInvalid });
        await selectFiles([createFile(10, 'PHOTO.PNG', '')]);
        expect(onAcceptInvalid).not.toHaveBeenCalled();
        expect(requests).toHaveLength(1);
        await selectFiles([createFile(10, 'notpng', '')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(1);
    });

    it('替换的文件被 accept 拒绝后重置替换选择框', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', showReplace: true, fileList: [defaultFileList[0]], onAcceptInvalid });
        await click(replaceButton());
        const before = getReplaceInput();
        await selectFiles([createFile(10, 'a.jpg', 'image/jpeg')], before);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(onAcceptInvalid.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.jpg']);
        expect(getReplaceInput()).not.toBe(before);
        expect(getCardNames()).toEqual(['vigo.png']);
    });

    it('insert 缺少 uid 的超限文件被标记为校验失败且不上传，transformFile 返回新 File 时 uid 唯一', async () => {
        const onChange = fn();
        const cloneFile = (f: File) => new File([f], f.name, { type: f.type });
        const view = renderUpload({ maxSize: 1, transformFile: cloneFile, onChange });
        view.call((handle) => handle.insert([createFile(4096, 'big.png')]));
        expect(lastFileList(onChange)[0].status).toBe('validateFail');
        expect(requests).toHaveLength(0);
        view.call((handle) => handle.insert([createFile(1, 'a.png'), createFile(1, 'b.png')]));
        const uids = lastFileList(onChange).map((item) => item.uid);
        expect(uids.every(Boolean)).toBe(true);
        expect(new Set(uids).size).toBe(3);
    });
});

describe('Upload beforeUpload 与 afterUpload', () => {
    it('beforeUpload 返回 boolean', async () => {
        const beforeUpload = vi.fn<BeforeUpload>(({ file }) => file.name === 'pass.jpg');
        const onChange = fn();
        renderUpload({ beforeUpload, onChange });
        await selectFiles([createFile(10, 'pass.jpg')]);
        expect(getCardNames()).toEqual(['pass.jpg']);
        await selectFiles([createFile(20, 'fail.jpg')]);
        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.name)).toEqual(['pass.jpg', 'fail.jpg']);
        expect(fileList.map((item) => item.status)).toEqual(['uploading', 'validateFail']);
        expect(getCard('fail.jpg')).toHaveClass(`${prefix}-file-card-fail`);
        expect(requests).toHaveLength(1);
        expect(beforeUpload).toHaveBeenCalledTimes(2);
    });

    it('beforeUpload 同步返回对象', async () => {
        const beforeUpload = vi.fn<BeforeUpload>(({ file }) => {
            const result: BeforeUploadObjectResult = { shouldUpload: false, autoRemove: false };
            if (file.name === 'pass.jpg') result.shouldUpload = true;
            if (file.name === 'invalid.jpg') {
                result.validateMessage = 'not valid file';
                result.status = 'validateFail';
            }
            if (file.name === 'autoRemove.jpg') result.autoRemove = true;
            return result;
        });
        const onChange = fn();
        renderUpload({ beforeUpload, onChange });
        await selectFiles([createFile(10, 'pass.jpg')]);
        expect(getCardNames()).toEqual(['pass.jpg']);
        await selectFiles([createFile(20, 'invalid.jpg')]);
        await selectFiles([createFile(30, 'autoRemove.jpg')]);
        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.status)).toEqual(['uploading', 'validateFail']);
        expect(fileList[1].validateMessage).toEqual('not valid file');
        expect(getCardNames()).toEqual(['pass.jpg', 'invalid.jpg']);
        expect(screen.getByText('not valid file')).toBeInTheDocument();
        expect(requests).toHaveLength(1);
        expect(beforeUpload).toHaveBeenCalledTimes(3);
    });

    it('beforeUpload 返回 Promise', async () => {
        const beforeUpload = vi.fn<(args: BeforeUploadProps) => Promise<unknown> | undefined>(({ file }) => {
            switch (file.name) {
                case 'reject.jpg':
                    return new Promise((_, reject) => setTimeout(reject, 10));
                case 'resolve.jpg':
                    return new Promise((resolve) => setTimeout(resolve, 10));
                case 'resloveObject.jpg':
                    return new Promise((resolve) => setTimeout(() => resolve({ fileInstance: createFile(200, 'afterProcess.jpg') }), 10));
                case 'rejectObject.jpg':
                    return new Promise((_, reject) => setTimeout(() => reject({ status: 'validateFail', validateMessage: 'not valid' }), 10));
                default:
                    return undefined;
            }
        });
        const onChange = fn();
        renderUpload({ beforeUpload, onChange });
        const statuses = () => lastFileList(onChange).map((item) => item.status);
        await selectFiles([createFile(50, 'reject.jpg')]);
        await waitFor(() => expect(statuses()).toEqual(['validateFail']));
        await selectFiles([createFile(50, 'resolve.jpg')]);
        await waitFor(() => expect(requests).toHaveLength(1));
        await selectFiles([createFile(50, 'resloveObject.jpg')]);
        await waitFor(() => expect(requests).toHaveLength(2));
        await selectFiles([createFile(50, 'rejectObject.jpg')]);
        await waitFor(() => expect(statuses()).toHaveLength(4));
        await waitFor(() => expect(statuses()[3]).toEqual('validateFail'));
        expect(beforeUpload).toHaveBeenCalledTimes(4);
        const fileList = lastFileList(onChange);
        expect(statuses()).toEqual(['validateFail', 'uploading', 'uploading', 'validateFail']);
        expect(fileList[2].fileInstance?.name).toEqual('afterProcess.jpg');
        expect(requests[1].requestBody.get('afterProcess.jpg')).toBeInstanceOf(File);
        expect(fileList[3].validateMessage).toEqual('not valid');
        await waitFor(() => expect(getCardNames()).toEqual(['reject.jpg', 'resolve.jpg', 'afterProcess.jpg', 'rejectObject.jpg']));
        expect(screen.getByText('not valid')).toBeInTheDocument();
    });

    it('beforeUpload 同步返回的对象缺省 shouldUpload 时照常上传，返回 null 时不抛错', async () => {
        const view = renderUpload({ beforeUpload: () => ({ validateMessage: 'checked' }) });
        await selectFiles([createFile(10, 'a.png')]);
        expect(requests).toHaveLength(1);
        view.update({ beforeUpload: () => null });
        await expect(selectFiles([createFile(10, 'b.png')])).resolves.not.toThrow();
    });

    it('afterUpload', async () => {
        const codeStatusMaps: Record<number, AfterUploadResult['status']> = { 0: 'success', 1: 'uploadFail', 2: 'validateFail' };
        const afterUpload = vi.fn<(args: AfterUploadProps) => AfterUploadResult>(({ response }) => {
            const result: AfterUploadResult = { status: codeStatusMaps[response.code] };
            if (response.message) result.validateMessage = response.message;
            if (response.autoRemove) result.autoRemove = true;
            if (response.newName) result.name = response.newName;
            return result;
        });
        const onChange = fn();
        renderUpload({ afterUpload, onChange });
        const respondJson = (request: FakeXhr, body: object) => request.respond(200, JSON.stringify(body));
        await selectFiles([createFile(234, 'uploadSuccess.jpg')]);
        await respondJson(requests[0], { code: 0 });
        await selectFiles([createFile(123, 'uploadFail.jpg')]);
        const uploadFailMessage = 'upload request fail';
        await respondJson(requests[1], { code: 1, message: uploadFailMessage });
        await selectFiles([createFile(123, 'validateFail.jpg')]);
        const validateFailMessage = 'what u upload is invalid';
        await respondJson(requests[2], { code: 2, message: validateFailMessage });
        await selectFiles([createFile(123, 'remove.jpg')]);
        await respondJson(requests[3], { code: 2, autoRemove: true });
        await selectFiles([createFile(123, 'semi.jpg')]);
        const rename = 'renameByAfterUpload.jpg';
        await respondJson(requests[4], { code: 1, newName: rename });

        expect(afterUpload).toHaveBeenCalledTimes(5);
        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.status)).toEqual(['success', 'uploadFail', 'validateFail', 'uploadFail']);
        expect(fileList[1].validateMessage).toEqual(uploadFailMessage);
        expect(fileList[2].validateMessage).toEqual(validateFailMessage);
        expect(getCardNames()).toEqual(['uploadSuccess.jpg', 'uploadFail.jpg', 'validateFail.jpg', rename]);
        expect(screen.getByText(uploadFailMessage)).toBeInTheDocument();
        expect(screen.getByText(validateFailMessage)).toBeInTheDocument();
    });

    it('afterUpload 与 autoRemove 时，change 将被移除的文件作为当前文件上报', async () => {
        const onChange = fn();
        renderUpload({ afterUpload: () => ({ autoRemove: true }), onChange });
        await selectFiles([createFile(10, 'first.jpg')]);
        await selectFiles([createFile(20, 'second.jpg')]);
        await requests[0].respond(200, '{}');
        expect(getCardNames()).toEqual(['second.jpg']);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ currentFile: expect.objectContaining({ name: 'first.jpg' }) }));
    });

    it('uploadTrigger="custom" 时选择文件只入列，upload() 只上传等待中的文件', async () => {
        const onChange = fn();
        const view = renderUpload({ uploadTrigger: 'custom', onChange, fileList: defaultFileList });
        await selectFiles([createFile(234, 'semi.jpg')]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'semi.jpg']);
        expect(lastFileList(onChange)[2].status).toEqual('wait');
        expect(requests).toHaveLength(0);
        view.call((handle) => handle.upload());
        expect(requests).toHaveLength(1);
    });

    it('全局默认值对函数 prop 也生效，实例值优先', async () => {
        const globalBeforeUpload = vi.fn<BeforeUpload>(() => false);
        const ownBeforeUpload = vi.fn<BeforeUpload>(() => true);
        const { default: semiGlobal } = await import('../../_utils/semi-global');
        const previous = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Upload: { listType: 'picture', beforeUpload: globalBeforeUpload } };
        try {
            const view = renderUpload();
            expect(query(`.${prefix}`)).toHaveClass(`${prefix}-picture`);
            await selectFiles([createFile(10, 'a.png')]);
            expect(globalBeforeUpload).toHaveBeenCalledTimes(1);
            expect(requests).toHaveLength(0);
            view.unmount();

            renderUpload({ listType: 'list', beforeUpload: ownBeforeUpload });
            expect(query(`.${prefix}`)).not.toHaveClass(`${prefix}-picture`);
            await selectFiles([createFile(10, 'b.png')]);
            expect(ownBeforeUpload).toHaveBeenCalledTimes(1);
            expect(globalBeforeUpload).toHaveBeenCalledTimes(1);
            expect(requests).toHaveLength(1);
        } finally {
            semiGlobal.config.overrideDefaultProps = previous;
        }
    });
});

describe('Upload 删除、清空与对象 URL', () => {
    it('remove', async () => {
        const onRemove = fn();
        const onChange = fn();
        const fileInstance = createFile(200, 'semi.jpg');
        renderUpload({
            fileList: [{ uid: '2', name: 'test.jpeg', status: 'uploadFail', size: '222KB', preview: true, fileInstance }],
            onRemove,
            onChange,
        });
        await click(query(`button.${prefix}-file-card-close`));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(lastFileList(onChange)).toEqual([]);
        const [removedFile, fileList, fileItem] = onRemove.mock.calls[0];
        expect(removedFile).toBe(fileInstance);
        expect(fileList).toEqual([]);
        expect(fileItem.uid).toEqual('2');
        await waitFor(() => expect(screen.queryByText('test.jpeg')).toBeNull());
    });

    it('remove 事件首参：不带 File 的文件项为 undefined', async () => {
        const onRemove = fn();
        renderUpload({ fileList: [defaultFileList[0]], onRemove });
        await click(query(`.${prefix}-file-card-close`));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(onRemove.mock.calls[0][0]).toBeUndefined();
    });

    it('beforeRemove 的副作用', async () => {
        const fileList = [defaultFileList[0]];
        const onChange = fn();
        const onRemove = fn();
        const onChangePass = fn();
        const onRemovePass = fn();
        const { container } = renderUpload({ fileList, beforeRemove: () => false, onChange, onRemove });
        const { container: containerPass } = renderUpload({ fileList, beforeRemove: () => true, onChange: onChangePass, onRemove: onRemovePass });
        await click(query(`.${prefix}-file-card-close`, container));
        await click(query(`.${prefix}-file-card-close`, containerPass));
        await waitFor(() => expect(onRemovePass).toHaveBeenCalledTimes(1));
        expect(onRemovePass.mock.calls[0][2].uid).toEqual('1');
        expect(onChangePass).toHaveBeenCalledTimes(1);
        expect(onChangePass.mock.calls[0][0].fileList).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onRemove).not.toHaveBeenCalled();
    });

    it('beforeRemove 收到文件项与当前列表；被拒绝时视为取消', async () => {
        const beforeRemove = vi.fn<(fileItem: FileItem, fileList: FileItem[]) => boolean | Promise<boolean>>(() => true);
        const onRemove = fn();
        renderUpload({ fileList: defaultFileList, beforeRemove, onRemove });
        await click(query(`.${prefix}-file-card-close`, getCard('vigo.png')));
        expect(beforeRemove).toHaveBeenCalledTimes(1);
        const [fileItem, fileList] = beforeRemove.mock.calls[0];
        expect(fileItem).toMatchObject({ uid: '1' });
        expect(fileList.map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(getCardNames()).toEqual(['test.jpeg']));
        beforeRemove.mockImplementation(() => Promise.reject(new Error('no')));
        await click(query(`.${prefix}-file-card-close`));
        await Promise.resolve();
        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['test.jpeg']);
    });

    it('异步 beforeRemove 期间其他文件的状态变化不被旧快照覆盖', async () => {
        let release: (value: boolean) => void = () => {};
        const onChange = fn();
        renderUpload({ beforeRemove: () => new Promise<boolean>((resolve) => (release = resolve)), onChange });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png')]);
        await click(document.querySelectorAll<HTMLElement>(`.${prefix}-file-card-close`)[0]);
        await requests[1].respond(200, '{}');
        release(true);
        await waitFor(() => expect(lastFileList(onChange).map((item) => item.name)).toEqual(['b.png']));
        expect(lastFileList(onChange)[0].status).toBe('success');
    });

    it('清空列表，beforeClear 默认通过且收到当前列表', async () => {
        const onClear = fn();
        const onChange = fn();
        const beforeClear = vi.fn<(fileList: FileItem[]) => boolean>(() => true);
        renderUpload({ fileList: defaultFileList, onClear, onChange, beforeClear });
        await click(screen.getByRole('button', { name: '清空' }));
        expect(beforeClear.mock.calls[0][0].map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
        expect(onChange).toHaveBeenCalledWith({ fileList: [] });
        await waitFor(() => expect(document.querySelector(`.${prefix}-file-card`)).toBeNull());
    });

    it('beforeClear 的副作用', async () => {
        const fileList = [defaultFileList[0]];
        const onChange = fn();
        const onClear = fn();
        const onChangePass = fn();
        const onClearPass = fn();
        const onChangeReject = fn();
        const onClearReject = fn();
        const beforeClear = vi.fn<() => Promise<boolean>>(() => Promise.resolve(false));
        const beforeClearReject = vi.fn<() => Promise<boolean>>(() => Promise.reject());
        const { container } = renderUpload({ fileList, beforeClear, onChange, onClear });
        const { container: containerPass } = renderUpload({ fileList, beforeClear: () => Promise.resolve(true), onChange: onChangePass, onClear: onClearPass });
        const { container: containerReject } = renderUpload({ fileList, beforeClear: beforeClearReject, onChange: onChangeReject, onClear: onClearReject });
        const clearSelector = `.${prefix}-file-list-title-clear`;
        await click(query(clearSelector, container));
        await click(query(clearSelector, containerPass));
        await click(query(clearSelector, containerReject));
        await waitFor(() => expect(onChangePass).toHaveBeenCalledTimes(1));
        expect(onChangePass.mock.calls[0][0].fileList).toEqual([]);
        expect(onClearPass).toHaveBeenCalledTimes(1);
        expect(beforeClear).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(onClear).not.toHaveBeenCalled();
        expect(beforeClearReject).toHaveBeenCalledTimes(1);
        expect(onChangeReject).not.toHaveBeenCalled();
        expect(onClearReject).not.toHaveBeenCalled();
    });

    it('remove 与 clear 时释放 objectURL', async () => {
        const objUrl = 'blob:semi-upload-test-url-2';
        createObjectURL.mockImplementation(() => objUrl);
        const upload = renderUpload();
        await selectFiles([createFile(10, 'remove.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalled();
        await click(query(`button.${prefix}-file-card-close`));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        upload.unmount();

        revokeObjectURL.mockReset();
        renderUpload({ limit: 3 });
        await selectFiles([createFile(10, 'clear.png', 'image/png')]);
        await click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        expect(screen.queryByText('clear.png')).toBeNull();
    });

    it('选择多个文件后 clear 时释放全部 objectURL', async () => {
        createObjectURL.mockImplementation((item) => `blob:multi-${(item as File).name}`);
        revokeObjectURL.mockReset();
        renderUpload({ limit: 3 });
        await selectFiles([createFile(10, 'a.png', 'image/png'), createFile(10, 'b.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalledTimes(2);
        await click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(2));
        expect(revokeObjectURL.mock.calls.map((args) => args[0])).toEqual(expect.arrayContaining(['blob:multi-a.png', 'blob:multi-b.png']));
    });

    it('limit 为 1 时选择新文件替换旧文件，旧文件的 objectURL 被释放', async () => {
        createObjectURL.mockImplementation((item) => `blob:${(item as File).name}`);
        revokeObjectURL.mockReset();
        renderUpload({ limit: 1 });
        await selectFiles([createFile(10, 'a.png', 'image/png')]);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await selectFiles([createFile(10, 'b.png', 'image/png')]);
        expect(getCardNames()).toEqual(['b.png']);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:a.png');
        expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:b.png');
    });
});

describe('Upload insert、replace 与 openFileDialog', () => {
    it('insert 方法按位置插入，缺省位置时追加', async () => {
        const view = renderUpload({ fileList: [] });
        const files = [0, 1, 2].map((i) => new File([new ArrayBuffer(1024)], `chucknorris_${i}.png`, { type: 'image/png' }));
        view.call((handle) => handle.insert([files[0]]));
        view.call((handle) => handle.insert([files[1]], 0));
        view.call((handle) => handle.insert([files[2]], 1));
        expect(getCardNames()).toEqual(['chucknorris_1.png', 'chucknorris_2.png', 'chucknorris_0.png']);
        view.call((handle) => handle.insert([createFile(100, 'inserted.png')]));
        expect(getCardNames()).toEqual(['chucknorris_1.png', 'chucknorris_2.png', 'chucknorris_0.png', 'inserted.png']);
    });

    it('替换文件', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const onChange = fn();
        renderUpload({ fileList: [{ uid: '1', name: 'test.jpg', status: 'success', size: '130KB' }], showReplace: true, onChange });
        await click(replaceButton());
        expect(inputClick.mock.contexts).toEqual([getReplaceInput()]);
        const replaceInputBefore = getReplaceInput();
        await selectFiles([createFile(100, 'replaced.png')], replaceInputBefore);
        expect(getCardNames()).toEqual(['replaced.png']);
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('replaced.png');
        expect(onChange.mock.calls[0][0].fileList.map((item: FileItem) => item.name)).toEqual(['replaced.png']);
        expect(requests).toHaveLength(1);
        // the replace input is remounted, so the same file can be picked again
        expect(getReplaceInput()).not.toBe(replaceInputBefore);
        inputClick.mockRestore();
    });

    it('替换按 uid 定位：列表在选择文件前变化时仍替换原来那一项', async () => {
        const list: FileItem[] = [
            { uid: 'a', name: 'a.png', status: 'success', size: '1KB' },
            { uid: 'b', name: 'b.png', status: 'success', size: '1KB' },
        ];
        const onChange = fn();
        const view = renderUpload({ fileList: list, showReplace: true, onChange });
        await click(document.querySelectorAll(`button.${prefix}-file-card-replace`)[1]);
        view.update({ fileList: [list[1]] });
        await selectFiles([createFile(10, 'new.png', 'image/png')], getReplaceInput());
        expect(onChange.mock.lastCall?.[0].fileList.map((item: FileItem) => item.name)).toEqual(['new.png']);
    });

    it('openFileDialog 方法点击隐藏 input 并发出 openFileDialog', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const onOpenFileDialog = fn();
        const view = renderUpload({ onOpenFileDialog });
        view.call((handle) => handle.openFileDialog());
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
        expect(inputClick).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts[0]).toBe(getInput());
        inputClick.mockRestore();
    });

    it('点击触发器发出 openFileDialog', async () => {
        const onOpenFileDialog = fn();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ onOpenFileDialog });
        await click(screen.getByText('点击上传'));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts).toContain(getInput());
        inputClick.mockRestore();
    });

    it('禁用上传时点击不做任何操作', async () => {
        const onOpenFileDialog = fn();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ disabled: true, onOpenFileDialog });
        await click(query(`.${prefix}-add`));
        expect(inputClick).not.toHaveBeenCalled();
        expect(onOpenFileDialog).not.toHaveBeenCalled();
        inputClick.mockRestore();
    });

    it('disabled 时不渲染重试与替换按钮，卡片的 onRetry 与 onReplace 也不生效', () => {
        const items: FileItem[] = [
            { uid: '1', name: 'bad.png', status: 'uploadFail', size: '1KB', url: 'https://example.com/a.png', fileInstance: createFile(10, 'bad.png') },
            { uid: '2', name: 'ok.png', status: 'success', size: '1KB', url: 'https://example.com/b.png' },
        ];
        renderUpload({ disabled: true, fileList: items, showRetry: true, showReplace: true });
        expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
        expect(screen.queryByRole('button', { name: '替换文件' })).toBeNull();
        expect(requests).toHaveLength(0);
    });
});

describe('Upload 粘贴与拖拽', () => {
    const pasteFile = (name: string) => fireEvent.paste(document.body, { clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, name) }] } });
    const drop = (files: File[]) => fireEvent.drop(query(`.${prefix}-drag-area`), { dataTransfer: { files, effectAllowed: 'none' } });

    it('addOnPasting 属性', async () => {
        const onFileChange = fn();
        const view = renderUpload({ addOnPasting: true, onFileChange });
        const pasted = createFile(100, 'pasted.png');
        const event = createEvent.paste(document.body, { clipboardData: { items: [{ kind: 'file', getAsFile: () => pasted }] } });
        document.body.dispatchEvent(event);
        flushSync();
        expect(event.defaultPrevented).toBe(true);
        expect(onFileChange).toHaveBeenCalledExactlyOnceWith([pasted]);
        expect(getCardNames()).toEqual(['pasted.png']);
        view.unmount();
        await pasteFile('late.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });

    it('挂载后开启 addOnPasting 时可接收粘贴，禁用后忽略', async () => {
        const onFileChange = fn();
        const view = renderUpload({ onFileChange });
        await pasteFile('early.png');
        expect(onFileChange).not.toHaveBeenCalled();
        view.update({ addOnPasting: true });
        await pasteFile('later.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
        view.update({ disabled: true });
        await pasteFile('disabled.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });

    it('粘贴的文件无法读取时 pastingError 接收错误，成功或仅含文本时不发出', async () => {
        const onPastingError = fn();
        const onFileChange = fn();
        renderUpload({ fileList: defaultFileList, addOnPasting: true, onPastingError, onFileChange });
        await fireEvent.paste(document.body, { clipboardData: { items: [{ kind: 'string', getAsFile: () => null }] } });
        await pasteFile('ok.png');
        expect(onPastingError).not.toHaveBeenCalled();
        onFileChange.mockClear();
        const readable = createFile(100, 'ok2.png');
        const failure = new Error('denied');
        await fireEvent.paste(document.body, {
            clipboardData: {
                items: [
                    { kind: 'file', getAsFile: () => null },
                    {
                        kind: 'file',
                        getAsFile: () => {
                            throw failure;
                        },
                    },
                    { kind: 'file', getAsFile: () => readable },
                ],
            },
        });
        expect(onPastingError).toHaveBeenCalledTimes(2);
        expect(onPastingError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(onPastingError).toHaveBeenLastCalledWith(failure);
        expect(onFileChange).toHaveBeenCalledWith([readable]);
    });

    it('draggable 用法', async () => {
        const onSuccess = fn();
        renderUpload({ draggable: true, onSuccess });
        const dropped = createFile(200, 'drag.jpg');
        await drop([dropped]);
        const response = { code: 0, message: 'success' };
        await requests[0].respond(200, JSON.stringify(response));
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][0]).toEqual(response);
        expect(onSuccess.mock.calls[0][1]).toBe(dropped);
    });

    it('禁用上传时拖入不触发上传', async () => {
        const onFileChange = fn();
        renderUpload({ draggable: true, disabled: true, onFileChange });
        await drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        expect(requests).toHaveLength(0);
    });

    it('draggable 与 accept', async () => {
        const onFileChange = fn();
        renderUpload({ draggable: true, accept: 'application/pdf', onFileChange });
        await drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        await drop([createFile(200, 'drag.pdf', 'application/pdf')]);
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(screen.getByText('drag.pdf')).toBeInTheDocument();
    });

    it('draggable 的 drop 事件收到放下的文件与之前的列表，且复位 legal 状态', async () => {
        const onDrop = fn();
        const onFileChange = fn();
        renderUpload({ fileList: defaultFileList, draggable: true, onDrop, onFileChange });
        const dragArea = getDragArea();
        const dropped = createFile(100, 'drop.png');
        await fireEvent.dragEnter(dragArea);
        await fireEvent.drop(dragArea, { dataTransfer: { files: [dropped] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        const [, files, fileList] = onDrop.mock.calls[0];
        expect(files).toEqual([dropped]);
        expect(fileList.map((item: FileItem) => item.name)).toEqual(['vigo.png', 'test.jpeg']);
        expect(onFileChange).toHaveBeenCalledWith([dropped]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'drop.png']);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it.each([false, true])('drop 事件的首参是原生 drop 事件（directory=%s）', async (directory) => {
        const onDrop = fn();
        renderUpload({ draggable: true, directory, onDrop });
        const area = getDragArea();
        const event = createEvent.drop(area, { dataTransfer: { files: [], items: [] } });
        area.dispatchEvent(event);
        await waitFor(() => expect(onDrop).toHaveBeenCalledTimes(1));
        expect(onDrop.mock.calls[0][0]).toBe(event);
    });

    it('拖放空文件时取消默认行为且列表不变', async () => {
        const onDrop = fn();
        const onFileChange = fn();
        renderUpload({ fileList: defaultFileList, draggable: true, onDrop, onFileChange });
        const event = createEvent.drop(getDragArea(), { dataTransfer: { files: [] } });
        getDragArea().dispatchEvent(event);
        flushSync();
        expect(event.defaultPrevented).toBe(true);
        expect(onDrop.mock.calls[0][1]).toEqual([]);
        expect(onFileChange).toHaveBeenCalledWith([]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('dragenter 取消默认行为、显示松手提示，dragover 被取消', () => {
        renderUpload({ draggable: true }, { trigger: 'none' });
        const enter = createEvent.dragEnter(getDragArea());
        getDragArea().dispatchEvent(enter);
        const over = createEvent.dragOver(getDragArea(), { dataTransfer: { files: [] } });
        getDragArea().dispatchEvent(over);
        flushSync();
        expect(enter.defaultPrevented).toBe(true);
        expect(over.defaultPrevented).toBe(true);
        expect(getDragArea()).toHaveClass(`${prefix}-drag-area-legal`);
        expect(screen.getByText('松手开始上传')).toBeInTheDocument();
    });

    it('指针在拖拽区与其内部元素之间移动时保持 legal 状态，离开整个区域后才复位，drop 后重新计数', async () => {
        renderUpload({ draggable: true }, { trigger: 'button' });
        const dragArea = getDragArea();
        const child = screen.getByText('点击上传');
        // the browser fires dragenter on the element entered before dragleave on the one left
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragEnter(child);
        await fireEvent.dragLeave(dragArea);
        expect(dragArea).toHaveClass(`${prefix}-drag-area-legal`);
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragLeave(child);
        expect(dragArea).toHaveClass(`${prefix}-drag-area-legal`);
        await fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);

        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragEnter(child);
        await fireEvent.drop(dragArea, { dataTransfer: { files: [] } });
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it('图片墙添加按钮在 draggable 时响应拖放', async () => {
        const onDrop = fn();
        renderUpload({ fileList: defaultFileList, listType: 'picture', draggable: true, onDrop });
        const add = query(`.${prefix}-picture-add`);
        await fireEvent.dragEnter(add);
        expect(add).toHaveClass(`${prefix}-drag-area-legal`);
        await fireEvent.drop(add, { dataTransfer: { files: [createFile(100, 'dropped.png')] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(getPicCards()).toHaveLength(3);
    });
});

describe('Upload 选择框属性', () => {
    it('directory 输出 webkitdirectory，未开启时不输出', () => {
        const view = renderUpload();
        expect(getInput()).not.toHaveAttribute('webkitdirectory');
        expect(getInput()).not.toHaveAttribute('directory');
        view.unmount();
        renderUpload({ directory: true });
        expect(getInput()).toHaveAttribute('directory', 'directory');
        expect(getInput()).toHaveAttribute('webkitdirectory');
        expect(getReplaceInput()).not.toHaveAttribute('webkitdirectory');
    });

    it.each([
        [false, null],
        [true, ''],
        ['user', 'user'],
    ] as const)('capture 为 %s 时输出 %s', (capture, attr) => {
        renderUpload({ capture });
        expect(getInput().getAttribute('capture')).toBe(attr);
    });

    it('multiple 属性', () => {
        renderUpload({ multiple: true });
        expect(getInput().multiple).toEqual(true);
        expect(getReplaceInput().multiple).toEqual(false);
    });
});
