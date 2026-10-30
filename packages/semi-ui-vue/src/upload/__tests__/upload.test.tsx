/** @jsxImportSource vue */
import { Comment, createSSRApp, h, nextTick, shallowRef, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconUser } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import UploadIndex, { UploadFileCard } from '../index';
import type { AfterUploadProps, AfterUploadResult, BeforeUploadObjectResult, BeforeUploadProps, CustomFile, FileItem, UploadEmits, UploadFileItemSlotProps, UploadHandle, UploadPicCloseSlotProps, UploadProps } from '../interface';
import Upload from '../upload.vue';
import BooleanShorthand from './fixtures/boolean-shorthand.vue';
import CachedUpload from './fixtures/cached-upload.vue';
import HandleHost from './fixtures/handle-host.vue';
import ModelList from './fixtures/model-list.vue';
import ToggleControl from './fixtures/toggle-control.vue';
import { action, createFile, createObjectURL, defaultFileList, fn, getCardNames, getDragArea, getInput, getPicCards, getReplaceInput, installFakeXhr, lastFileList, prefix, PROGRESS_COEFFICIENT, query, renderUpload, revokeObjectURL, selectFiles, type FakeXhr } from './helpers';

type BeforeUpload = NonNullable<UploadProps['beforeUpload']>;

const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
const getCard = (name: string) => screen.getByText(name).closest(`.${prefix}-file-card`) as HTMLElement;
const text = (content: string) => () => content;
const replaceButton = () => query(`button.${prefix}-file-card-replace`);

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
});

function renderHandle(uploadProps: Record<string, unknown> = {}) {
    let handle: UploadHandle | undefined;
    const view = render(HandleHost, {
        props: { uploadProps: uploadProps as never, onReady: (ready: UploadHandle) => (handle = ready) },
    });
    return {
        ...view,
        async call(run: (handle: UploadHandle) => void) {
            run(handle as UploadHandle);
            await nextTick();
        },
    };
}

function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
}

const pasteFile = (name: string) =>
    fireEvent.paste(document.body, {
        clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, name) }] },
    });

/**
 * Opening the native file browser cannot be tested in jsdom; tests only check that the hidden input is clicked.
 */
describe('Upload', () => {
    it('class 与 style', () => {
        const { container } = renderUpload({ class: 'test', style: { color: 'red' }, action: '' });
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

    it('#prompt 与 promptPosition', async () => {
        const prompt = 'Some info for extra text';
        const view = renderUpload({ promptPosition: 'right' }, { prompt: text(prompt) });
        const root = query(`.${prefix}`, view.container);
        expect(query(`.${prefix}-prompt`, view.container)).toHaveTextContent(prompt);
        expect(root).toHaveAttribute('x-prompt-pos', 'right');
        await view.rerender({ promptPosition: 'bottom' });
        expect(root).toHaveAttribute('x-prompt-pos', 'bottom');
        await view.rerender({ promptPosition: 'left' });
        expect(root).toHaveAttribute('x-prompt-pos', 'left');
    });

    it('limit 与 exceed', async () => {
        const onExceed = fn();
        renderUpload({ limit: 2, onExceed });
        await selectFiles([createFile(1024, 'fileA'), createFile(1024, 'fileB'), createFile(1024, 'fileC')]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['fileA', 'fileB']);
    });

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

    it('fileChange', async () => {
        const onFileChange = fn();
        renderUpload({ onFileChange });
        await selectFiles([file]);
        expect(onFileChange).toHaveBeenCalledExactlyOnceWith([file]);
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
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry.mock.calls[0][0].fileInstance).toBeInstanceOf(File);
        expect(requests).toHaveLength(1);
    });

    it('openFileDialog 事件', async () => {
        const onOpenFileDialog = fn();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ onOpenFileDialog });
        await userEvent.click(screen.getByText('点击上传'));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts).toContain(getInput());
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

    it('remove', async () => {
        const onRemove = fn();
        const onChange = fn();
        const fileInstance = createFile(200, 'semi.jpg');
        renderUpload({
            defaultFileList: [{ uid: '2', name: 'test.jpeg', status: 'error', size: '222KB', preview: true, fileInstance }],
            onRemove,
            onChange,
        });
        await userEvent.click(query(`button.${prefix}-file-card-close`));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(lastFileList(onChange)).toEqual([]);
        const [removedFile, fileList, fileItem] = onRemove.mock.calls[0];
        expect(removedFile).toBe(fileInstance);
        expect(fileList).toEqual([]);
        expect(fileItem.uid).toEqual('2');
        await waitFor(() => expect(screen.queryByText('test.jpeg')).toBeNull());
    });

    it('defaultFileList', () => {
        renderUpload({ defaultFileList });
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        expect(items[0]).toHaveTextContent('130KB');
        expect(items[1]).toHaveTextContent('222KB');
        const thumbnails = document.querySelectorAll(`.${prefix}-file-card-preview img`);
        expect(thumbnails).toHaveLength(1);
        expect(thumbnails[0]).toHaveAttribute('src', defaultFileList[0].url);
    });

    it('showUploadList', () => {
        renderUpload({
            showUploadList: false,
            defaultFileList: [{ uid: '2', name: 'test.jpeg', status: 'error', size: '222KB', preview: true }],
        });
        expect(document.querySelector(`.${prefix}-file-list`)).toBeNull();
        expect(screen.queryByText('test.jpeg')).toBeNull();
    });

    it('listType', () => {
        renderUpload({ listType: 'picture' });
        expect(document.querySelector(`.${prefix}.${prefix}-picture`)).not.toBeNull();
    });

    it('#previewFile', async () => {
        const previewFile = vi.fn<(props: UploadFileItemSlotProps) => VNode>(() => <div data-testid="custom-preview">2</div>);
        renderUpload({}, { previewFile });
        await selectFiles([file]);
        await requests[0].respond(200, 'success');
        expect(query(`.${prefix}-file-card-preview`)).toContainElement(screen.getByTestId('custom-preview'));
        expect(previewFile.mock.lastCall?.[0].file).toMatchObject({ name: 'chucknorris.png', status: 'success' });
    });

    it('受控模式下卸载时不释放 objectURL', async () => {
        const objUrl = 'blob:semi-upload-test-url';
        createObjectURL.mockImplementation(() => objUrl);
        render(ModelList);
        await selectFiles([createFile(20, 'toggle.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalled();
        expect(query(`.${prefix}-file-card-preview img`)).toHaveAttribute('src', objUrl);
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(document.querySelector(`.${prefix}-hidden-input`)).toBeNull();
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(getInput()).not.toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(query(`.${prefix}-file-card-preview img`)).toHaveAttribute('src', objUrl);
        expect(revokeObjectURL).not.toHaveBeenCalled();
    });

    it('受控 fileList 变回 undefined 时清空列表（表单重置）', async () => {
        const item: FileItem = {
            uid: '1',
            name: 'semi.png',
            status: 'success',
            size: '1KB',
            url: 'https://example.com/semi.png',
        };
        const view = renderUpload({ defaultFileList: [item], fileList: [item] });
        expect(getCardNames()).toEqual(['semi.png']);
        await view.rerender({ fileList: undefined });
        await nextTick();
        expect(getCardNames()).toEqual([]);
    });

    it('上传事件不改动受控 fileList 的条目', async () => {
        const onChange = fn();
        const onSuccess = fn();
        render(ModelList, { props: { uploadProps: { onChange, onSuccess } as never } });
        await selectFiles([createFile(20, 'a.png')]);
        const added = lastFileList(onChange)[0];
        const snapshot = { ...added };
        await requests[0].uploadProgress({ loaded: 40, total: 100 });
        expect(added).toEqual(snapshot);
        const progressing = onChange.mock.lastCall?.[0];
        expect(progressing.currentFile).toBe(progressing.fileList[0]);
        expect(progressing.currentFile).toMatchObject({ status: 'uploading', percent: 40 * PROGRESS_COEFFICIENT });
        const progressed = { ...progressing.currentFile };
        await requests[0].respond(200, '{"ok":1}');
        expect(added).toEqual(snapshot);
        expect(progressing.currentFile).toEqual(progressed);
        const done = onChange.mock.lastCall?.[0];
        expect(done.currentFile).toBe(done.fileList[0]);
        expect(done.currentFile).toMatchObject({ status: 'success', percent: 100, response: { ok: 1 } });
        expect(onSuccess.mock.lastCall?.[2][0]).toBe(done.currentFile);
    });

    it('上传出错时不改动受控 fileList 的条目', async () => {
        const onChange = fn();
        render(ModelList, { props: { uploadProps: { onChange } as never } });
        await selectFiles([createFile(20, 'a.png')]);
        const added = lastFileList(onChange)[0];
        const snapshot = { ...added };
        await requests[0].respond(500, '');
        expect(added).toEqual(snapshot);
        const failed = onChange.mock.lastCall?.[0];
        expect(failed.currentFile).toBe(failed.fileList[0]);
        expect(failed.currentFile.status).toBe('uploadFail');
    });

    it('remove 与 clear 时释放 objectURL', async () => {
        const objUrl = 'blob:semi-upload-test-url-2';
        createObjectURL.mockImplementation(() => objUrl);
        const upload = renderUpload();
        await selectFiles([createFile(10, 'remove.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalled();
        await userEvent.click(query(`button.${prefix}-file-card-close`));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        upload.unmount();

        revokeObjectURL.mockReset();
        renderUpload({ limit: 3 });
        await selectFiles([createFile(10, 'clear.png', 'image/png')]);
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        expect(screen.queryByText('clear.png')).toBeNull();
    });

    it('选择多个文件后 clear 时释放全部 objectURL', async () => {
        createObjectURL.mockImplementation((item) => `blob:multi-${(item as File).name}`);
        renderUpload({ limit: 3 });
        await selectFiles([createFile(10, 'a.png', 'image/png'), createFile(10, 'b.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalledTimes(2);
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(2));
        expect(revokeObjectURL.mock.calls.map((args) => args[0])).toEqual(expect.arrayContaining(['blob:multi-a.png', 'blob:multi-b.png']));
    });

    it('limit 为 1 时选择新文件替换旧文件，旧文件的 objectURL 被释放', async () => {
        createObjectURL.mockImplementation((item) => `blob:${(item as File).name}`);
        renderUpload({ limit: 1 });
        await selectFiles([createFile(10, 'a.png', 'image/png')]);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await selectFiles([createFile(10, 'b.png', 'image/png')]);
        expect(getCardNames()).toEqual(['b.png']);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:a.png');
        expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:b.png');
    });

    it('图片墙 limit 为 0 时不渲染添加按钮', () => {
        renderUpload({ listType: 'picture', limit: 0 });
        expect(document.querySelector(`.${prefix}-add`)).toBeNull();
    });

    it('不在根元素上输出 aria-required 与 tabIndex', () => {
        const { container } = renderUpload({ 'aria-required': true, tabindex: 0 });
        const root = query(`.${prefix}`, container);
        expect(root).not.toHaveAttribute('aria-required');
        expect(root).not.toHaveAttribute('tabindex');
    });

    it('tabindex 落在添加按钮上，-1 可将其移出 Tab 顺序', () => {
        const { container } = renderUpload({ tabindex: -1 });
        expect(query(`.${prefix}-add`, container)).toHaveAttribute('tabindex', '-1');
    });

    it('onBlur 只在焦点离开整个 Upload 时触发，表单合并出的数组形式也逐个调用', async () => {
        const first = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        const { container } = renderUpload({ onBlur: [first, second] });
        const add = query(`.${prefix}-add`, container);
        await fireEvent.focusOut(add, { relatedTarget: getInput() });
        expect(first).not.toHaveBeenCalled();
        await fireEvent.focusOut(add, { relatedTarget: document.body });
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('afterUpload', async () => {
        const codeStatusMaps: Record<number, AfterUploadResult['status']> = {
            0: 'success',
            1: 'uploadFail',
            2: 'validateFail',
        };
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

    it('uploadTrigger', async () => {
        const onChange = fn();
        const view = renderHandle({ uploadTrigger: 'custom', onChange });
        await selectFiles([createFile(234, 'semi.jpg')]);
        expect(getCardNames()).toEqual(['semi.jpg']);
        expect(lastFileList(onChange)[0].status).toEqual('wait');
        expect(requests).toHaveLength(0);
        await view.call((handle) => handle.upload());
        expect(requests).toHaveLength(1);
    });

    it('uploadTrigger="custom" 时手动上传只上传等待中的文件', async () => {
        const view = renderHandle({ defaultFileList, uploadTrigger: 'custom' });
        await selectFiles([createFile(234, 'semi.jpg')]);
        await view.call((handle) => handle.upload());
        expect(requests).toHaveLength(1);
    });

    it('limit 与 listType="picture" 时自动隐藏上传触发器', () => {
        renderUpload({ limit: 2, listType: 'picture', defaultFileList });
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-add`)).toBeNull();
    });

    it('默认插槽中的控件为唯一按钮：添加区域不设置 role，点击仍可打开', async () => {
        const onOpenFileDialog = fn();
        const { container } = renderUpload({ onOpenFileDialog });
        await nextTick();
        const area = query(`.${prefix}-add`, container);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        expect(screen.getAllByRole('button')).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: '点击上传' }));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('内容中无控件时，添加区域即为按钮，Enter 或 Space 可打开对话框', async () => {
        const onOpenFileDialog = fn();
        renderUpload({ onOpenFileDialog }, { default: () => <span>上传文件</span> });
        screen.getByRole('button', { name: '上传文件' }).focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onOpenFileDialog).toHaveBeenCalledTimes(2);
    });

    it('图片墙添加按钮位于图片列表旁，列表仅包含图片', async () => {
        const onOpenFileDialog = fn();
        renderUpload({ listType: 'picture', defaultFileList, onOpenFileDialog }, { default: text('+') });
        const list = screen.getByRole('list', { name: zh_CN.Upload.pictureList });
        const add = screen.getByRole('button', { name: '+' });
        expect(list).not.toContainElement(add);
        expect(list.children).toHaveLength(defaultFileList.length);
        add.focus();
        await userEvent.keyboard('{Enter}');
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('无文本内容的添加区域由语言包提供名称', async () => {
        renderUpload({ listType: 'picture' }, { default: () => <IconUser /> });
        await nextTick();
        expect(screen.getByRole('button', { name: '上传文件' })).toBeInTheDocument();
    });

    it('有文本的添加区域以该文本作为名称', () => {
        renderUpload({ listType: 'picture' }, { default: () => <span>添加图片</span> });
        expect(screen.getByRole('button', { name: '添加图片' })).toBeInTheDocument();
    });

    it('清除按钮是原生 button，响应 Enter 与 Space', async () => {
        const onClear = fn();
        const view = renderUpload({ defaultFileList, onClear });
        const clearButton = screen.getByRole('button', { name: '清空' });
        expect(clearButton.tagName).toBe('BUTTON');
        clearButton.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
        view.unmount();
        renderUpload({ defaultFileList, onClear });
        screen.getByRole('button', { name: '清空' }).focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(2));
    });

    it('showClear', () => {
        const { container } = renderUpload({ defaultFileList, showClear: false });
        expect(container.querySelector(`.${prefix}-file-list-title-clear`)).toBeNull();
        const { container: container2 } = renderUpload({ defaultFileList });
        expect(container2.querySelector(`.${prefix}-file-list-title-clear`)).toHaveTextContent('清空');
    });

    it('showRetry', () => {
        renderUpload({ defaultFileList, showRetry: false });
        expect(screen.getByText('上传失败')).toBeInTheDocument();
        expect(document.querySelector(`.${prefix}-file-card-info-retry`)).toBeNull();
    });

    it('#validateMessage', () => {
        renderUpload({ defaultFileList }, { validateMessage: text('test') });
        expect(query(`.${prefix}-validate-message`)).toHaveTextContent(/^test$/);
    });

    it('#validateMessage 与 #prompt 渲染为空时不输出容器', () => {
        renderUpload({ defaultFileList }, { validateMessage: () => [], prompt: () => [h(Comment)] });
        expect(document.querySelector(`.${prefix}-validate-message`)).toBeNull();
        expect(document.querySelector(`.${prefix}-prompt`)).toBeNull();
    });

    it('#fileItem', () => {
        renderUpload({ defaultFileList }, { fileItem: ({ file }: UploadFileItemSlotProps) => <div class="customRender">{file.name}</div> });
        const items = document.querySelectorAll('.customRender');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent(defaultFileList[0].name);
        expect(items[1]).toHaveTextContent(defaultFileList[1].name);
        expect(document.querySelector(`.${prefix}-file-card`)).toBeNull();
    });

    it('limit=1 时替换文件', async () => {
        const onChange = fn();
        renderUpload({ limit: 1, defaultFileList, onChange });
        await selectFiles([createFile(100, 'a.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['a.png']);
        expect(getCardNames()).toEqual(['a.png']);
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

    it('替换文件时的 acceptInvalid', async () => {
        const onAcceptInvalid = fn();
        renderUpload({
            defaultFileList: [defaultFileList[0]],
            showReplace: true,
            accept: 'image/png',
            onAcceptInvalid,
        });
        await userEvent.click(replaceButton());
        await selectFiles([createFile(100, 'a.jpg', 'image/jpg')], getReplaceInput());
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(onAcceptInvalid.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.jpg']);
        expect(getCardNames()).toEqual(['vigo.png']);
    });

    it('beforeRemove 的副作用', async () => {
        const fileList = [defaultFileList[0]];
        const onChange = fn();
        const onRemove = fn();
        const onChangePass = fn();
        const onRemovePass = fn();
        const { container } = renderUpload({ fileList, beforeRemove: () => false, onChange, onRemove });
        const { container: containerPass } = renderUpload({
            fileList,
            beforeRemove: () => true,
            onChange: onChangePass,
            onRemove: onRemovePass,
        });
        await userEvent.click(query(`.${prefix}-file-card-close`, container));
        await userEvent.click(query(`.${prefix}-file-card-close`, containerPass));
        await waitFor(() => expect(onRemovePass).toHaveBeenCalledTimes(1));
        expect(onRemovePass.mock.calls[0][2].uid).toEqual('1');
        expect(onChangePass).toHaveBeenCalledTimes(1);
        expect(onChangePass.mock.calls[0][0].fileList).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onRemove).not.toHaveBeenCalled();
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
        const { container: containerPass } = renderUpload({
            fileList,
            beforeClear: () => Promise.resolve(true),
            onChange: onChangePass,
            onClear: onClearPass,
        });
        const { container: containerReject } = renderUpload({
            fileList,
            beforeClear: beforeClearReject,
            onChange: onChangeReject,
            onClear: onClearReject,
        });
        const clearSelector = `.${prefix}-file-list-title-clear`;
        await userEvent.click(query(clearSelector, container));
        await userEvent.click(query(clearSelector, containerPass));
        await userEvent.click(query(clearSelector, containerReject));
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

    it('insert 方法按位置插入', async () => {
        const view = renderHandle({ defaultFileList: [] });
        const files = [0, 1, 2].map((i) => new File([new ArrayBuffer(1024)], `chucknorris_${i}.png`, { type: 'image/png' }));
        await view.call((handle) => handle.insert([files[0]]));
        await view.call((handle) => handle.insert([files[1]], 0));
        await view.call((handle) => handle.insert([files[2]], 1));
        expect(getCardNames()).toEqual(['chucknorris_1.png', 'chucknorris_2.png', 'chucknorris_0.png']);
    });

    it('disabled 属性', async () => {
        renderUpload({ disabled: true }, { default: () => <span>上传</span> });
        await nextTick();
        expect(document.querySelector(`.${prefix}-disabled`)).not.toBeNull();
        expect(screen.getByRole('button', { name: '上传' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('directory 属性', () => {
        renderUpload({ directory: true });
        expect(getInput()).toHaveAttribute('directory', 'directory');
        expect(getInput()).toHaveAttribute('webkitdirectory', 'webkitdirectory');
        expect(getReplaceInput()).not.toHaveAttribute('webkitdirectory');
    });

    it('fileList 受控模式', async () => {
        const onChange = fn();
        renderUpload({ fileList: defaultFileList, onChange });
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        await selectFiles([createFile(100, 'new.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg', 'new.png']);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('capture 属性', () => {
        renderUpload({ capture: 'user' });
        expect(getInput()).toHaveAttribute('capture', 'user');
    });

    it('fileName 属性', async () => {
        renderUpload({ fileName: 'customFileName' });
        await selectFiles([createFile(100, 'test.jpg')]);
        expect(Array.from(requests[0].requestBody)[0][0]).toEqual('customFileName');
    });

    it('multiple 属性', () => {
        renderUpload({ multiple: true });
        expect(getInput().multiple).toEqual(true);
    });

    it('previewClick 事件', async () => {
        const onPreviewClick = fn();
        renderUpload({ defaultFileList, onPreviewClick });
        expect(getCard('vigo.png')).toHaveClass(`${prefix}-file-card-show-pointer`);
        await userEvent.click(getCard('vigo.png'));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1', name: 'vigo.png' });
    });

    it('#previewFile 替换缩略图', () => {
        renderUpload({ defaultFileList: [defaultFileList[0]] }, { previewFile: text('data:image/png;base64,...') });
        const preview = query(`.${prefix}-file-card-preview`);
        expect(preview).toHaveTextContent('data:image/png;base64,...');
        expect(preview).toHaveClass(`${prefix}-file-card-preview-placeholder`);
        expect(preview.querySelector('img')).toBeNull();
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

    it('#thumbnail', () => {
        renderUpload(
            { listType: 'picture', defaultFileList },
            {
                thumbnail: ({ file }: UploadFileItemSlotProps) => <img class="custom-thumbnail" alt={file.name} src={file.url} />,
            }
        );
        const thumbnails = document.querySelectorAll<HTMLImageElement>('img.custom-thumbnail');
        expect(Array.from(thumbnails).map((img) => img.alt)).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelectorAll(`.${prefix}-picture-file-card img`)).toHaveLength(2);
    });

    it('showReplace 属性', () => {
        renderUpload({ defaultFileList: [defaultFileList[0]], showReplace: true });
        expect(document.querySelector(`button.${prefix}-file-card-replace`)).not.toBeNull();
    });

    it('itemStyle 属性', () => {
        renderUpload({ defaultFileList, itemStyle: { backgroundColor: 'red' } });
        const cards = screen.getAllByRole('listitem');
        expect(cards).toHaveLength(2);
        cards.forEach((card) => expect(card).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' }));
    });

    it('picture 模式只传 itemStyle 宽高时卡片保留该宽高', () => {
        renderUpload({ listType: 'picture', defaultFileList, itemStyle: { width: '120px', height: '90px' } });
        getPicCards().forEach((card) => expect(card).toHaveStyle({ width: '120px', height: '90px' }));
    });

    it('picHeight 与 picWidth 属性', () => {
        renderUpload({ listType: 'picture', defaultFileList, picHeight: 100, picWidth: 100 });
        getPicCards().forEach((card) => expect(card).toHaveStyle({ width: '100px', height: '100px' }));
        expect(screen.getByAltText('vigo.png')).toHaveStyle({ width: '100px', height: '100px' });
        expect(query(`.${prefix}-picture-add`)).toHaveStyle({ width: '100px', height: '100px' });
    });

    it('openFileDialog 方法', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const view = renderHandle();
        await view.call((handle) => handle.openFileDialog());
        expect(inputClick).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts[0]).toBe(getInput());
    });

    it('listType picture', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList: [{ ...defaultFileList[0], url: 'https://example.com/image.jpg' }],
        });
        expect(document.querySelector(`.${prefix}-picture-file-list`)).not.toBeNull();
        expect(getPicCards()).toHaveLength(1);
        expect(screen.getByAltText('vigo.png')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('#picPreviewIcon', () => {
        renderUpload({ listType: 'picture', defaultFileList }, { picPreviewIcon: () => <span class="custom-preview-icon">Preview</span> });
        const icons = document.querySelectorAll<HTMLElement>(`.${prefix}-picture-file-card-preview .custom-preview-icon`);
        expect(icons).toHaveLength(1);
        expect(screen.getByAltText('vigo.png').closest(`.${prefix}-picture-file-card`)).toContainElement(icons[0]);
    });

    it('#picInfo', () => {
        renderUpload({ listType: 'picture', defaultFileList, showPicInfo: true }, { picInfo: ({ file }: UploadFileItemSlotProps) => <span class="custom-pic-info">{file.name}</span> });
        const infos = document.querySelectorAll('.custom-pic-info');
        expect(Array.from(infos).map((node) => node.textContent)).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelector(`.${prefix}-picture-file-card-pic-info`)).toBeNull();
    });

    it('promptPosition 为 right', () => {
        renderUpload({ promptPosition: 'right' }, { prompt: () => <span>Upload hint</span> });
        expect(query(`.${prefix}`)).toHaveAttribute('x-prompt-pos', 'right');
        expect(query(`.${prefix}-prompt`)).toHaveTextContent('Upload hint');
    });

    it('validateStatus 为 error', () => {
        renderUpload({ defaultFileList, validateStatus: 'error' }, { validateMessage: text('Error message') });
        expect(query(`.${prefix}-validate-message`)).toHaveTextContent(/^Error message$/);
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-error`);
    });

    it('file card 中的 showReplace 属性', async () => {
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'success', size: '130KB' }],
            showReplace: true,
        });
        await userEvent.hover(replaceButton());
        expect(await screen.findByText('替换文件')).toBeInTheDocument();
    });

    it('dragover 事件被取消', () => {
        renderUpload({ draggable: true });
        const event = createEvent.dragOver(getDragArea(), { dataTransfer: { files: [] } });
        getDragArea().dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it('禁用上传时点击不做任何操作', async () => {
        const onOpenFileDialog = fn();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ disabled: true, onOpenFileDialog });
        await userEvent.click(query(`.${prefix}-add`));
        expect(inputClick).not.toHaveBeenCalled();
        expect(onOpenFileDialog).not.toHaveBeenCalled();
    });

    it('替换文件', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const onChange = fn();
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'success', size: '130KB' }],
            showReplace: true,
            onChange,
        });
        await userEvent.click(replaceButton());
        expect(inputClick.mock.contexts).toEqual([getReplaceInput()]);
        await selectFiles([createFile(100, 'replaced.png')], getReplaceInput());
        expect(getCardNames()).toEqual(['replaced.png']);
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('replaced.png');
        expect(onChange.mock.calls[0][0].fileList.map((item: FileItem) => item.name)).toEqual(['replaced.png']);
        expect(requests).toHaveLength(1);
    });

    it('替换按 uid 定位：列表在选择文件前变化时仍替换原来那一项', async () => {
        const list: FileItem[] = [
            { uid: 'a', name: 'a.png', status: 'success', size: '1KB' },
            { uid: 'b', name: 'b.png', status: 'success', size: '1KB' },
        ];
        const onChange = fn();
        const view = renderUpload({ fileList: list, showReplace: true, onChange });
        await userEvent.click(document.querySelectorAll(`button.${prefix}-file-card-replace`)[1]);
        await view.rerender({ fileList: [list[1]] });
        await selectFiles([createFile(10, 'new.png', 'image/png')], getReplaceInput());
        expect(onChange.mock.lastCall?.[0].fileList.map((item: FileItem) => item.name)).toEqual(['new.png']);
    });

    it('清空列表', async () => {
        const onClear = fn();
        renderUpload({ defaultFileList, onClear });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(document.querySelector(`.${prefix}-file-card`)).toBeNull());
    });

    it('insert 方法缺省位置时追加', async () => {
        const view = renderHandle({ defaultFileList });
        await view.call((handle) => handle.insert([createFile(100, 'inserted.png')]));
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'inserted.png']);
    });

    it.each(['unknown', 'none'])('listType 为 %s 时不渲染文件列表', (listType) => {
        renderUpload({ listType, defaultFileList });
        expect(document.querySelector(`.${prefix}-file-list`)).toBeNull();
        expect(screen.queryByText('vigo.png')).toBeNull();
        expect(document.querySelector(`.${prefix}-add`)).not.toBeNull();
    });

    it('_sizeInvalid 的文件显示 illegalSize 提示', () => {
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'validateFail', size: '130KB', _sizeInvalid: true }],
        });
        expect(getCard('test.jpg')).toHaveTextContent('文件尺寸不合法');
    });

    it('uploadFail 状态且无 validateMessage 的文件', () => {
        renderUpload({ defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'uploadFail', size: '130KB' }] });
        expect(getCard('test.jpg')).toHaveTextContent('上传失败');
        expect(getCard('test.jpg')).toHaveClass(`${prefix}-file-card-fail`);
    });

    it('change 事件', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(100, 'changed.png')]);
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('changed.png');
        expect(onChange.mock.calls[0][0].fileList.map((item: FileItem) => item.name)).toEqual(['changed.png']);
    });

    it('图片墙只在列表里渲染添加按钮', () => {
        renderUpload({ listType: 'picture', defaultFileList });
        const addTriggers = document.querySelectorAll<HTMLElement>(`.${prefix}-add`);
        expect(addTriggers).toHaveLength(1);
        expect(addTriggers[0]).toHaveClass(`${prefix}-picture-add`);
        expect(query(`.${prefix}-file-list-main`)).toContainElement(addTriggers[0]);
    });

    it('showPicInfo 属性', () => {
        renderUpload({ listType: 'picture', defaultFileList, showPicInfo: true });
        const infos = document.querySelectorAll(`.${prefix}-picture-file-card-pic-info`);
        expect(Array.from(infos).map((node) => node.textContent)).toEqual(['1', '2']);
    });

    it('#picClose', () => {
        renderUpload({ listType: 'picture', defaultFileList }, { picClose: () => <span class="custom-close">X</span> });
        expect(document.querySelectorAll('.custom-close')).toHaveLength(2);
        expect(document.querySelector(`button.${prefix}-picture-file-card-close`)).toBeNull();
    });

    it('#fileOperation', () => {
        renderUpload({ defaultFileList }, { fileOperation: () => <span class="custom-operation">Op</span> });
        expect(document.querySelectorAll('.custom-operation')).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-file-card-close`)).toBeNull();
    });

    it('showTooltip 属性', () => {
        renderUpload({ defaultFileList, showTooltip: true });
        // the tooltip only appears once a name is truncated, which jsdom cannot measure
        document.querySelectorAll(`.${prefix}-file-card-info-name`).forEach((name) => expect(name).toHaveClass('semi-typography-ellipsis-single-line'));
    });

    it('draggable 的 drop 事件', async () => {
        const onDrop = fn();
        const onFileChange = fn();
        renderUpload({ draggable: true, onDrop, onFileChange });
        const dragArea = getDragArea();
        const dropped = createFile(100, 'drop.png');
        await fireEvent.dragEnter(dragArea);
        await fireEvent.drop(dragArea, { dataTransfer: { files: [dropped] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onFileChange).toHaveBeenCalledWith([dropped]);
        expect(getCardNames()).toEqual(['drop.png']);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it('draggable 的 dragleave 事件', async () => {
        renderUpload({ draggable: true });
        const dragArea = getDragArea();
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it('draggable 的指针在拖拽区与其内部元素之间移动时保持 legal 状态，离开整个区域后才复位', async () => {
        renderUpload({ draggable: true });
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
    });

    it('draggable 的 drop 后重新计数，下一次拖入再离开时复位', async () => {
        renderUpload({ draggable: true });
        const dragArea = getDragArea();
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragEnter(screen.getByText('点击上传'));
        await fireEvent.drop(dragArea, { dataTransfer: { files: [] } });
        await fireEvent.dragEnter(dragArea);
        await fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it('draggable 的 dragenter 事件', async () => {
        renderUpload({ draggable: true }, {});
        const event = createEvent.dragEnter(getDragArea());
        getDragArea().dispatchEvent(event);
        await nextTick();
        expect(event.defaultPrevented).toBe(true);
        expect(getDragArea()).toHaveClass(`${prefix}-drag-area-legal`);
        expect(screen.getByText('松手开始上传')).toBeInTheDocument();
    });

    it('listType picture 与 showRetry', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'uploadFail',
                    size: '130KB',
                    url: 'https://example.com/image.jpg',
                },
            ],
            showRetry: true,
        });
        const card = getPicCards()[0];
        expect(card).toHaveClass(`${prefix}-picture-file-card-error`);
        expect(card.querySelector(`.${prefix}-picture-file-card-retry`)).not.toBeNull();
    });

    it('listType picture 与 showReplace', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'success', size: '130KB', url: 'https://example.com/image.jpg' }],
            showReplace: true,
        });
        const card = getPicCards()[0];
        expect(card.querySelector(`.${prefix}-picture-file-card-replace`)).not.toBeNull();
        expect(card.querySelector(`.${prefix}-picture-file-card-preview`)).toBeNull();
    });

    it('validateFail 状态的文件', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'validateFail',
                    size: '130KB',
                    validateMessage: 'File validation failed',
                },
            ],
        });
        const card = getCard('test.jpg');
        expect(card).toHaveClass(`${prefix}-file-card-fail`);
        expect(card).toHaveTextContent('File validation failed');
        expect(card.querySelector(`.${prefix}-file-card-icon-error`)).not.toBeNull();
        expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
    });

    it('validating 状态的文件', () => {
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'validating', size: '130KB', validateMessage: 'Validating...' }],
        });
        const card = getCard('test.jpg');
        expect(card).toHaveTextContent('Validating...');
        expect(card.querySelector(`.${prefix}-file-card-icon-loading`)).not.toBeNull();
        expect(card.querySelector(`.${prefix}-file-card-icon-error`)).toBeNull();
        expect(card).not.toHaveClass(`${prefix}-file-card-fail`);
    });

    it('uploading 状态的文件显示进度', () => {
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'uploading', size: '130KB', percent: 50 }],
        });
        expect(screen.getByRole('progressbar', { name: zh_CN.Upload.uploadProgress })).toHaveAttribute('aria-valuenow', '50');
    });

    it.each(['end', 'start'] as const)('hotSpotLocation 为 %s', (hotSpotLocation) => {
        renderUpload({ listType: 'picture', defaultFileList, hotSpotLocation });
        const main = query(`.${prefix}-file-list-main`);
        const [add, list] = hotSpotLocation === 'end' ? [main.lastElementChild, main.firstElementChild] : [main.firstElementChild, main.lastElementChild];
        expect(add).toHaveClass(`${prefix}-add`);
        expect(list).toBe(screen.getByRole('list'));
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('limit 为 1 时 showClear 不显示标题', () => {
        renderUpload({
            defaultFileList: [{ uid: '1', name: 'test.jpg', status: 'success', size: '130KB' }],
            showClear: true,
            limit: 1,
        });
        expect(document.querySelector(`.${prefix}-file-list-title`)).toBeNull();
        expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
        expect(getCardNames()).toEqual(['test.jpg']);
    });

    it('多文件时 showClear 显示标题', () => {
        renderUpload({ defaultFileList, showClear: true, limit: 10 });
        expect(query(`.${prefix}-file-list-title`)).toHaveTextContent('已选择文件');
        expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
    });

    it('带 preview 属性的文件', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/image.jpg',
                },
            ],
        });
        const preview = query(`.${prefix}-file-card-preview`);
        expect(preview).not.toHaveClass(`${prefix}-file-card-preview-placeholder`);
        expect(preview.querySelector('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('带 previewClick 监听的文件', async () => {
        const onPreviewClick = fn();
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/image.jpg',
                },
            ],
            onPreviewClick,
        });
        await userEvent.click(query(`.${prefix}-file-card-preview img`));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1' });
    });

    it('draggable 自定义默认插槽', () => {
        renderUpload({ draggable: true }, { default: () => <div class="custom-drag-content">Drop files here</div> });
        const dragArea = getDragArea();
        expect(dragArea).toHaveClass(`${prefix}-drag-area-custom`);
        expect(query('.custom-drag-content', dragArea)).toHaveTextContent('Drop files here');
        expect(screen.queryByText('点击上传文件或拖拽文件到这里')).toBeNull();
    });

    it('addOnPasting 属性', async () => {
        const onFileChange = fn();
        const view = renderUpload({ addOnPasting: true, onFileChange });
        const pasted = createFile(100, 'pasted.png');
        const event = createEvent.paste(document.body, {
            clipboardData: { items: [{ kind: 'file', getAsFile: () => pasted }] },
        });
        document.body.dispatchEvent(event);
        await nextTick();
        expect(event.defaultPrevented).toBe(true);
        expect(onFileChange).toHaveBeenCalledExactlyOnceWith([pasted]);
        expect(getCardNames()).toEqual(['pasted.png']);
        view.unmount();
        await pasteFile('late.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });
});

describe('Upload 补充覆盖', () => {
    // Clipboard reads go through navigator.clipboard / navigator.permissions, which jsdom does not provide
    const stubClipboard = (query: Permissions['query']) => {
        const read = vi.fn<Clipboard['read']>(() => Promise.resolve([]));
        vi.stubGlobal('navigator', Object.create(navigator, { clipboard: { value: { read } }, permissions: { value: { query } } }));
        return { read };
    };

    it('beforeClear 默认返回 true', async () => {
        const onChange = fn();
        renderUpload({ defaultFileList, onChange });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith({ fileList: [] }));
        await waitFor(() => expect(document.querySelector(`.${prefix}-file-card`)).toBeNull());
    });

    it('替换后替换选择框重挂，可再选同一文件', async () => {
        renderUpload({ defaultFileList, showReplace: true });
        const replaceInputBefore = getReplaceInput();
        await userEvent.click(replaceButton());
        await selectFiles([createFile(100, 'replaced.png')], replaceInputBefore);
        expect(getReplaceInput()).not.toBe(replaceInputBefore);
        expect(getCardNames()).toEqual(['replaced.png', 'test.jpeg']);
    });

    it('仅按下 Ctrl/Cmd+V 时不读取异步剪贴板', async () => {
        const { read } = stubClipboard(() => Promise.resolve({ state: 'granted' } as PermissionStatus));
        const onFileChange = fn();
        renderUpload({ defaultFileList, addOnPasting: true, onFileChange });
        await fireEvent.keyDown(document.body, { code: 'KeyV', ctrlKey: true });
        await fireEvent.keyDown(document.body, { code: 'KeyV', metaKey: true });
        await Promise.resolve();
        expect(read).not.toHaveBeenCalled();
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('粘贴的文件无法读取时 pastingError 接收错误', async () => {
        const onPastingError = fn();
        const onFileChange = fn();
        renderUpload({ defaultFileList, addOnPasting: true, onPastingError, onFileChange });
        const readable = createFile(100, 'ok.png');
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
        expectTypeOf<UploadEmits['pastingError'][0]>().toEqualTypeOf<Error>();
        expect(onFileChange).toHaveBeenCalledWith([readable]);
    });

    it('粘贴成功或仅含文本时不发出 pastingError', async () => {
        const onPastingError = fn();
        renderUpload({ defaultFileList, addOnPasting: true, onPastingError });
        await fireEvent.paste(document.body, { clipboardData: { items: [{ kind: 'string', getAsFile: () => null }] } });
        await pasteFile('ok.png');
        expect(onPastingError).not.toHaveBeenCalled();
    });

    it('拖放时 drop 事件收到放下的文件与之前的列表', async () => {
        const onDrop = fn();
        renderUpload({ defaultFileList, draggable: true, onDrop });
        const dropped = createFile(100, 'dropped.png');
        await fireEvent.drop(getDragArea(), { dataTransfer: { files: [dropped] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        const [, files, fileList] = onDrop.mock.calls[0];
        expect(files).toEqual([dropped]);
        expect(fileList.map((item: FileItem) => item.name)).toEqual(['vigo.png', 'test.jpeg']);
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

    it('drop 事件的首参类型是原生 DragEvent', () => {
        expectTypeOf<UploadEmits['drop'][0]>().toEqualTypeOf<DragEvent>();
    });

    it('未监听 previewClick 时卡片不显示可点击', () => {
        renderUpload({ defaultFileList, listType: 'picture' });
        expect(getPicCards()).toHaveLength(2);
        getPicCards().forEach((card) => expect(card).not.toHaveClass(`${prefix}-picture-file-card-show-pointer`));
    });

    it('图片墙添加按钮在 draggable 时响应拖放', async () => {
        const onDrop = fn();
        renderUpload({ defaultFileList, listType: 'picture', draggable: true, onDrop });
        const add = query(`.${prefix}-picture-add`);
        await fireEvent.dragEnter(add);
        expect(add).toHaveClass(`${prefix}-drag-area-legal`);
        await fireEvent.drop(add, { dataTransfer: { files: [createFile(100, 'dropped.png')] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(getPicCards()).toHaveLength(3);
    });

    it('拖放空文件时取消默认行为且列表不变', async () => {
        const onDrop = fn();
        const onFileChange = fn();
        renderUpload({ defaultFileList, draggable: true, onDrop, onFileChange });
        const event = createEvent.drop(getDragArea(), { dataTransfer: { files: [] } });
        getDragArea().dispatchEvent(event);
        await nextTick();
        expect(event.defaultPrevented).toBe(true);
        expect(onDrop.mock.calls[0][1]).toEqual([]);
        expect(onFileChange).toHaveBeenCalledWith([]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('accept 拒绝的文件发出 acceptInvalid，其余照常加入', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ defaultFileList, accept: '.png', onAcceptInvalid });
        const pdf = createFile(100, 'doc.pdf', 'application/pdf');
        await selectFiles([pdf, createFile(100, 'ok.png')]);
        expect(onAcceptInvalid).toHaveBeenCalledWith([pdf]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'ok.png']);
    });

    it('beforeRemove 收到文件项与当前列表', async () => {
        const beforeRemove = vi.fn<(fileItem: FileItem, fileList: FileItem[]) => boolean>(() => true);
        renderUpload({ defaultFileList, beforeRemove });
        await userEvent.click(query(`.${prefix}-file-card-close`, getCard('vigo.png')));
        expect(beforeRemove).toHaveBeenCalledTimes(1);
        const [fileItem, fileList] = beforeRemove.mock.calls[0];
        expect(fileItem).toMatchObject({ uid: '1' });
        expect(fileList.map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(getCardNames()).toEqual(['test.jpeg']));
    });

    it('beforeClear 收到当前列表', async () => {
        const beforeClear = vi.fn<(fileList: FileItem[]) => boolean>(() => true);
        renderUpload({ defaultFileList, beforeClear });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        expect(beforeClear).toHaveBeenCalledTimes(1);
        expect(beforeClear.mock.calls[0][0].map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(document.querySelector(`.${prefix}-file-card`)).toBeNull());
    });

    it('openFileDialog 方法点击隐藏 input 并发出 openFileDialog', async () => {
        const onOpenFileDialog = fn();
        const view = renderHandle({ defaultFileList, onOpenFileDialog });
        await view.call((handle) => handle.openFileDialog());
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('#fileItem 参数的 onReplace 打开替换选择框', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload(
            { defaultFileList, showReplace: true },
            {
                fileItem: ({ file, onReplace }: UploadFileItemSlotProps) => <button type="button" onClick={onReplace}>{`replace ${file.name}`}</button>,
            }
        );
        await userEvent.click(screen.getByRole('button', { name: 'replace vigo.png' }));
        expect(inputClick.mock.contexts).toEqual([getReplaceInput()]);
    });

    it('#fileItem 参数的 onPreviewClick 发出 previewClick', async () => {
        const onPreviewClick = fn();
        renderUpload(
            { defaultFileList, listType: 'picture', onPreviewClick },
            {
                fileItem: ({ file, onPreviewClick: preview }: UploadFileItemSlotProps) => <button type="button" onClick={preview}>{`preview ${file.name}`}</button>,
            }
        );
        await userEvent.click(screen.getByRole('button', { name: 'preview vigo.png' }));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1', name: 'vigo.png' });
    });

    it('图片墙列表为空且隐藏列表时只渲染添加按钮', () => {
        renderUpload({ fileList: [], listType: 'picture', showUploadList: false });
        expect(document.querySelector(`.${prefix}-picture-file-list`)).toBeNull();
        expect(document.querySelector(`.${prefix}-picture-add`)).not.toBeNull();
    });

    it('图片墙隐藏列表且已达 limit 时列表与添加按钮都不渲染', () => {
        renderUpload({ defaultFileList: [defaultFileList[0]], listType: 'picture', showUploadList: false, limit: 1 });
        expect(document.querySelector(`.${prefix}-picture-file-list`)).toBeNull();
        expect(document.querySelector(`.${prefix}-add`)).toBeNull();
        expect(getPicCards()).toHaveLength(0);
    });
});

describe('Upload 生命周期与属性', () => {
    it('将 data-* 属性透传到根元素', () => {
        const { container } = renderUpload({ 'data-testid': 'upload-root' });
        expect(container.firstElementChild).toHaveClass(prefix);
        expect(container.firstElementChild).toHaveAttribute('data-testid', 'upload-root');
    });

    it('读取全局默认值，实例值优先', () => {
        const view = render(Upload, {
            props: { action, defaultFileList } as never,
            global: globalWith({ Upload: { showClear: false } }),
        });
        expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
        view.unmount();
        render(Upload, {
            props: { action, defaultFileList, showClear: true } as never,
            global: globalWith({ Upload: { showClear: false } }),
        });
        expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
    });

    it('父组件不更新的受控 fileList 始终作为每次选择的基础', async () => {
        const onChange = fn();
        renderUpload({ fileList: defaultFileList, onChange, uploadTrigger: 'custom' });
        await selectFiles([createFile(100, 'first.png')]);
        await selectFiles([createFile(100, 'second.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg', 'second.png']);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('v-model:fileList 跟随整个上传过程', async () => {
        const onChange = fn();
        render(ModelList, { props: { uploadProps: { onChange } as never } });
        await selectFiles([createFile(100, 'a.png')]);
        expect(getCardNames()).toEqual(['a.png']);
        expect(requests).toHaveLength(1);
        await requests[0].uploadProgress({ loaded: 80, total: 100 });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(80 * PROGRESS_COEFFICIENT));
        await requests[0].respond(200, '{"ok":true}');
        expect(lastFileList(onChange)[0]).toMatchObject({ name: 'a.png', status: 'success', response: { ok: true } });
        expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('上传、上报与粘贴各执行一次，卸载后粘贴无效', async () => {
        const onChange = fn();
        const onFileChange = fn();
        const view = renderUpload({ addOnPasting: true, onChange, onFileChange });
        await selectFiles([createFile(100, 'once.png')]);
        expect(requests).toHaveLength(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        await pasteFile('pasted.png');
        expect(onFileChange).toHaveBeenCalledTimes(2);
        expect(requests).toHaveLength(2);
        view.unmount();
        await pasteFile('late.png');
        expect(onFileChange).toHaveBeenCalledTimes(2);
    });

    it('禁用的列表隐藏其文件的删除按钮', () => {
        renderUpload({ defaultFileList, disabled: true });
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelector(`.${prefix}-file-card-close`)).toBeNull();
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
        expect(customRequest.mock.calls[0][0]).toMatchObject({
            fileInstance: selected,
            fileName: 'custom.png',
            action,
        });
        expect(requests).toHaveLength(0);
        await waitFor(() => expect(lastFileList(onChange)[0].status).toEqual('success'));
        expect(lastFileList(onChange)[0].response).toEqual({ url: 'https://example.com/file.jpg' });
    });

    it('重试缺少 File 对象的文件时发出 retry 且不发送请求', async () => {
        const onRetry = fn();
        renderUpload({ defaultFileList, onRetry });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
    });

    it('挂载后开启 addOnPasting 时可接收粘贴', async () => {
        const onFileChange = fn();
        const view = renderUpload({ onFileChange });
        await view.rerender({ addOnPasting: true });
        await pasteFile('later.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });

    it('禁用后忽略粘贴，卸载时移除粘贴监听', async () => {
        const onFileChange = fn();
        const view = renderUpload({ addOnPasting: true, onFileChange });
        await view.rerender({ disabled: true });
        await pasteFile('disabled.png');
        view.unmount();
        await pasteFile('late.png');
        expect(onFileChange).not.toHaveBeenCalled();
    });
});

describe('Upload 审计修复', () => {
    const cloneFile = (f: File) => new File([f], f.name, { type: f.type });

    it('beforeUpload 同步返回的对象缺省 shouldUpload 时照常上传', async () => {
        renderUpload({ beforeUpload: () => ({ validateMessage: 'checked' }) });
        await selectFiles([createFile(10, 'a.png')]);
        expect(requests).toHaveLength(1);
    });

    it('exceed 在选择文件与 insert 两条路径都收到截断前的全部文件', async () => {
        const onExceed = fn();
        const view = renderHandle({ limit: 2, onExceed });
        await selectFiles([createFile(10, 'a'), createFile(10, 'b'), createFile(10, 'c')]);
        expect(onExceed.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a', 'b', 'c']);
        await view.call((handle) => handle.insert([createFile(10, 'd'), createFile(10, 'e')]));
        expect(onExceed.mock.calls[1][0].map((f: File) => f.name)).toEqual(['d', 'e']);
    });

    it('limit 为 1 时选择文件与 insert 都不发出 exceed', async () => {
        const onExceed = fn();
        const view = renderHandle({ limit: 1, onExceed });
        await selectFiles([createFile(10, 'a'), createFile(10, 'b')]);
        await view.call((handle) => handle.insert([createFile(10, 'c'), createFile(10, 'd')]));
        expect(onExceed).not.toHaveBeenCalled();
    });

    it('insert 配合返回新 File 的 transformFile 时文件项有唯一 uid', async () => {
        const onChange = fn();
        const view = renderHandle({ transformFile: cloneFile, onChange });
        await view.call((handle) => handle.insert([createFile(10, 'a.png'), createFile(10, 'b.png')]));
        const uids = lastFileList(onChange).map((item) => item.uid);
        expect(uids.every(Boolean)).toBe(true);
        expect(new Set(uids).size).toBe(2);
    });

    it('insert 的超限文件被标记为校验失败且不上传', async () => {
        const onChange = fn();
        const view = renderHandle({ maxSize: 1, transformFile: cloneFile, onChange });
        await view.call((handle) => handle.insert([createFile(4096, 'big.png')]));
        expect(lastFileList(onChange)[0].status).toBe('validateFail');
        expect(requests).toHaveLength(0);
    });

    it('异步 beforeRemove 期间其他文件的状态变化不被旧快照覆盖', async () => {
        let release: (value: boolean) => void = () => {};
        const onChange = fn();
        renderUpload({ beforeRemove: () => new Promise<boolean>((resolve) => (release = resolve)), onChange });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png')]);
        await userEvent.click(document.querySelectorAll<HTMLElement>(`.${prefix}-file-card-close`)[0]);
        await requests[1].respond(200, '{}');
        release(true);
        await waitFor(() => expect(lastFileList(onChange).map((item) => item.name)).toEqual(['b.png']));
        expect(lastFileList(onChange)[0].status).toBe('success');
    });

    it('beforeRemove 被拒绝时视为取消，不产生未处理的 rejection', async () => {
        const onRemove = fn();
        renderUpload({ beforeRemove: () => Promise.reject(new Error('no')), onRemove });
        await selectFiles([createFile(10, 'a.png')]);
        await userEvent.click(query(`.${prefix}-file-card-close`));
        await nextTick();
        expect(onRemove).not.toHaveBeenCalled();
        expect(getCardNames()).toEqual(['a.png']);
    });

    it('accept 的扩展名接受大写文件名', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', onAcceptInvalid });
        await selectFiles([createFile(10, 'PHOTO.PNG', '')]);
        expect(onAcceptInvalid).not.toHaveBeenCalled();
        expect(requests).toHaveLength(1);
    });

    it('accept 的扩展名不接受仅以相同字母结尾的文件名', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', onAcceptInvalid });
        await selectFiles([createFile(10, 'notpng', '')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
    });

    it('beforeUpload 返回 null 时不抛错', async () => {
        renderUpload({ beforeUpload: () => null });
        await expect(selectFiles([createFile(10, 'a.png')])).resolves.not.toThrow();
    });

    describe('disabled', () => {
        const items: FileItem[] = [
            { uid: '1', name: 'bad.png', status: 'uploadFail', size: '1KB', url: 'https://example.com/a.png' },
            { uid: '2', name: 'ok.png', status: 'success', size: '1KB', url: 'https://example.com/b.png' },
        ];

        it.each(['list', 'picture'])('%s 模式不渲染重试与替换按钮', (listType) => {
            renderUpload({ disabled: true, fileList: items, listType, showRetry: true, showReplace: true });
            expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
            expect(screen.queryByRole('button', { name: '替换文件' })).toBeNull();
        });

        it('#fileItem 参数的 onRetry 与 onReplace 也不生效', async () => {
            let handles: UploadFileItemSlotProps | undefined;
            renderUpload(
                { disabled: true, fileList: [{ ...items[0], fileInstance: createFile(10, 'bad.png') }] },
                {
                    fileItem: (props: UploadFileItemSlotProps) => {
                        handles = props;
                        return <span>custom</span>;
                    },
                }
            );
            const click = vi.spyOn(getReplaceInput(), 'click');
            handles?.onRetry();
            handles?.onReplace();
            await nextTick();
            expect(requests).toHaveLength(0);
            expect(click).not.toHaveBeenCalled();
        });
    });
});

describe('Upload 审计余量', () => {
    const items = (count: number): FileItem[] =>
        Array.from({ length: count }, (_, i) => ({
            uid: `d${i}`,
            name: `d${i}.png`,
            status: 'success',
            size: '1KB',
            url: `https://example.com/d${i}.png`,
        }));

    it('一次选择多个文件只发出一次 change，并带上全部新增项', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [{ fileList, currentFile }] = onChange.mock.calls[0];
        expect(fileList.map((item: FileItem) => item.name)).toEqual(['a.png', 'b.png', 'c.png']);
        expect(currentFile.name).toBe('c.png');
    });

    it.each(['image/svg+xml', 'image/avif'])('%s 文件在列表中显示缩略图', async (type) => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(10, 'a.img', type)]);
        expect(lastFileList(onChange)[0].preview).toBe(true);
    });

    it('所有文件被 accept 拒绝后重置选择框，再选同一文件仍会发出 acceptInvalid', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', onAcceptInvalid });
        const before = getInput();
        await selectFiles([createFile(10, 'a.jpg', 'image/jpeg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getInput()).not.toBe(before);
    });

    it('替换的文件被 accept 拒绝后重置替换选择框', async () => {
        const onAcceptInvalid = fn();
        renderUpload({ accept: '.png', showReplace: true, defaultFileList: items(1), onAcceptInvalid });
        await userEvent.click(replaceButton());
        const before = getReplaceInput();
        await selectFiles([createFile(10, 'a.jpg', 'image/jpeg')], before);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getReplaceInput()).not.toBe(before);
    });

    it('已有文件数超过 limit 时，选择与 insert 都不再追加文件', async () => {
        const onExceed = fn();
        const view = renderHandle({ defaultFileList: items(3), limit: 2, onExceed });
        await selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
        await view.call((handle) => handle.insert([createFile(10, 'e.png'), createFile(10, 'f.png')]));
        expect(onExceed).toHaveBeenCalledTimes(2);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
    });
});

describe('Upload Vue 写法', () => {
    it('单向绑定 :fileList 不回写时列表保持受控值，也不上报父级未接受文件的进度', async () => {
        const onChange = fn();
        const onProgress = fn();
        renderUpload({ fileList: [], onChange, onProgress });
        await selectFiles([createFile(10, 'a.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual([]);
        await requests[0].uploadProgress({ loaded: 40, total: 100 });
        expect(onProgress).not.toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('全局默认值对非函数与函数 prop 都生效，实例值优先', async () => {
        const globalBeforeUpload = vi.fn<BeforeUpload>(() => false);
        const global = globalWith({ Upload: { listType: 'picture', beforeUpload: globalBeforeUpload } });
        const view = render(Upload, { props: { action } as never, global });
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-picture`);
        await selectFiles([createFile(10, 'a.png')]);
        expect(globalBeforeUpload).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
        view.unmount();

        const ownBeforeUpload = vi.fn<BeforeUpload>(() => true);
        render(Upload, { props: { action, listType: 'list', beforeUpload: ownBeforeUpload } as never, global });
        expect(query(`.${prefix}`)).not.toHaveClass(`${prefix}-picture`);
        await selectFiles([createFile(10, 'b.png')]);
        expect(ownBeforeUpload).toHaveBeenCalledTimes(1);
        expect(globalBeforeUpload).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(1);
    });

    it('根元素收到 aria-label 时为 group，未命名时没有 role', () => {
        const { container } = renderUpload({ 'aria-label': '附件' });
        expect(container.firstElementChild).toHaveAttribute('role', 'group');
        expect(screen.getByRole('group', { name: '附件' })).toBe(container.firstElementChild);
        const { container: plain } = renderUpload();
        expect(plain.firstElementChild).not.toHaveAttribute('role');
    });

    it('#dragIcon、#dragMainText 渲染为空时回落默认图标与语言包文案', () => {
        renderUpload({ draggable: true }, { dragIcon: () => [], dragMainText: () => [] });
        expect(query(`.${prefix}-drag-area-icon .semi-icon-upload`)).not.toBeNull();
        expect(query(`.${prefix}-drag-area-main-text`)).toHaveTextContent(zh_CN.Upload.mainText);
    });

    it('#fileListTitle 只替换文字，#fileListHeader 替换整个标题区', async () => {
        const view = renderUpload({ defaultFileList }, { fileListTitle: text('我的文件') });
        expect(query(`.${prefix}-file-list-title-choosen`)).toHaveTextContent('我的文件');
        expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
        view.unmount();

        const onClear = fn();
        renderUpload(
            { defaultFileList, onClear },
            {
                fileListHeader: ({ fileList, onClear: clear, clearText }: { fileList: FileItem[]; onClear: () => void; clearText: string }) => <button type="button" onClick={clear}>{`${fileList.length} ${clearText}`}</button>,
            }
        );
        expect(document.querySelector(`.${prefix}-file-list-title-choosen`)).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: `2 ${zh_CN.Upload.clear}` }));
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
    });

    it('#fileItem 参数可直接交给 Upload.FileCard；渲染为空的文件不显示', async () => {
        const onRemove = fn();
        renderUpload(
            { defaultFileList, onRemove },
            {
                fileItem: (props: UploadFileItemSlotProps) => (props.file.uid === '2' ? [] : <UploadIndex.FileCard {...props} class="via-slot" />),
            }
        );
        expect(getCardNames()).toEqual(['vigo.png']);
        const card = query('.via-slot');
        expect(card).toHaveClass(`${prefix}-file-card`);
        await userEvent.click(query(`.${prefix}-file-card-close`, card));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(onRemove.mock.calls[0][2]).toMatchObject({ uid: '1' });
    });

    it('逐文件插槽收到对应文件与序号', () => {
        const seen: Record<string, [string | undefined, number | undefined][]> = {};
        const record = (name: string) => (props: UploadFileItemSlotProps) => {
            (seen[name] ??= []).push([props.file.url, props.index]);
            return <span>{name}</span>;
        };
        renderUpload({ listType: 'picture', defaultFileList, showPicInfo: true }, { thumbnail: record('thumbnail'), picInfo: record('picInfo'), picPreviewIcon: record('picPreviewIcon') });
        const urls = defaultFileList.map((item, index): [string | undefined, number] => [item.url, index]);
        expect(seen.thumbnail).toEqual(urls);
        expect(seen.picInfo).toEqual(urls);
        expect(seen.picPreviewIcon).toEqual([urls[0]]);
        renderUpload({ defaultFileList }, { fileOperation: record('fileOperation'), previewFile: record('previewFile') });
        expect(seen.fileOperation).toEqual(urls);
        expect(seen.previewFile).toEqual(urls);
    });

    it('#picClose 参数带内置类名，onRemove 不触发卡片预览', async () => {
        const onPreviewClick = fn();
        const onRemove = fn();
        renderUpload(
            { listType: 'picture', defaultFileList: [defaultFileList[0]], onPreviewClick, onRemove },
            {
                picClose: ({ class: cls, onRemove: remove }: UploadPicCloseSlotProps) => (
                    <button type="button" class={cls} onClick={remove}>
                        X
                    </button>
                ),
            }
        );
        const close = screen.getByRole('button', { name: 'X' });
        expect(close).toHaveClass(`${prefix}-picture-file-card-close`);
        await userEvent.click(close);
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(onPreviewClick).not.toHaveBeenCalled();
    });

    it('#fileValidateMessage 替换校验信息，渲染为空时回落字符串', () => {
        const list: FileItem[] = [
            { uid: '1', name: 'a.png', status: 'validateFail', size: '1KB', validateMessage: 'bad a' },
            { uid: '2', name: 'b.png', status: 'validateFail', size: '1KB', validateMessage: 'bad b' },
        ];
        renderUpload(
            { defaultFileList: list },
            {
                fileValidateMessage: ({ file, validateMessage }: UploadFileItemSlotProps) => (file.uid === '1' ? <em class="custom-msg">{`${validateMessage}!`}</em> : []),
            }
        );
        expect(query('.custom-msg', getCard('a.png'))).toHaveTextContent('bad a!');
        expect(getCard('a.png').querySelector(`.${prefix}-file-card-icon-error`)).toBeNull();
        expect(getCard('b.png')).toHaveTextContent('bad b');
        expect(getCard('b.png').querySelector(`.${prefix}-file-card-icon-error`)).not.toBeNull();
    });

    it('图片墙经 #fileValidateMessage 转发：有内容的文件显示错误图标，内容为空的文件不显示', () => {
        const url = defaultFileList[0].url;
        renderUpload(
            {
                listType: 'picture',
                defaultFileList: [
                    { uid: '1', name: 'a.png', status: 'validateFail', size: '1KB', url },
                    { uid: '2', name: 'b.png', status: 'validateFail', size: '1KB', url },
                ],
            },
            {
                fileValidateMessage: ({ file }: UploadFileItemSlotProps) => (file.uid === '1' ? <em>bad a</em> : []),
            }
        );
        const [a, b] = getPicCards();
        expect(a.querySelector(`.${prefix}-picture-file-card-icon-error`)).not.toBeNull();
        expect(b.querySelector(`.${prefix}-picture-file-card-icon-error`)).toBeNull();
    });

    it('#ellipsisTooltip 转发到文件名的 Typography.Text', async () => {
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
            return { width: this.toString() ? 200 : 0 } as DOMRect;
        });
        renderUpload(
            { defaultFileList: [defaultFileList[0]] },
            {
                ellipsisTooltip: ({ content, trigger }: { content: string; trigger: unknown }) => (
                    <b data-testid="tip" data-content={content}>
                        {trigger as never}
                    </b>
                ),
            }
        );
        await fireEvent.mouseEnter(screen.getByText('vigo.png'));
        await waitFor(() => expect(screen.getByTestId('tip')).toHaveAttribute('data-content', 'vigo.png'));
    });

    it('@change 只收到组件事件，不收到隐藏 input 冒泡的原生 change', async () => {
        const onChange = fn();
        renderUpload({ onChange });
        await selectFiles([createFile(10, 'a.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).not.toBeInstanceOf(Event);
        expect(Object.keys(onChange.mock.calls[0][0]).toSorted()).toEqual(['currentFile', 'fileList']);
    });

    it('remove 事件首参：来自 defaultFileList 的文件为 undefined', async () => {
        const onRemove = fn();
        renderUpload({ defaultFileList: [defaultFileList[0]], onRemove });
        await userEvent.click(query(`.${prefix}-file-card-close`));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(onRemove.mock.calls[0][0]).toBeUndefined();
        expectTypeOf<UploadEmits['remove'][0]>().toEqualTypeOf<CustomFile | undefined>();
    });

    it('监听 previewClick 时卡片有预览按钮与 show-pointer 类，未监听时没有', () => {
        const view = renderUpload({ defaultFileList: [defaultFileList[0]], onPreviewClick: fn() });
        expect(screen.getByRole('button', { name: zh_CN.Upload.preview })).toBeInTheDocument();
        expect(getCard('vigo.png')).toHaveClass(`${prefix}-file-card-show-pointer`);
        view.unmount();
        renderUpload({ defaultFileList: [defaultFileList[0]] });
        expect(screen.queryByRole('button', { name: zh_CN.Upload.preview })).toBeNull();
        expect(getCard('vigo.png')).not.toHaveClass(`${prefix}-file-card-show-pointer`);
    });

    it.each([
        [false, null],
        [true, ''],
        ['user', 'user'],
    ] as const)('capture 为 %s 时输出 %s', (capture, attr) => {
        renderUpload({ capture });
        expect(getInput().getAttribute('capture')).toBe(attr);
    });

    it('directory 输出 webkitdirectory，未开启时不输出', () => {
        const view = renderUpload();
        expect(getInput()).not.toHaveAttribute('webkitdirectory');
        expect(getInput()).not.toHaveAttribute('directory');
        view.unmount();
        renderUpload({ directory: true });
        expect(getInput()).toHaveAttribute('webkitdirectory');
    });

    it('KeepAlive：失活后页面粘贴不添加文件，激活后恢复', async () => {
        const onFileChange = fn();
        render(CachedUpload, { props: { uploadProps: { addOnPasting: true, onFileChange } as never } });
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByText('other page')).toBeInTheDocument();
        await pasteFile('hidden.png');
        expect(onFileChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await pasteFile('shown.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['shown.png']);
    });

    it('布尔简写按 true 处理', () => {
        render(BooleanShorthand);
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-disabled`);
        expect(getDragArea()).not.toBeNull();
        expect(getInput().multiple).toBe(true);
    });

    it('默认插槽里禁用的 Button 仍是使用方的控件：添加区域不成为按钮，移除按钮可用，恢复后不变', async () => {
        // let the MutationObserver callback and its re-render run before a negative assertion
        const settle = async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
            await nextTick();
        };
        const onOpenFileDialog = fn();
        const onRemove = fn();
        const view = render(ToggleControl, {
            props: { disabled: true },
            attrs: { defaultFileList, onOpenFileDialog, onRemove },
        });
        await settle();
        const area = query(`.${prefix}-add`, view.container);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        await fireEvent.keyDown(area, { key: 'Enter' });
        expect(onOpenFileDialog).not.toHaveBeenCalled();
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Upload.remove })[0]);
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));

        await view.rerender({ disabled: false });
        await settle();
        expect(area).not.toHaveAttribute('role');
        await userEvent.click(screen.getByRole('button', { name: '点击上传' }));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);

        await view.rerender({ disabled: true });
        await settle();
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
    });

    it('默认插槽里 aria-disabled 的使用方控件仍是已有控件，aria-disabled 由 false 变 true 后添加区域不成为按钮', async () => {
        const settle = async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
            await nextTick();
        };
        const disabled = shallowRef(true);
        const onOpenFileDialog = fn();
        const control = () => (
            <button aria-disabled={disabled.value} tabindex={disabled.value ? -1 : undefined} type="button">
                自定义上传
            </button>
        );
        const view = render({
            render: () => (
                <Upload action={action} onOpenFileDialog={onOpenFileDialog}>
                    {{ default: control }}
                </Upload>
            ),
        });
        await settle();
        const area = query(`.${prefix}-add`, view.container);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        await fireEvent.keyDown(area, { key: 'Enter' });
        expect(onOpenFileDialog).not.toHaveBeenCalled();

        disabled.value = false;
        await settle();
        expect(area).not.toHaveAttribute('role');
        disabled.value = true;
        await settle();
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
    });

    it('默认插槽里 tabindex 为 -1 的按钮只在 aria-disabled 变为 true 时被识别为已有控件', async () => {
        const settle = async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
            await nextTick();
        };
        const view = render({
            render: () => (
                <Upload action={action}>
                    {{
                        default: () => (
                            <button tabindex={-1} type="button">
                                自定义上传
                            </button>
                        ),
                    }}
                </Upload>
            ),
        });
        await settle();
        const area = query(`.${prefix}-add`, view.container);
        expect(area).toHaveAttribute('role', 'button');

        const control = screen.getByText('自定义上传');
        control.setAttribute('aria-disabled', 'true');
        await settle();
        expect(area).not.toHaveAttribute('role');
        control.setAttribute('aria-disabled', 'false');
        await settle();
        expect(area).toHaveAttribute('role', 'button');
    });

    it('服务端渲染不访问 document', async () => {
        const app = createSSRApp({ render: () => <Upload action="" /> });
        vi.stubGlobal('document', undefined);
        const html = await renderToString(app);
        vi.unstubAllGlobals();
        const host = document.createElement('div');
        host.innerHTML = html;
        expect(host.querySelector(`.${prefix}-add`)).toHaveAttribute('role', 'button');
    });

    it('Upload.FileCard 与具名导出是同一个组件', () => {
        expect(UploadIndex.FileCard).toBe(UploadFileCard);
        expectTypeOf<UploadProps['fileList']>().toEqualTypeOf<FileItem[] | undefined>();
    });
});
