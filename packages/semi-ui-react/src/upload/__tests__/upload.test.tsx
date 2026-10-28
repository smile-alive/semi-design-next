import { createRef, StrictMode, useState, type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, act, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { CustomFile } from '@fibrae/semi-foundation/upload/foundation';
import { IconUser } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import FileCard, { type FileCardProps } from '../file-card';
import type { AfterUploadProps, AfterUploadResult, BeforeUploadObjectResult, BeforeUploadProps, FileItem, RenderFileItemProps, UploadHandle, UploadProps } from '../index';

type UploadCallback<K extends keyof UploadProps> = NonNullable<UploadProps[K]>;

let action = 'https://semi.bytendance.com';

const PROGRESS_COEFFICIENT = 0.95;

const prefixCls = `${BASE_CLASS_PREFIX}-upload`;

// Props stay loose on purpose: several cases pass values Upload's types reject to check the runtime handling
function renderUpload(props: Record<string, unknown> & { children?: ReactNode; action?: string } = {}) {
    const {
        children = (
            <Button theme="light" icon={<IconUser />}>
                点击上传
            </Button>
        ),
        ...rest
    } = props;
    return render(
        <Upload {...rest} action={rest.action || action}>
            {children}
        </Upload>
    );
}

const getInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls}-hidden-input`);
const getReplaceInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls}-hidden-input-replace`);
const getCardNames = () => Array.from(document.querySelectorAll(`.${prefixCls}-file-card-info-name`)).map((node) => node.textContent);
const getCard = (name) => screen.getByText(name).closest(`.${prefixCls}-file-card`);
const getPicCards = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-picture-file-card`);
const getDragArea = () => document.querySelector(`.${prefixCls}-drag-area`);

// user-event's upload() drops files rejected by `accept` and keeps only one file on a non-multiple input,
// which would hide the component's own accept / limit handling, so the change event is fired directly
function selectFiles(files, input = getInput()) {
    fireEvent.change(input, { target: { files } });
}

const lastFileList = (onChange) => onChange.mock.lastCall[0].fileList;

function installFakeXhr() {
    const requests: FakeXMLHttpRequest[] = [];
    class FakeXMLHttpRequest {
        withCredentials = false;
        upload: { onprogress: (event: { loaded: number; total: number }) => void } = {
            onprogress: () => {
                throw new Error('the foundation did not assign upload.onprogress');
            },
        };
        method?: string;
        url?: string;
        requestBody?: FormData;
        requestHeaders: Record<string, string> = {};
        status = 0;
        responseText = '';
        aborted = false;
        constructor() {
            requests.push(this);
        }
        onload: (event: object) => void = () => {
            throw new Error('the foundation did not assign onload');
        };
        open(method, url) {
            this.method = method;
            this.url = url;
        }
        setRequestHeader(key, value) {
            this.requestHeaders[key] = value;
        }
        send(body) {
            this.requestBody = body;
        }
        abort() {
            this.aborted = true;
        }
        respond(status, _headers, body) {
            this.status = status;
            this.responseText = body;
            act(() => this.onload({}));
        }
        uploadProgress(event) {
            act(() => this.upload.onprogress(event));
        }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    return requests;
}

const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

const createFile = (size = 44320, name = 'semi-logo.png', type = 'image/png') => {
    return new File([new ArrayBuffer(size)], name, {
        type: type,
    });
};

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'vigo.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: 'https://example.com/bag.jpeg',
    },
    {
        uid: '2',
        name: 'test.jpeg',
        status: 'uploadFail',
        size: '222KB',
        preview: false,
        url: 'https://example.com/bag.jpeg',
    },
];

let requests: ReturnType<typeof installFakeXhr>;
const createObjectURL = vi.fn<typeof URL.createObjectURL>();
const revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
window.URL.createObjectURL = createObjectURL;
window.URL.revokeObjectURL = revokeObjectURL;

beforeEach(() => {
    requests = installFakeXhr();
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

/**
 * Opening the native file browser cannot be tested in jsdom; tests only check that the hidden input is clicked.
 */
describe('Upload', () => {
    it('className 与 style', () => {
        const { container } = renderUpload({
            className: 'test',
            style: { color: 'red' },
            action: '',
        });
        const root = container.querySelector('div.test');
        expect(root).not.toBeNull();
        expect(root).toHaveClass(prefixCls);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('action 与 withCredentials', () => {
        renderUpload({
            action,
            withCredentials: true,
            data: { semiKey: 123456 },
        });
        selectFiles([file]);
        expect(requests[0].url).toEqual(action);
        expect(requests[0].withCredentials).toEqual(true);
    });

    it('data、headers 与 name', () => {
        let headers = { 'x-tt-header': 'semi' };
        let name = 'bytedance.jpeg';
        renderUpload({
            data: { semiKey: 123456 },
            name,
            headers,
        });
        selectFiles([file]);
        let requestBody = Array.from(requests[0].requestBody);
        expect(requestBody[0][0]).toEqual('semiKey');
        expect(requestBody[0][1]).toEqual('123456');
        expect(requests[0].requestHeaders).toEqual(headers);
        expect(requestBody[1][0]).toEqual(name);
    });

    it('data 与 headers 为函数', () => {
        let headers = { 'x-tt-header': 'semi' };
        let data = { semiKey: 123456 };
        const getData = vi.fn<(file: File) => typeof data>(() => data);
        const getHeaders = vi.fn<(file: File) => typeof headers>(() => headers);
        renderUpload({
            data: getData,
            headers: getHeaders,
        });
        selectFiles([file]);
        let requestBody = Array.from(requests[0].requestBody);
        expect(requestBody[0][0]).toEqual('semiKey');
        expect(requestBody[0][1]).toEqual('123456');
        expect(getData).toHaveBeenCalledTimes(1);
        expect(getData).toHaveBeenCalledWith(file);

        expect(requests[0].requestHeaders).toEqual(headers);
        expect(getHeaders).toHaveBeenCalledTimes(1);
        expect(getHeaders).toHaveBeenCalledWith(file);
    });

    it('accept', () => {
        let accept = 'application/pdf,image/png,image/jpeg';
        renderUpload({ accept });
        expect(getInput()).toHaveAttribute('accept', accept);
        expect(getReplaceInput()).toHaveAttribute('accept', accept);
    });

    it('minSize、maxSize 与 onSizeError', () => {
        let kb1 = 1024 * 1024;
        const onSizeError = vi.fn<UploadCallback<'onSizeError'>>();
        renderUpload({
            maxSize: kb1 * 3,
            minSize: kb1 * 2,
            onSizeError,
        });
        const bigFile = createFile(kb1 * 4, 'bigSemi.jpeg');
        const smallFile = createFile(kb1, 'smallSemi.jpeg');

        selectFiles([bigFile]);
        selectFiles([smallFile]);
        expect(onSizeError).toHaveBeenCalledTimes(2);
        const [firstArgs, secondArgs] = onSizeError.mock.calls;
        expect(firstArgs[0] instanceof File).toEqual(true);
        expect(firstArgs[0].name).toEqual('bigSemi.jpeg');
        expect(firstArgs[1]).toEqual([]);
        expect(secondArgs[0] instanceof File).toEqual(true);
        expect(secondArgs[0].name).toEqual('smallSemi.jpeg');
        expect(secondArgs[1].map((item) => item.name)).toEqual(['bigSemi.jpeg']);
        expect(screen.getAllByText('文件尺寸不合法')).toHaveLength(2);
        expect(requests).toHaveLength(0);
    });

    it('prompt 与 promptPosition', () => {
        let prompt = 'Some info for extra text';
        const props = { action, prompt, children: null };
        const { container, rerender } = render(<Upload {...props} promptPosition="right" />);
        const root = container.querySelector(`.${prefixCls}`);
        expect(container.querySelector(`.${prefixCls}-prompt`)).toHaveTextContent(prompt);
        expect(root).toHaveAttribute('x-prompt-pos', 'right');
        rerender(<Upload {...props} promptPosition="bottom" />);
        expect(root).toHaveAttribute('x-prompt-pos', 'bottom');
        rerender(<Upload {...props} promptPosition="left" />);
        expect(root).toHaveAttribute('x-prompt-pos', 'left');
    });

    it('limit 与 onExceed', () => {
        const onExceed = vi.fn<UploadCallback<'onExceed'>>();
        renderUpload({
            limit: 2,
            onExceed,
        });
        let fileA = createFile(1024, 'fileA');
        let fileB = createFile(1024, 'fileB');
        let fileC = createFile(1024, 'fileC');
        selectFiles([fileA, fileB, fileC]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['fileA', 'fileB']);
    });

    it('beforeUpload 返回 boolean', () => {
        const beforeUpload = vi.fn<UploadCallback<'beforeUpload'>>(({ file }) => file.name === 'pass.jpg');
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ beforeUpload, onChange });
        selectFiles([createFile(10, 'pass.jpg')]);
        expect(getCardNames()).toEqual(['pass.jpg']);

        selectFiles([createFile(20, 'fail.jpg')]);
        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.name)).toEqual(['pass.jpg', 'fail.jpg']);
        expect(fileList.map((item) => item.status)).toEqual(['uploading', 'validateFail']);
        expect(getCard('fail.jpg')).toHaveClass(`${prefixCls}-file-card-fail`);
        expect(requests).toHaveLength(1);
        expect(beforeUpload).toHaveBeenCalledTimes(2);
    });

    it('beforeUpload 同步返回对象', () => {
        const beforeUpload = vi.fn<UploadCallback<'beforeUpload'>>(({ file }) => {
            let result: BeforeUploadObjectResult = {
                shouldUpload: false,
                autoRemove: false,
            };
            if (file.name === 'pass.jpg') {
                result.shouldUpload = true;
            }
            if (file.name === 'invalid.jpg') {
                result.validateMessage = 'not valid file';
                result.status = 'validateFail';
            }
            if (file.name === 'autoRemove.jpg') {
                result.autoRemove = true;
            }
            return result;
        });
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ beforeUpload, onChange });
        selectFiles([createFile(10, 'pass.jpg')]);
        expect(getCardNames()).toEqual(['pass.jpg']);

        selectFiles([createFile(20, 'invalid.jpg')]);

        selectFiles([createFile(30, 'autoRemove.jpg')]);

        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.status)).toEqual(['uploading', 'validateFail']);
        expect(fileList[1].validateMessage).toEqual('not valid file');
        expect(getCardNames()).toEqual(['pass.jpg', 'invalid.jpg']);
        expect(screen.getByText('not valid file')).toBeInTheDocument();
        expect(requests).toHaveLength(1);
        expect(beforeUpload).toHaveBeenCalledTimes(3);
    });

    it('beforeUpload 返回 Promise', async () => {
        const beforeUpload = vi.fn<(args: BeforeUploadProps) => Promise<BeforeUploadObjectResult | undefined> | undefined>(({ file }) => {
            switch (file.name) {
                case 'reject.jpg':
                    return new Promise((_resolve, reject) => setTimeout(reject, 10));
                case 'resolve.jpg':
                    return new Promise((resolve) => setTimeout(resolve, 10));
                case 'resloveObject.jpg':
                    return new Promise((resolve) => {
                        let newFile = createFile(200, 'afterProcess.jpg');
                        setTimeout(() => resolve({ fileInstance: newFile }), 10);
                    });
                case 'rejectObject.jpg':
                    return new Promise((_resolve, reject) => {
                        let result = {
                            status: 'validateFail',
                            validateMessage: 'not valid',
                        };
                        setTimeout(() => reject(result), 10);
                    });
                default:
                    return undefined;
            }
        });
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ beforeUpload, onChange });
        const statuses = () => lastFileList(onChange).map((item) => item.status);
        selectFiles([createFile(50, 'reject.jpg')]);
        await waitFor(() => expect(statuses()).toEqual(['validateFail']));
        selectFiles([createFile(50, 'resolve.jpg')]);
        await waitFor(() => expect(requests).toHaveLength(1));
        selectFiles([createFile(50, 'resloveObject.jpg')]);
        await waitFor(() => expect(requests).toHaveLength(2));
        selectFiles([createFile(50, 'rejectObject.jpg')]);
        await waitFor(() => expect(statuses()).toHaveLength(4));
        await waitFor(() => expect(statuses()[3]).toEqual('validateFail'));

        expect(beforeUpload).toHaveBeenCalledTimes(4);
        const fileList = lastFileList(onChange);
        expect(statuses()).toEqual(['validateFail', 'uploading', 'uploading', 'validateFail']);
        expect(fileList[2].fileInstance.name).toEqual('afterProcess.jpg');
        expect(requests[1].requestBody.get('afterProcess.jpg')).toBeInstanceOf(File);
        expect(fileList[3].validateMessage).toEqual('not valid');
        expect(getCardNames()).toEqual(['reject.jpg', 'resolve.jpg', 'afterProcess.jpg', 'rejectObject.jpg']);
        expect(screen.getByText('not valid')).toBeInTheDocument();
    });

    it('onFileChange', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ onFileChange });
        selectFiles([file]);
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(onFileChange.mock.calls[0][0]).toEqual([file]);
    });

    it('onProgress', () => {
        const onProgress = vi.fn<UploadCallback<'onProgress'>>();
        renderUpload({ onProgress });
        selectFiles([file]);
        requests[0].uploadProgress({ loaded: 40, total: 100 });
        requests[0].uploadProgress({ loaded: 80, total: 100 });
        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress.mock.calls[0][0]).toEqual(40 * PROGRESS_COEFFICIENT);
        expect(onProgress.mock.calls[0][1]).toBe(file);
        expect(onProgress.mock.calls[1][0]).toEqual(80 * PROGRESS_COEFFICIENT);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(80 * PROGRESS_COEFFICIENT));
    });

    it('onError', () => {
        const onError = vi.fn<UploadCallback<'onError'>>();
        renderUpload({ onError });
        selectFiles([file]);
        requests[0].respond(404, { 'Content-Type': 'application/json' }, '[{ "id": 12, "comment": "Hey there" }]');
        expect(onError).toHaveBeenCalledTimes(1);
        const [error, fileInstance, fileList, xhr] = onError.mock.calls[0];
        expect(error.method).toEqual('post');
        expect(error.status).toEqual(404);
        expect(error.message).toMatch(/xhr status: 404$/);
        expect(fileInstance instanceof File).toEqual(true);
        expect(Array.isArray(fileList)).toEqual(true);
        expect(xhr instanceof XMLHttpRequest).toEqual(true);
        expect(screen.getByText('上传失败')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    });

    it('onRetry', async () => {
        const onRetry = vi.fn<UploadCallback<'onRetry'>>();
        const fileInstance = createFile(200, 'semi.jpg');
        const file = {
            uid: '2',
            name: 'test.jpeg',
            status: 'uploadFail',
            size: '222KB',
            preview: true,
            fileInstance,
            url: 'https://example.com/bag.jpeg',
        };
        renderUpload({
            fileList: [file],
            onRetry,
        });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        const [f] = onRetry.mock.calls[0];
        expect(f.fileInstance instanceof File).toEqual(true);
        expect(requests).toHaveLength(1);
    });

    it('onOpenFileDialog', async () => {
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ onOpenFileDialog });
        await userEvent.click(screen.getByText('点击上传'));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts).toContain(getInput());
    });

    it('onSuccess', () => {
        let body = [{ id: 12, comment: 'Hey there' }];
        const onSuccess = vi.fn<UploadCallback<'onSuccess'>>();
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ onSuccess, onChange });
        selectFiles([file]);
        requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(body));
        expect(onSuccess).toHaveBeenCalledTimes(1);
        const [responseBody, fileInstance, fileList] = onSuccess.mock.calls[0];
        expect(responseBody).toEqual([{ id: 12, comment: 'Hey there' }]);
        expect(fileInstance).toBe(file);
        expect(fileList.map((item) => item.status)).toEqual(['success']);
        expect(lastFileList(onChange)[0]).toMatchObject({ status: 'success', percent: 100, response: body });
    });

    it('onRemove', async () => {
        const onRemove = vi.fn<UploadCallback<'onRemove'>>();
        let fileInstance = createFile(200, 'semi.jpg');
        let file = {
            uid: '2',
            name: 'test.jpeg',
            status: 'error',
            size: '222KB',
            preview: true,
            fileInstance,
            url: 'https://example.com/bag.jpeg',
        };
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({
            defaultFileList: [file],
            onRemove,
            onChange,
        });
        await userEvent.click(document.querySelector(`button.${prefixCls}-file-card-close`));
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
        expect(lastFileList(onChange)).toEqual([]);
        const [removedFile, fileList, fileItem] = onRemove.mock.calls[0];
        expect(removedFile).toBe(fileInstance);
        expect(fileList).toEqual([]);
        expect(fileItem.uid).toEqual('2');
        expect(screen.queryByText('test.jpeg')).toBeNull();
    });

    it('defaultFileList', () => {
        renderUpload({ defaultFileList });
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        expect(items[0]).toHaveTextContent('130KB');
        expect(items[1]).toHaveTextContent('222KB');
        const thumbnails = document.querySelectorAll(`.${prefixCls}-file-card-preview img`);
        expect(thumbnails).toHaveLength(1);
        expect(thumbnails[0]).toHaveAttribute('src', defaultFileList[0].url);
    });

    it('showUploadList', () => {
        renderUpload({
            showUploadList: false,
            defaultFileList: [
                {
                    uid: '2',
                    name: 'test.jpeg',
                    status: 'error',
                    size: '222KB',
                    preview: true,
                    url: 'https://example.com/bag.jpeg',
                },
            ],
        });
        expect(document.querySelector(`.${prefixCls}-file-list`)).toBeNull();
        expect(screen.queryByText('test.jpeg')).toBeNull();
    });

    it('listType', () => {
        renderUpload({ listType: 'picture' });
        expect(document.querySelector(`.${prefixCls}.${prefixCls}-picture`)).not.toBeNull();
    });

    it('previewFile', () => {
        const previewFile = vi.fn<UploadCallback<'previewFile'>>(() => <div data-testid="custom-preview">2</div>);
        renderUpload({ previewFile });
        selectFiles([file]);
        requests[0].respond(200, { 'Content-Type': 'application/json' }, 'success');
        const preview = document.querySelector(`.${prefixCls}-file-card-preview`);
        expect(preview).toContainElement(screen.getByTestId('custom-preview'));
        expect(previewFile).toHaveBeenCalled();
        expect(previewFile.mock.lastCall[0]).toMatchObject({ name: 'chucknorris.png', status: 'success' });
    });

    it('受控模式下卸载时不释放 objectURL', async () => {
        const objUrl = 'blob:semi-upload-test-url';
        createObjectURL.mockImplementation(() => objUrl);

        function ControlledWrapper() {
            const [fileList, setFileList] = useState([]);
            const [visible, setVisible] = useState(true);
            return (
                <div>
                    <button onClick={() => setVisible((v) => !v)}>toggle</button>
                    {visible ? (
                        <Upload action={action} fileList={fileList} showUploadList onChange={({ fileList }) => setFileList(fileList)}>
                            <Button>Upload</Button>
                        </Upload>
                    ) : null}
                </div>
            );
        }

        render(<ControlledWrapper />);
        selectFiles([createFile(20, 'toggle.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalled();
        expect(document.querySelector(`.${prefixCls}-file-card-preview img`)).toHaveAttribute('src', objUrl);

        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(getInput()).toBeNull();
        expect(revokeObjectURL).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(getInput()).not.toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(document.querySelector(`.${prefixCls}-file-card-preview img`)).toHaveAttribute('src', objUrl);
        expect(revokeObjectURL).not.toHaveBeenCalled();
    });

    it('受控 fileList 变回 undefined 时清空列表（表单重置）', () => {
        const file: FileItem = {
            uid: '1',
            name: 'semi.png',
            status: 'success',
            size: '1KB',
            url: 'https://example.com/semi.png',
        };
        const { rerender } = render(<Upload action={action} defaultFileList={[file]} fileList={[file]} />);
        expect(getCardNames()).toEqual(['semi.png']);
        rerender(<Upload action={action} defaultFileList={[file]} fileList={undefined} />);
        expect(getCardNames()).toEqual([]);
    });

    it('上传事件不改动受控 fileList 的条目', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const onSuccess = vi.fn<UploadCallback<'onSuccess'>>();
        function Controlled() {
            const [fileList, setFileList] = useState([]);
            return (
                <Upload
                    action={action}
                    fileList={fileList}
                    onChange={(info) => {
                        onChange(info);
                        setFileList(info.fileList);
                    }}
                    onSuccess={onSuccess}
                >
                    <Button>Upload</Button>
                </Upload>
            );
        }
        render(<Controlled />);
        selectFiles([createFile(20, 'a.png')]);
        const added = lastFileList(onChange)[0];
        const snapshot = { ...added };

        requests[0].uploadProgress({ loaded: 40, total: 100 });
        expect(added).toEqual(snapshot);
        const progressing = onChange.mock.lastCall[0];
        expect(progressing.currentFile).toBe(progressing.fileList[0]);
        expect(progressing.currentFile).toMatchObject({ status: 'uploading', percent: 40 * PROGRESS_COEFFICIENT });

        const progressed = { ...progressing.currentFile };
        requests[0].respond(200, {}, '{"ok":1}');
        expect(added).toEqual(snapshot);
        expect(progressing.currentFile).toEqual(progressed);
        const done = onChange.mock.lastCall[0];
        expect(done.currentFile).toBe(done.fileList[0]);
        expect(done.currentFile).toMatchObject({ status: 'success', percent: 100, response: { ok: 1 } });
        expect(onSuccess.mock.lastCall[2][0]).toBe(done.currentFile);
    });

    it('上传出错时不改动受控 fileList 的条目', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        function Controlled() {
            const [fileList, setFileList] = useState([]);
            return (
                <Upload
                    action={action}
                    fileList={fileList}
                    onChange={(info) => {
                        onChange(info);
                        setFileList(info.fileList);
                    }}
                >
                    <Button>Upload</Button>
                </Upload>
            );
        }
        render(<Controlled />);
        selectFiles([createFile(20, 'a.png')]);
        const added = lastFileList(onChange)[0];
        const snapshot = { ...added };
        requests[0].respond(500, {}, '');
        expect(added).toEqual(snapshot);
        const failed = onChange.mock.lastCall[0];
        expect(failed.currentFile).toBe(failed.fileList[0]);
        expect(failed.currentFile.status).toBe('uploadFail');
    });

    it('remove 与 clear 时释放 objectURL', async () => {
        const objUrl = 'blob:semi-upload-test-url-2';
        createObjectURL.mockImplementation(() => objUrl);

        const upload = renderUpload({});
        selectFiles([createFile(10, 'remove.png', 'image/png')]);
        expect(createObjectURL).toHaveBeenCalled();
        await userEvent.click(document.querySelector(`button.${prefixCls}-file-card-close`));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        upload.unmount();

        revokeObjectURL.mockReset();
        renderUpload({ limit: 3 });
        selectFiles([createFile(10, 'clear.png', 'image/png')]);
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objUrl));
        expect(screen.queryByText('clear.png')).toBeNull();
    });

    it('选择多个文件后 clear 时释放全部 objectURL', async () => {
        const urlMap: Record<string, string> = {
            'a.png': 'blob:multi-a',
            'b.png': 'blob:multi-b',
        };
        createObjectURL.mockImplementation((file) => urlMap[(file as File).name] || `blob:${(file as File).name}`);

        renderUpload({ limit: 3 });
        const fileA = createFile(10, 'a.png', 'image/png');
        const fileB = createFile(10, 'b.png', 'image/png');
        selectFiles([fileA, fileB]);

        expect(createObjectURL).toHaveBeenCalledTimes(2);
        await userEvent.click(screen.getByRole('button', { name: '清空' }));

        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(2));
        const revoked = revokeObjectURL.mock.calls.map((args) => args[0]);
        expect(revoked).toEqual(expect.arrayContaining(['blob:multi-a', 'blob:multi-b']));
    });

    it('limit 为 1 时选择新文件替换旧文件，旧文件的 objectURL 被释放', () => {
        createObjectURL.mockImplementation((file) => `blob:${(file as File).name}`);
        renderUpload({ limit: 1 });
        selectFiles([createFile(10, 'a.png', 'image/png')]);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        selectFiles([createFile(10, 'b.png', 'image/png')]);
        expect(getCardNames()).toEqual(['b.png']);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:a.png');
        expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:b.png');
    });

    it('替换按 uid 定位：列表在选择文件前变化时仍替换原来那一项', async () => {
        const list: FileItem[] = [
            { uid: 'a', name: 'a.png', status: 'success', size: '1KB' },
            { uid: 'b', name: 'b.png', status: 'success', size: '1KB' },
        ];
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const { rerender } = render(<Upload action={action} fileList={list} showReplace onChange={onChange} />);
        await userEvent.click(document.querySelectorAll(`.${prefixCls}-file-card-replace`)[1]);
        rerender(<Upload action={action} fileList={[list[1]]} showReplace onChange={onChange} />);
        selectFiles([createFile(10, 'new.png', 'image/png')], getReplaceInput());
        expect(onChange.mock.lastCall[0].fileList.map((item) => item.name)).toEqual(['new.png']);
    });

    it('图片墙 limit 为 0 时不渲染添加按钮', () => {
        renderUpload({ listType: 'picture', limit: 0 });
        expect(document.querySelector(`.${prefixCls}-add`)).toBeNull();
    });

    it('不在根元素上输出 aria-required 与 tabIndex', () => {
        const { container } = render(<Upload aria-required tabIndex={0} action={action} />);
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).not.toHaveAttribute('aria-required');
        expect(root).not.toHaveAttribute('tabindex');
    });

    it('tabIndex 落在添加按钮上，-1 可将其移出 Tab 顺序', () => {
        const { container } = render(<Upload tabIndex={-1} action={action} />);
        expect(container.querySelector(`.${prefixCls}-add`)).toHaveAttribute('tabindex', '-1');
    });

    it('onBlur 只在焦点离开整个 Upload 时触发', () => {
        const onBlur = vi.fn<NonNullable<UploadProps['onBlur']>>();
        const { container } = render(
            <>
                <Upload action={action} defaultFileList={defaultFileList} onBlur={onBlur} />
                <button type="button">outside</button>
            </>
        );
        const root = container.querySelector(`.${prefixCls}`);
        const inside = root.querySelector('button');
        const outside = screen.getByText('outside');
        fireEvent.blur(inside, { relatedTarget: root.querySelector('input') ?? root });
        expect(onBlur).not.toHaveBeenCalled();
        fireEvent.blur(inside, { relatedTarget: outside });
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('afterUpload', () => {
        let codeStatusMaps = {
            0: 'success',
            1: 'uploadFail',
            2: 'validateFail',
        };
        const afterUpload = vi.fn<UploadCallback<'afterUpload'>>(({ response }: AfterUploadProps) => {
            let result: AfterUploadResult = {};
            result.status = codeStatusMaps[response.code];
            if (response.message) {
                result.validateMessage = response.message;
            }
            if (response.autoRemove) {
                result.autoRemove = true;
            }
            if (response.newName) {
                result.name = response.newName;
            }
            return result;
        });
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ afterUpload, onChange });
        const respondJson = (request, body) => request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(body));

        selectFiles([createFile(234, 'uploadSuccess.jpg')]);
        respondJson(requests[0], { code: 0 });

        selectFiles([createFile(123, 'uploadFail.jpg')]);
        let uploadFailMessage = 'upload request fail';
        respondJson(requests[1], { code: 1, message: uploadFailMessage });

        selectFiles([createFile(123, 'validateFail.jpg')]);
        let validateFailMessage = 'what u upload is invalid';
        respondJson(requests[2], { code: 2, message: validateFailMessage });

        selectFiles([createFile(123, 'remove.jpg')]);
        respondJson(requests[3], { code: 2, autoRemove: true });

        selectFiles([createFile(123, 'semi.jpg')]);
        let rename = 'renameByAfterUpload.jpg';
        respondJson(requests[4], { code: 1, newName: rename });

        expect(afterUpload).toHaveBeenCalledTimes(5);
        const fileList = lastFileList(onChange);
        expect(fileList.map((item) => item.status)).toEqual(['success', 'uploadFail', 'validateFail', 'uploadFail']);
        expect(fileList[1].validateMessage).toEqual(uploadFailMessage);
        expect(fileList[2].validateMessage).toEqual(validateFailMessage);
        expect(getCardNames()).toEqual(['uploadSuccess.jpg', 'uploadFail.jpg', 'validateFail.jpg', rename]);
        expect(screen.getByText(uploadFailMessage)).toBeInTheDocument();
        expect(screen.getByText(validateFailMessage)).toBeInTheDocument();
    });

    it('afterUpload 与 autoRemove 时，onChange 将被移除的文件作为当前文件上报', () => {
        const afterUpload = vi.fn<UploadCallback<'afterUpload'>>(() => ({ autoRemove: true }));
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ afterUpload, onChange });
        selectFiles([createFile(10, 'first.jpg')]);
        selectFiles([createFile(20, 'second.jpg')]);
        requests[0].respond(200, { 'Content-Type': 'application/json' }, '{}');

        expect(getCardNames()).toEqual(['second.jpg']);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ currentFile: expect.objectContaining({ name: 'first.jpg' }) }));
    });

    it('uploadTrigger', () => {
        const ref = createRef<UploadHandle>();
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        render(
            <Upload ref={ref} action={action} uploadTrigger="custom" onChange={onChange}>
                <Button>点击上传</Button>
            </Upload>
        );
        selectFiles([createFile(234, 'semi.jpg')]);
        expect(getCardNames()).toEqual(['semi.jpg']);
        expect(lastFileList(onChange)[0].status).toEqual('wait');
        expect(requests.length).toEqual(0);
        act(() => ref.current?.upload());
        expect(requests.length).toEqual(1);
    });

    it('uploadTrigger="custom" 时手动上传只上传等待中的文件', () => {
        const ref = createRef<UploadHandle>();
        render(
            <Upload ref={ref} action={action} defaultFileList={defaultFileList} uploadTrigger="custom">
                <Button>点击上传</Button>
            </Upload>
        );
        selectFiles([createFile(234, 'semi.jpg')]);
        act(() => ref.current?.upload());
        expect(requests.length).toEqual(1);
    });

    it('limit 与 listType="picture" 时自动隐藏上传触发器', () => {
        renderUpload({
            limit: 2,
            listType: 'picture',
            defaultFileList,
        });
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-add`)).toBeNull();
    });

    it('children 中的控件为唯一按钮：添加区域不设置 role，点击仍可打开', async () => {
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        const { container } = renderUpload({ onOpenFileDialog });
        const area = container.querySelector(`.${prefixCls}-add`);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        expect(screen.getAllByRole('button')).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: '点击上传' }));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('内容中无控件时，添加区域即为按钮，Enter 或 Space 可打开对话框', async () => {
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        renderUpload({ onOpenFileDialog, children: <span>上传文件</span> });
        const area = screen.getByRole('button', { name: '上传文件' });
        act(() => area.focus());
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onOpenFileDialog).toHaveBeenCalledTimes(2);
    });

    it('图片墙添加按钮位于图片列表旁，列表仅包含图片', async () => {
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        renderUpload({ listType: 'picture', defaultFileList, onOpenFileDialog, children: <span>+</span> });
        const list = screen.getByRole('list', { name: zh_CN.Upload.pictureList });
        const add = screen.getByRole('button', { name: '+' });
        expect(list).not.toContainElement(add);
        expect(list.children).toHaveLength(defaultFileList.length);
        act(() => add.focus());
        await userEvent.keyboard('{Enter}');
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('无文本内容的添加区域由语言包提供名称', () => {
        renderUpload({ listType: 'picture', children: <IconUser /> });
        expect(screen.getByRole('button', { name: '上传文件' })).toBeInTheDocument();
    });

    it('有文本的添加区域以该文本作为名称', () => {
        renderUpload({ listType: 'picture', children: <span>添加图片</span> });
        expect(screen.getByRole('button', { name: '添加图片' })).toBeInTheDocument();
    });

    it('清除按钮是原生 button，响应 Enter 与 Space', async () => {
        const onClear = vi.fn<UploadCallback<'onClear'>>();
        const { unmount } = renderUpload({ defaultFileList, onClear });
        const clearButton = screen.getByRole('button', { name: '清空' });
        expect(clearButton.tagName).toBe('BUTTON');
        act(() => clearButton.focus());
        await userEvent.keyboard('{Enter}');
        expect(onClear).toHaveBeenCalledTimes(1);
        unmount();
        renderUpload({ defaultFileList, onClear });
        act(() => screen.getByRole('button', { name: '清空' }).focus());
        await userEvent.keyboard(' ');
        expect(onClear).toHaveBeenCalledTimes(2);
    });

    it('showClear', () => {
        const { container } = renderUpload({
            defaultFileList,
            showClear: false,
        });
        expect(container.querySelector(`.${prefixCls}-file-list-title-clear`)).toBeNull();

        const { container: container2 } = renderUpload({ defaultFileList });
        expect(container2.querySelector(`.${prefixCls}-file-list-title-clear`)).toHaveTextContent('清空');
    });

    it('showRetry', () => {
        renderUpload({
            defaultFileList,
            showRetry: false,
        });
        expect(screen.getByText('上传失败')).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-file-card-info-retry`)).toBeNull();
    });

    it('validateMessage', () => {
        renderUpload({
            defaultFileList,
            validateMessage: 'test',
        });
        expect(document.querySelector(`.${prefixCls}-validate-message`)).toHaveTextContent(/^test$/);
    });

    it('renderFileItem', () => {
        renderUpload({
            defaultFileList,
            renderFileItem: (fileItem) => <div className="customRender">{fileItem.name}</div>,
        });
        const items = document.querySelectorAll('.customRender');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent(defaultFileList[0].name);
        expect(items[1]).toHaveTextContent(defaultFileList[1].name);
        expect(document.querySelector(`.${prefixCls}-file-card`)).toBeNull();
    });

    it('limit=1 时替换文件', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({
            limit: 1,
            defaultFileList,
            onChange,
        });
        selectFiles([createFile(100, 'a.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['a.png']);
        expect(getCardNames()).toEqual(['a.png']);
    });

    it('文件变更时的 onAcceptInvalid', () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({
            accept: 'image/png',
            onAcceptInvalid,
            onFileChange,
        });
        selectFiles([createFile(100, 'a.jpg', 'image/jpg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        const [arg] = onAcceptInvalid.mock.calls[0];
        expect(arg.map((f) => f.name)).toEqual(['a.jpg']);
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('替换文件时的 onAcceptInvalid', async () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'vigo.png',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/bag.jpeg',
                },
            ],
            showReplace: true,
            accept: 'image/png',
            onAcceptInvalid,
        });
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-replace`));
        selectFiles([createFile(100, 'a.jpg', 'image/jpg')], getReplaceInput());
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        const [arg] = onAcceptInvalid.mock.calls[0];
        expect(arg.map((f) => f.name)).toEqual(['a.jpg']);
        expect(getCardNames()).toEqual(['vigo.png']);
    });

    it('beforeRemove 的副作用', async () => {
        const props = {
            fileList: [
                {
                    uid: '1',
                    name: 'vigo.png',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/bag.jpeg',
                },
            ],
        };
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const onRemove = vi.fn<UploadCallback<'onRemove'>>();

        const onChangePass = vi.fn<UploadCallback<'onChange'>>();
        const onRemovePass = vi.fn<UploadCallback<'onRemove'>>();

        const { container } = renderUpload({
            ...props,
            beforeRemove: () => false,
            onChange,
            onRemove,
        });

        const { container: containerPass } = renderUpload({
            ...props,
            beforeRemove: () => true,
            onChange: onChangePass,
            onRemove: onRemovePass,
        });

        await userEvent.click(container.querySelector(`.${prefixCls}-file-card-close`));
        await userEvent.click(containerPass.querySelector(`.${prefixCls}-file-card-close`));

        await waitFor(() => expect(onRemovePass).toHaveBeenCalledTimes(1));
        expect(onRemovePass.mock.calls[0][2].uid).toEqual('1');
        expect(onChangePass).toHaveBeenCalledTimes(1);
        expect(onChangePass.mock.calls[0][0].fileList).toEqual([]);

        expect(onChange).not.toHaveBeenCalled();
        expect(onRemove).not.toHaveBeenCalled();
    });

    it('beforeClear 的副作用', async () => {
        const props = {
            fileList: [
                {
                    uid: '1',
                    name: 'vigo.png',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/bag.jpeg',
                },
            ],
        };
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const onClear = vi.fn<UploadCallback<'onClear'>>();

        const onChangePass = vi.fn<UploadCallback<'onChange'>>();
        const onClearPass = vi.fn<UploadCallback<'onClear'>>();

        const onChangeReject = vi.fn<UploadCallback<'onChange'>>();
        const onClearReject = vi.fn<UploadCallback<'onClear'>>();

        const beforeClear = vi.fn<UploadCallback<'beforeClear'>>(() => Promise.resolve(false));
        const beforeClearReject = vi.fn<UploadCallback<'beforeClear'>>(() => Promise.reject());

        const { container } = renderUpload({
            ...props,
            beforeClear,
            onChange,
            onClear,
        });

        const { container: containerPass } = renderUpload({
            ...props,
            beforeClear: () => Promise.resolve(true),
            onChange: onChangePass,
            onClear: onClearPass,
        });

        const { container: containerReject } = renderUpload({
            ...props,
            beforeClear: beforeClearReject,
            onChange: onChangeReject,
            onClear: onClearReject,
        });

        const clearSelector = `.${prefixCls}-file-list-title-clear`;
        await userEvent.click(container.querySelector(clearSelector));
        await userEvent.click(containerPass.querySelector(clearSelector));
        await userEvent.click(containerReject.querySelector(clearSelector));

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

    it('insert 方法', () => {
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} defaultFileList={[]} />);

        const file_0 = new File([new ArrayBuffer(1024)], 'chucknorris_0.png', { type: 'image/png' });
        const file_1 = new File([new ArrayBuffer(1024)], 'chucknorris_1.png', { type: 'image/png' });
        const file_2 = new File([new ArrayBuffer(1024)], 'chucknorris_2.png', { type: 'image/png' });

        /**
         * test fileList should be [] => [file_0] => [file_1, file_0] => [file_1, file_2, file_0]
         */
        act(() => ref.current?.insert([file_0]));
        act(() => ref.current?.insert([file_1], 0));
        act(() => ref.current?.insert([file_2], 1));

        expect(getCardNames()).toEqual(['chucknorris_1.png', 'chucknorris_2.png', 'chucknorris_0.png']);
    });

    it('disabled 属性', () => {
        renderUpload({ disabled: true, children: <span>上传</span> });
        expect(document.querySelector(`.${prefixCls}-disabled`)).not.toBeNull();
        expect(screen.getByRole('button', { name: '上传' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('directory 属性', () => {
        renderUpload({ directory: true });
        expect(getInput()).toHaveAttribute('directory', 'directory');
        expect(getInput()).toHaveAttribute('webkitdirectory', 'webkitdirectory');
        expect(getReplaceInput()).not.toHaveAttribute('webkitdirectory');
    });

    it('fileList 受控模式', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({
            fileList: defaultFileList,
            onChange,
        });
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        selectFiles([createFile(100, 'new.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg', 'new.png']);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('capture 属性', () => {
        renderUpload({ capture: 'user' });
        expect(getInput()).toHaveAttribute('capture', 'user');
    });

    it('fileName 属性', () => {
        renderUpload({ fileName: 'customFileName' });
        selectFiles([createFile(100, 'test.jpg')]);
        const requestBody = Array.from(requests[0].requestBody);
        expect(requestBody[0][0]).toEqual('customFileName');
    });

    it('multiple 属性', () => {
        renderUpload({ multiple: true });
        expect(getInput().multiple).toEqual(true);
    });

    it('onPreviewClick 回调', async () => {
        const onPreviewClick = vi.fn<UploadCallback<'onPreviewClick'>>();
        renderUpload({
            defaultFileList,
            onPreviewClick,
        });
        expect(getCard('vigo.png')).toHaveClass(`${prefixCls}-file-card-show-pointer`);
        await userEvent.click(getCard('vigo.png'));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1', name: 'vigo.png' });
    });

    it('previewFile 函数', () => {
        const customPreviewFile = () => 'data:image/png;base64,...';
        renderUpload({
            previewFile: customPreviewFile,
            defaultFileList: [defaultFileList[0]],
        });
        const preview = document.querySelector(`.${prefixCls}-file-card-preview`);
        expect(preview).toHaveTextContent('data:image/png;base64,...');
        expect(preview).toHaveClass(`${prefixCls}-file-card-preview-placeholder`);
        expect(screen.queryByAltText('vigo.png')).toBeNull();
    });

    it('transformFile 函数', () => {
        const transformFile = vi.fn<(file: File) => File>((file) => new File([file], `transformed-${file.name}`, { type: file.type }));
        renderUpload({ transformFile });
        const file = createFile(100, 'origin.png');
        selectFiles([file]);
        expect(transformFile).toHaveBeenCalledWith(file);
        expect(getCardNames()).toEqual(['transformed-origin.png']);
        expect((Array.from(requests[0].requestBody)[0][1] as File).name).toEqual('transformed-origin.png');
    });

    it('renderThumbnail 函数', () => {
        const renderThumbnail = (file) => <img className="custom-thumbnail" alt={file.name} src={file.url} />;
        renderUpload({
            listType: 'picture',
            defaultFileList,
            renderThumbnail,
        });
        const thumbnails = document.querySelectorAll<HTMLImageElement>('img.custom-thumbnail');
        expect(Array.from(thumbnails).map((img) => img.alt)).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelectorAll(`.${prefixCls}-picture-file-card img`)).toHaveLength(2);
    });

    it('showReplace 属性', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'vigo.png',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/image.jpg',
                },
            ],
            showReplace: true,
        });
        expect(document.querySelector(`.${prefixCls}-file-card-replace`)).not.toBeNull();
    });

    it('itemStyle 属性', () => {
        renderUpload({
            defaultFileList,
            itemStyle: { backgroundColor: 'red' },
        });
        const cards = screen.getAllByRole('listitem');
        expect(cards).toHaveLength(2);
        cards.forEach((card) => expect(card).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' }));
    });

    it('picHeight 与 picWidth 属性', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList,
            picHeight: 100,
            picWidth: 100,
        });
        getPicCards().forEach((card) => expect(card).toHaveStyle({ width: '100px', height: '100px' }));
        expect(screen.getByAltText('vigo.png')).toHaveStyle({ width: '100px', height: '100px' });
        expect(document.querySelector(`.${prefixCls}-picture-add`)).toHaveStyle({ width: '100px', height: '100px' });
    });

    it('openFileDialog 方法', () => {
        const ref = createRef<UploadHandle>();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        render(<Upload ref={ref} action={action} />);
        act(() => ref.current?.openFileDialog());
        expect(inputClick).toHaveBeenCalledTimes(1);
        expect(inputClick.mock.contexts[0]).toBe(getInput());
    });

    it('listType picture', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList: [
                {
                    uid: '1',
                    name: 'vigo.png',
                    status: 'success',
                    size: '130KB',
                    preview: true,
                    url: 'https://example.com/image.jpg',
                },
            ],
        });
        expect(document.querySelector(`.${prefixCls}-picture-file-list`)).not.toBeNull();
        expect(getPicCards()).toHaveLength(1);
        expect(screen.getByAltText('vigo.png')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renderPicPreviewIcon 函数', () => {
        const renderPicPreviewIcon = () => <span className="custom-preview-icon">Preview</span>;
        renderUpload({
            listType: 'picture',
            defaultFileList,
            renderPicPreviewIcon,
        });
        const icons = document.querySelectorAll<HTMLElement>(`.${prefixCls}-picture-file-card-preview .custom-preview-icon`);
        expect(icons).toHaveLength(1);
        expect(screen.getByAltText('vigo.png').closest(`.${prefixCls}-picture-file-card`)).toContainElement(icons[0]);
    });

    it('renderPicInfo 函数', () => {
        const renderPicInfo = (file) => <span className="custom-pic-info">{file.name}</span>;
        renderUpload({
            listType: 'picture',
            defaultFileList,
            showPicInfo: true,
            renderPicInfo,
        });
        const infos = document.querySelectorAll('.custom-pic-info');
        expect(Array.from(infos).map((node) => node.textContent)).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelector(`.${prefixCls}-picture-file-card-pic-info`)).toBeNull();
    });

    it('promptPosition 为 end', () => {
        renderUpload({
            prompt: <span>Upload hint</span>,
            promptPosition: 'right',
        });
        expect(document.querySelector(`.${prefixCls}`)).toHaveAttribute('x-prompt-pos', 'right');
        expect(document.querySelector(`.${prefixCls}-prompt`)).toHaveTextContent('Upload hint');
    });

    it('validateStatus 为 error', () => {
        renderUpload({
            defaultFileList,
            validateStatus: 'error',
            validateMessage: 'Error message',
        });
        expect(document.querySelector(`.${prefixCls}-validate-message`)).toHaveTextContent(/^Error message$/);
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-error`);
    });

    it('file card 中的 showReplace 属性', async () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                },
            ],
            showReplace: true,
        });
        const replaceButton = document.querySelector(`.${prefixCls}-file-card-replace`);
        await userEvent.hover(replaceButton);
        expect(await screen.findByText('替换文件')).toBeInTheDocument();
    });

    it('onDragOver 事件', () => {
        renderUpload({ draggable: true });
        expect(fireEvent.dragOver(getDragArea(), { dataTransfer: { files: [] } })).toBe(false);
    });

    it('禁用上传时 onClick 不做任何操作', async () => {
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({ disabled: true, onOpenFileDialog });
        await userEvent.click(document.querySelector(`.${prefixCls}-add`));
        expect(inputClick).not.toHaveBeenCalled();
        expect(onOpenFileDialog).not.toHaveBeenCalled();
    });

    it('replace 方法', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                },
            ],
            showReplace: true,
            onChange,
        });
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-replace`));
        expect(inputClick.mock.contexts).toEqual([getReplaceInput()]);
        selectFiles([createFile(100, 'replaced.png')], getReplaceInput());
        expect(getCardNames()).toEqual(['replaced.png']);
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('replaced.png');
        expect(onChange.mock.calls[0][0].fileList.map((item) => item.name)).toEqual(['replaced.png']);
        expect(requests).toHaveLength(1);
    });

    it('clear 方法', async () => {
        const onClear = vi.fn<UploadCallback<'onClear'>>();
        renderUpload({ defaultFileList, onClear });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
        expect(document.querySelector(`.${prefixCls}-file-card`)).toBeNull();
    });

    it('insert 方法', () => {
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} defaultFileList={defaultFileList} />);
        act(() => ref.current?.insert([createFile(100, 'inserted.png')]));
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'inserted.png']);
    });

    it('listType 为未知值时返回 null', () => {
        renderUpload({
            listType: 'unknown',
            defaultFileList,
        });
        expect(document.querySelector(`.${prefixCls}-file-list`)).toBeNull();
        expect(screen.queryByText('vigo.png')).toBeNull();
        expect(document.querySelector(`.${prefixCls}-add`)).not.toBeNull();
    });

    it('_sizeInvalid 的文件显示 illegalSize 提示', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'validateFail',
                    size: '130KB',
                    _sizeInvalid: true,
                },
            ],
        });
        expect(getCard('test.jpg')).toHaveTextContent('文件尺寸不合法');
    });

    it('uploadFail 状态且无 validateMessage 的文件', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'uploadFail',
                    size: '130KB',
                },
            ],
        });
        expect(getCard('test.jpg')).toHaveTextContent('上传失败');
        expect(getCard('test.jpg')).toHaveClass(`${prefixCls}-file-card-fail`);
    });

    it('onChange 事件处理', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ onChange });
        selectFiles([createFile(100, 'changed.png')]);
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0].currentFile.name).toEqual('changed.png');
        expect(onChange.mock.calls[0][0].fileList.map((item) => item.name)).toEqual(['changed.png']);
    });

    it('listType 为 picture 时 renderAddContent 返回 null', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList,
        });
        const addTriggers = document.querySelectorAll<HTMLElement>(`.${prefixCls}-add`);
        expect(addTriggers).toHaveLength(1);
        expect(addTriggers[0]).toHaveClass(`${prefixCls}-picture-add`);
        expect(document.querySelector(`.${prefixCls}-file-list-main`)).toContainElement(addTriggers[0]);
    });

    it('showPicInfo 属性', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList,
            showPicInfo: true,
        });
        const infos = document.querySelectorAll(`.${prefixCls}-picture-file-card-pic-info`);
        expect(Array.from(infos).map((node) => node.textContent)).toEqual(['1', '2']);
    });

    it('renderPicClose 函数', () => {
        const renderPicClose = () => <span className="custom-close">X</span>;
        renderUpload({
            listType: 'picture',
            defaultFileList,
            renderPicClose,
        });
        expect(document.querySelectorAll('.custom-close')).toHaveLength(2);
        expect(document.querySelector(`div.${prefixCls}-picture-file-card-close`)).toBeNull();
    });

    it('renderFileOperation 函数', () => {
        const renderFileOperation = () => <span className="custom-operation">Op</span>;
        renderUpload({
            defaultFileList,
            renderFileOperation,
        });
        expect(document.querySelectorAll('.custom-operation')).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-file-card-close`)).toBeNull();
    });

    it('showTooltip 属性', () => {
        renderUpload({
            defaultFileList,
            showTooltip: true,
        });
        // The tooltip only appears once a name is truncated, which jsdom cannot measure; names render as ellipsis text
        document.querySelectorAll(`.${prefixCls}-file-card-info-name`).forEach((name) => expect(name).toHaveClass(`${BASE_CLASS_PREFIX}-typography-ellipsis-single-line`));
    });

    it('卸载后进行中的上传继续完成，照常上报进度与成功', () => {
        const onProgress = vi.fn<UploadCallback<'onProgress'>>();
        const onSuccess = vi.fn<UploadCallback<'onSuccess'>>();
        const { unmount } = renderUpload({ onProgress, onSuccess });
        selectFiles([createFile(100, 'pending.png')]);
        unmount();
        requests[0].uploadProgress({ loaded: 40, total: 100 });
        requests[0].respond(200, {}, '{"ok":true}');
        expect(requests[0].aborted).toBe(false);
        expect(onProgress).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('draggable 的 drop 事件', () => {
        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({
            draggable: true,
            onDrop,
            onFileChange,
        });
        const dragArea = getDragArea();
        const dropped = createFile(100, 'drop.png');
        fireEvent.dragEnter(dragArea);
        fireEvent.drop(dragArea, { dataTransfer: { files: [dropped] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onFileChange).toHaveBeenCalledWith([dropped]);
        expect(getCardNames()).toEqual(['drop.png']);
        expect(dragArea).not.toHaveClass(`${prefixCls}-drag-area-legal`);
    });

    it('draggable 的 dragLeave 事件', () => {
        renderUpload({ draggable: true });
        const dragArea = getDragArea();
        fireEvent.dragEnter(dragArea);
        fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefixCls}-drag-area-legal`);
    });

    it('draggable 的指针在拖拽区与其内部元素之间移动时保持 legal 状态，离开整个区域后才复位', () => {
        renderUpload({ draggable: true });
        const dragArea = getDragArea();
        const child = screen.getByText('点击上传');
        // the browser fires dragenter on the element entered before dragleave on the one left
        fireEvent.dragEnter(dragArea);
        fireEvent.dragEnter(child);
        fireEvent.dragLeave(dragArea);
        expect(dragArea).toHaveClass(`${prefixCls}-drag-area-legal`);
        fireEvent.dragEnter(dragArea);
        fireEvent.dragLeave(child);
        expect(dragArea).toHaveClass(`${prefixCls}-drag-area-legal`);
        fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefixCls}-drag-area-legal`);
    });

    it('draggable 的 drop 后重新计数，下一次拖入再离开时复位', () => {
        renderUpload({ draggable: true });
        const dragArea = getDragArea();
        fireEvent.dragEnter(dragArea);
        fireEvent.dragEnter(screen.getByText('点击上传'));
        fireEvent.drop(dragArea, { dataTransfer: { files: [] } });
        fireEvent.dragEnter(dragArea);
        fireEvent.dragLeave(dragArea);
        expect(dragArea).not.toHaveClass(`${prefixCls}-drag-area-legal`);
    });

    it('draggable 的 dragEnter 事件', () => {
        renderUpload({ draggable: true, children: null });
        expect(fireEvent.dragEnter(getDragArea())).toBe(false);
        expect(getDragArea()).toHaveClass(`${prefixCls}-drag-area-legal`);
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
        expect(card).toHaveClass(`${prefixCls}-picture-file-card-error`);
        expect(card.querySelector(`.${prefixCls}-picture-file-card-retry`)).not.toBeNull();
    });

    it('listType picture 与 showReplace', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                    url: 'https://example.com/image.jpg',
                },
            ],
            showReplace: true,
        });
        const card = getPicCards()[0];
        expect(card.querySelector(`.${prefixCls}-picture-file-card-replace`)).not.toBeNull();
        expect(card.querySelector(`.${prefixCls}-picture-file-card-preview`)).toBeNull();
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
        expect(card).toHaveClass(`${prefixCls}-file-card-fail`);
        expect(card).toHaveTextContent('File validation failed');
        expect(card.querySelector(`.${prefixCls}-file-card-icon-error`)).not.toBeNull();
        expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
    });

    it('validating 状态的文件', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'validating',
                    size: '130KB',
                    validateMessage: 'Validating...',
                },
            ],
        });
        const card = getCard('test.jpg');
        expect(card).toHaveTextContent('Validating...');
        expect(card.querySelector(`.${prefixCls}-file-card-icon-loading`)).not.toBeNull();
        expect(card.querySelector(`.${prefixCls}-file-card-icon-error`)).toBeNull();
        expect(card).not.toHaveClass(`${prefixCls}-file-card-fail`);
    });

    it('uploading 状态的文件显示进度', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'uploading',
                    size: '130KB',
                    percent: 50,
                },
            ],
        });
        expect(screen.getByRole('progressbar', { name: zh_CN.Upload.uploadProgress })).toHaveAttribute('aria-valuenow', '50');
    });

    it('hotSpotLocation 为 end', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList,
            hotSpotLocation: 'end',
        });
        const main = document.querySelector(`.${prefixCls}-file-list-main`);
        expect(main.lastElementChild).toHaveClass(`${prefixCls}-add`);
        expect(main.firstElementChild).toBe(screen.getByRole('list'));
    });

    it('hotSpotLocation 为 start', () => {
        renderUpload({
            listType: 'picture',
            defaultFileList,
            hotSpotLocation: 'start',
        });
        const main = document.querySelector(`.${prefixCls}-file-list-main`);
        expect(main.firstElementChild).toHaveClass(`${prefixCls}-add`);
        expect(main.lastElementChild).toBe(screen.getByRole('list'));
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('limit 为 1 时 showClear 不显示标题', () => {
        renderUpload({
            defaultFileList: [
                {
                    uid: '1',
                    name: 'test.jpg',
                    status: 'success',
                    size: '130KB',
                },
            ],
            showClear: true,
            limit: 1,
        });
        expect(document.querySelector(`.${prefixCls}-file-list-title`)).toBeNull();
        expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
        expect(getCardNames()).toEqual(['test.jpg']);
    });

    it('多文件时 showClear 显示标题', () => {
        renderUpload({
            defaultFileList,
            showClear: true,
            limit: 10,
        });
        expect(document.querySelector(`.${prefixCls}-file-list-title`)).toHaveTextContent('已选择文件');
        expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
    });

    it('listType 为 none 时不渲染文件列表', () => {
        renderUpload({
            listType: 'none',
            defaultFileList,
        });
        expect(document.querySelector(`.${prefixCls}-file-list`)).toBeNull();
        expect(screen.queryByText('vigo.png')).toBeNull();
        expect(document.querySelector(`.${prefixCls}-add`)).not.toBeNull();
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
        const preview = document.querySelector(`.${prefixCls}-file-card-preview`);
        expect(preview).not.toHaveClass(`${prefixCls}-file-card-preview-placeholder`);
        expect(preview.querySelector('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('带 onPreviewClick 回调的文件', async () => {
        const onPreviewClick = vi.fn<UploadCallback<'onPreviewClick'>>();
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
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-preview img`));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1' });
    });

    it('draggable 自定义 children', () => {
        renderUpload({
            draggable: true,
            children: <div className="custom-drag-content">Drop files here</div>,
        });
        const dragArea = getDragArea();
        expect(dragArea).toHaveClass(`${prefixCls}-drag-area-custom`);
        expect(dragArea.querySelector('.custom-drag-content')).toHaveTextContent('Drop files here');
        expect(screen.queryByText('点击上传文件或拖拽文件到这里')).toBeNull();
    });

    it('addOnPasting 属性', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        const { unmount } = renderUpload({ addOnPasting: true, onFileChange });
        const pasted = createFile(100, 'pasted.png');
        const paste = () =>
            fireEvent.paste(document.body, {
                clipboardData: { items: [{ kind: 'file', getAsFile: () => pasted }] },
            });
        expect(paste()).toBe(false);
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(onFileChange).toHaveBeenCalledWith([pasted]);
        expect(getCardNames()).toEqual(['pasted.png']);
        unmount();
        paste();
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });
});

describe('FileCard', () => {
    const listProps = {
        listType: 'list',
        name: 'test.jpg',
        size: '130KB',
        status: 'success',
    };
    const pictureProps = {
        listType: 'picture',
        name: 'test.jpg',
        size: '130KB',
        status: 'success',
        url: 'https://example.com/image.jpg',
    };
    const renderCard = (props) => render(<FileCard onRemove={() => {}} onRetry={() => {}} {...props} />);
    const getListCard = () => document.querySelector(`.${prefixCls}-file-card`);
    const getPicCard = () => document.querySelector(`.${prefixCls}-picture-file-card`);

    it('以 list 类型渲染 file card', () => {
        renderCard(listProps);
        expect(getListCard()).toHaveAttribute('role', 'listitem');
        expect(getListCard()).toHaveTextContent('test.jpg');
        expect(getListCard()).toHaveTextContent('130KB');
    });

    it('list 缩略图为装饰性元素，因为文件名已显示在旁边', () => {
        renderCard({ ...listProps, preview: true });
        expect(getListCard().querySelector('img')).toHaveAttribute('alt', '');
    });

    it('以 picture 类型渲染 picture card', () => {
        renderCard(pictureProps);
        expect(getPicCard()).not.toBeNull();
        expect(screen.getByAltText('test.jpg')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it.each([
        ['list', listProps, getListCard],
        ['picture', pictureProps, getPicCard],
    ])('%s card 仅将 data-* 与 aria-* 透传到根元素', (_, cardProps, getCard) => {
        renderCard({
            ...cardProps,
            'data-testid': 'card',
            'aria-label': 'file card',
            response: { ok: true },
            fileInstance: new File(['a'], 'a.txt'),
        });
        const card = getCard();
        expect(card).toHaveAttribute('data-testid', 'card');
        expect(card).toHaveAttribute('aria-label', 'file card');
        expect(card.hasAttribute('response')).toBe(false);
        expect(card.hasAttribute('fileinstance')).toBe(false);
    });

    it('类型：cropModalProps 不含由组件内置的属性', () => {
        expectTypeOf<Extract<keyof NonNullable<UploadProps['cropModalProps']>, 'visible' | 'title' | 'okText' | 'cancelText' | 'onOk' | 'onCancel'>>().toBeNever();
        expectTypeOf<NonNullable<UploadProps['cropModalProps']>>().toHaveProperty('width');
    });

    it('FileItem 拼错的字段会报类型错误，卡片渲染回调的字段都有声明', () => {
        expectTypeOf<FileItem>().not.toHaveProperty('urll');
        expectTypeOf<RenderFileItemProps['renderThumbnail']>().toEqualTypeOf<UploadProps['renderThumbnail']>();
        expectTypeOf<RenderFileItemProps['renderPicClose']>().toEqualTypeOf<UploadProps['renderPicClose']>();
        expectTypeOf<RenderFileItemProps['showTooltip']>().toEqualTypeOf<UploadProps['showTooltip']>();
        expectTypeOf<RenderFileItemProps>().not.toHaveProperty('key');
        expectTypeOf<Parameters<UploadCallback<'renderFileItem'>>[0]['key']>().toEqualTypeOf<string>();
    });

    it('未知 listType 时返回 null', () => {
        const { container } = renderCard({ ...listProps, listType: 'unknown' });
        expect(container).toBeEmptyDOMElement();
    });

    it('点击关闭按钮时调用 onRemove', async () => {
        const onRemove = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...listProps, onRemove, onPreviewClick });
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-close`));
        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });

    it('点击重试按钮时调用 onRetry', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...listProps, status: 'uploadFail', showRetry: true, onRetry });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('picture card 点击关闭按钮时调用 onRemove', async () => {
        const onRemove = vi.fn<() => void>();
        renderCard({ ...pictureProps, onRemove });
        await userEvent.click(document.querySelector(`.${prefixCls}-picture-file-card-close`));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('picture card 点击重试按钮时调用 onRetry', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...pictureProps, status: 'uploadFail', showRetry: true, onRetry });
        await userEvent.click(document.querySelector(`.${prefixCls}-picture-file-card-retry`));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('validateMessage 为 React 元素时的 file card', () => {
        renderCard({
            ...listProps,
            status: 'validateFail',
            validateMessage: <span className="custom-msg">Error</span>,
        });
        const message = document.querySelector(`.${prefixCls}-file-card-info-validate-message`);
        expect(message.querySelector('.custom-msg')).toHaveTextContent('Error');
        expect(message.querySelector(`.${prefixCls}-file-card-icon-error`)).toBeNull();
    });

    it('数值 size 的 file card', () => {
        renderCard({ ...listProps, size: 1024 });
        expect(document.querySelector(`.${prefixCls}-file-card-info-size`)).toHaveTextContent(/^1\.0KB$/);
    });

    it('带 style 属性的 file card', () => {
        renderCard({ ...listProps, style: { width: '100%' } });
        expect(getListCard()).toHaveStyle({ width: '100%' });
    });

    it('带 renderThumbnail 的 picture card', () => {
        const renderThumbnail = (props) => <img className="custom-thumbnail" alt={props.name} src={props.url} />;
        renderCard({ ...pictureProps, picWidth: 100, picHeight: 100, renderThumbnail });
        expect(screen.getByAltText('test.jpg')).toHaveClass('custom-thumbnail');
        expect(getPicCard()).toHaveClass(`${prefixCls}-picture-file-card-custom-thumbnail`);
    });

    it('带 renderPicClose 的 picture card', () => {
        const renderPicClose = ({ className, remove }) => (
            <button type="button" className={className} onClick={remove}>
                X
            </button>
        );
        renderCard({ ...pictureProps, renderPicClose });
        const close = document.querySelector(`.${prefixCls}-picture-file-card-close`);
        expect(close.tagName).toEqual('BUTTON');
        expect(close).toHaveTextContent('X');
    });

    it('带 disabled 属性的 file card', () => {
        renderCard({ ...listProps, disabled: true });
        expect(getListCard()).toHaveTextContent('test.jpg');
        expect(document.querySelector(`.${prefixCls}-file-card-close`)).toBeNull();
    });

    it('带 disabled 属性的 picture card', () => {
        renderCard({ ...pictureProps, disabled: true });
        expect(getPicCard()).toHaveClass(`${prefixCls}-picture-file-card-disabled`);
        expect(document.querySelector(`.${prefixCls}-picture-file-card-close`)).toBeNull();
    });

    it('validating 状态且带 validateMessage 的 picture card', async () => {
        renderCard({ ...pictureProps, status: 'validating', validateMessage: 'Validating...' });
        const loading = document.querySelector(`.${prefixCls}-picture-file-card-icon-loading`);
        expect(loading).not.toBeNull();
        await userEvent.hover(loading);
        expect(await screen.findByText('Validating...')).toBeInTheDocument();
    });

    it('validateFail 状态且带 validateMessage 的 picture card', () => {
        renderCard({ ...pictureProps, status: 'validateFail', validateMessage: 'Validation failed' });
        expect(document.querySelector(`.${prefixCls}-picture-file-card-icon-error`)).not.toBeNull();
        expect(getPicCard()).not.toHaveClass(`${prefixCls}-picture-file-card-error`);
    });

    it('uploadFail 状态且带 validateMessage 的 picture card', () => {
        renderCard({ ...pictureProps, status: 'uploadFail', validateMessage: 'Upload failed' });
        expect(document.querySelector(`.${prefixCls}-picture-file-card-icon-error`)).not.toBeNull();
        expect(getPicCard()).toHaveClass(`${prefixCls}-picture-file-card-error`);
    });

    it('uploading 状态的 picture card', () => {
        renderCard({ ...pictureProps, status: 'uploading', percent: 50 });
        expect(getPicCard()).toHaveClass(`${prefixCls}-picture-file-card-uploading`);
        expect(screen.getByRole('progressbar', { name: zh_CN.Upload.uploadProgress })).toHaveAttribute('aria-valuenow', '50');
    });

    it('带兜底预览的 picture card', () => {
        renderCard(pictureProps);
        fireEvent.error(screen.getByAltText('test.jpg'));
        expect(getPicCard()).toHaveClass(`${prefixCls}-picture-file-card-preview-fallback`);
        expect(screen.queryByAltText('test.jpg')).toBeNull();
        expect(getPicCard().querySelector(`.${BASE_CLASS_PREFIX}-icon-file`)).not.toBeNull();
    });

    it.each([
        ['list', listProps, getListCard],
        ['picture', pictureProps, getPicCard],
    ])('%s card 的缩略图加载失败后，url 更新时恢复显示图片', (_, cardProps, getCard) => {
        const first = 'https://example.com/first.jpg';
        const second = 'https://example.com/second.jpg';
        const props = { ...cardProps, preview: true };
        const { rerender } = renderCard({ ...props, url: first });
        fireEvent.error(getCard().querySelector('img'));
        expect(getCard().querySelector('img')).toBeNull();
        rerender(<FileCard {...(props as FileCardProps)} url={second} />);
        expect(getCard().querySelector('img')).toHaveAttribute('src', second);
    });

    it('带 preview 与 url 的 file card', () => {
        renderCard({ ...listProps, preview: true, url: 'https://example.com/image.jpg' });
        expect(getListCard().querySelector('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
        expect(document.querySelector(`.${prefixCls}-file-card-preview`)).not.toHaveClass(`${prefixCls}-file-card-preview-placeholder`);
    });

    it('带 preview 但无 url 的 file card', () => {
        renderCard({ ...listProps, preview: true });
        expect(getListCard().querySelector('img')).not.toHaveAttribute('src');
    });

    it('自定义 renderPicClose 函数', async () => {
        const onRemove = vi.fn<() => void>();
        const renderPicClose = ({ className, remove }) => (
            <button type="button" className={className} onClick={remove}>
                Custom Close
            </button>
        );
        renderCard({ ...pictureProps, renderPicClose, onRemove });
        await userEvent.click(screen.getByText('Custom Close'));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('未传 onRemove 与 onRetry 的 file card 使用默认函数', async () => {
        const bareProps: FileCardProps = {
            uid: '1',
            name: 'test.jpg',
            size: '130KB',
            status: 'uploadFail',
            showRetry: true,
        };
        render(<FileCard {...bareProps} />);
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-close`));
        expect(getListCard()).toHaveTextContent('test.jpg');
    });

    it('file card list 类型的替换按钮 onClick 触发 onReplace', async () => {
        const onReplace = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...listProps, showReplace: true, onReplace, onPreviewClick });
        const replaceButton = document.querySelector(`.${prefixCls}-file-card-replace`);
        await userEvent.hover(replaceButton);
        expect(await screen.findByText('替换文件')).toBeInTheDocument();
        await userEvent.click(replaceButton);
        expect(onReplace).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });

    it.each([
        ['retry', '重试', { status: 'uploadFail', showRetry: true }, 'onRetry'],
        ['replace', '替换文件', { showReplace: true }, 'onReplace'],
        ['remove', '移除文件', {}, 'onRemove'],
    ])('picture card 的 %s 控件为原生按钮，Enter 可激活', async (_, name, extra, handler) => {
        const callback = vi.fn<() => void>();
        renderCard({ ...pictureProps, ...extra, [handler]: callback });
        const button = screen.getByRole('button', { name });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        act(() => button.focus());
        await userEvent.keyboard('{Enter}');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('list card 的重试控件为原生按钮，Enter 可激活', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...listProps, status: 'uploadFail', showRetry: true, onRetry });
        const button = screen.getByRole('button', { name: '重试' });
        expect(button.tagName).toBe('BUTTON');
        act(() => button.focus());
        await userEvent.keyboard('{Enter}');
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['picture', pictureProps],
        ['list', listProps],
    ])('%s card 可通过键盘在带名称的按钮上打开预览', async (_, cardProps) => {
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...cardProps, onPreviewClick });
        const button = screen.getByRole('button', { name: '预览' });
        act(() => button.focus());
        await userEvent.keyboard('{Enter}');
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
    });

    it('未传 onPreviewClick 的 card 没有预览按钮', () => {
        renderCard(pictureProps);
        expect(screen.queryByRole('button', { name: '预览' })).toBeNull();
    });

    it('picture file card 的 showReplace 触发 onReplace', async () => {
        const onReplace = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...pictureProps, showReplace: true, onReplace, onPreviewClick });
        await userEvent.click(document.querySelector(`.${prefixCls}-picture-file-card-replace`));
        expect(onReplace).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });
});

describe('Upload 补充覆盖', () => {
    // Clipboard reads go through navigator.clipboard / navigator.permissions, which jsdom does not provide
    function stubClipboard({ read = vi.fn<Clipboard['read']>(() => Promise.resolve([])), query }: { read?: Clipboard['read']; query?: Permissions['query'] } = {}) {
        Object.defineProperty(navigator, 'clipboard', { value: { read }, configurable: true });
        Object.defineProperty(navigator, 'permissions', { value: { query }, configurable: true });
        return { read };
    }

    afterEach(() => {
        Reflect.deleteProperty(navigator, 'clipboard');
        Reflect.deleteProperty(navigator, 'permissions');
    });

    it('beforeClear 默认返回 true', async () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ defaultFileList, onChange });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith({ fileList: [] }));
        expect(document.querySelector(`.${prefixCls}-file-card`)).toBeNull();
    });

    it('resetReplaceInput 更新 replaceInputKey', async () => {
        // input keys come from Math.random, which vitest/setup.ts cycles through four values; keep them distinct here
        let seed = 0;
        vi.spyOn(Math, 'random').mockImplementation(() => (seed += 0.01));
        renderUpload({ defaultFileList, showReplace: true });
        const replaceInputBefore = getReplaceInput();
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-replace`));
        selectFiles([createFile(100, 'replaced.png')], replaceInputBefore);
        expect(getReplaceInput()).not.toBe(replaceInputBefore);
        expect(getCardNames()).toEqual(['replaced.png', 'test.jpeg']);
    });

    it('仅按下 Ctrl/Cmd+V 时不读取异步剪贴板', async () => {
        const { read } = stubClipboard({
            query: vi.fn<Permissions['query']>(() => Promise.resolve({ state: 'granted' } as PermissionStatus)),
        });
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ defaultFileList, addOnPasting: true, onFileChange });
        fireEvent.keyDown(document.body, { code: 'KeyV', ctrlKey: true });
        fireEvent.keyDown(document.body, { code: 'KeyV', metaKey: true });
        await Promise.resolve();
        expect(read).not.toHaveBeenCalled();
        expect(onFileChange).not.toHaveBeenCalled();
    });

    it('粘贴的文件无法读取时 onPastingError 接收错误', () => {
        const onPastingError = vi.fn<UploadCallback<'onPastingError'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ defaultFileList, addOnPasting: true, onPastingError, onFileChange });
        const readable = createFile(100, 'ok.png');
        const failure = new Error('denied');
        fireEvent.paste(document.body, {
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
        expectTypeOf<Parameters<UploadCallback<'onPastingError'>>[0]>().toEqualTypeOf<Error>();
        expect(onFileChange).toHaveBeenCalledWith([readable]);
    });

    it('粘贴成功或仅含文本时不调用 onPastingError', () => {
        const onPastingError = vi.fn<UploadCallback<'onPastingError'>>();
        renderUpload({ defaultFileList, addOnPasting: true, onPastingError });
        fireEvent.paste(document.body, {
            clipboardData: { items: [{ kind: 'string', getAsFile: () => null }] },
        });
        fireEvent.paste(document.body, {
            clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, 'ok.png') }] },
        });
        expect(onPastingError).not.toHaveBeenCalled();
    });

    it('notifyDrop 调用 onDrop', () => {
        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        renderUpload({
            defaultFileList,
            draggable: true,
            onDrop,
        });
        const dropped = createFile(100, 'dropped.png');
        fireEvent.drop(getDragArea(), { dataTransfer: { files: [dropped] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        const [, files, fileList] = onDrop.mock.calls[0];
        expect(files).toEqual([dropped]);
        expect(fileList.map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg']);
    });

    it.each([false, true])('onDrop 的首参是原生 drop 事件（directory=%s）', async (directory) => {
        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        renderUpload({ draggable: true, directory, onDrop });
        const area = getDragArea();
        const event = createEvent.drop(area, { dataTransfer: { files: [], items: [] } });
        fireEvent(area, event);
        await waitFor(() => expect(onDrop).toHaveBeenCalledTimes(1));
        expect(onDrop.mock.calls[0][0]).toBe(event);
        expect(onDrop.mock.calls[0][0]).not.toHaveProperty('nativeEvent');
    });

    it('onDrop 的首参类型是原生 DragEvent', () => {
        expectTypeOf<Parameters<UploadCallback<'onDrop'>>[0]>().toEqualTypeOf<DragEvent>();
    });

    it('onPreviewClick 为 undefined 时不渲染预览图标', () => {
        renderUpload({
            defaultFileList,
            listType: 'picture',
            onPreviewClick: undefined,
        });
        expect(getPicCards()).toHaveLength(2);
        getPicCards().forEach((card) => expect(card).not.toHaveClass(`${prefixCls}-picture-file-card-show-pointer`));
    });

    it('picture listType 的 draggable 分配 draggableProps', () => {
        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        renderUpload({
            defaultFileList,
            listType: 'picture',
            draggable: true,
            onDrop,
        });
        const add = document.querySelector(`.${prefixCls}-picture-add`);
        fireEvent.dragEnter(add);
        expect(add).toHaveClass(`${prefixCls}-drag-area-legal`);
        fireEvent.drop(add, { dataTransfer: { files: [createFile(100, 'dropped.png')] } });
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(getPicCards()).toHaveLength(3);
    });

    it('onDrop 处理函数调用 foundation.handleDrop', () => {
        const onDrop = vi.fn<UploadCallback<'onDrop'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({
            defaultFileList,
            draggable: true,
            onDrop,
            onFileChange,
        });
        expect(fireEvent.drop(getDragArea(), { dataTransfer: { files: [] } })).toBe(false);
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop.mock.calls[0][1]).toEqual([]);
        expect(onFileChange).toHaveBeenCalledWith([]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('notifyAcceptInvalid 调用 onAcceptInvalid', () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({
            defaultFileList,
            accept: '.png',
            onAcceptInvalid,
        });
        const pdf = createFile(100, 'doc.pdf', 'application/pdf');
        selectFiles([pdf, createFile(100, 'ok.png')]);
        expect(onAcceptInvalid).toHaveBeenCalledWith([pdf]);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg', 'ok.png']);
    });

    it('notifyBeforeRemove 调用 beforeRemove', async () => {
        const beforeRemove = vi.fn<UploadCallback<'beforeRemove'>>(() => true);
        renderUpload({
            defaultFileList,
            beforeRemove,
        });
        await userEvent.click(getCard('vigo.png').querySelector(`.${prefixCls}-file-card-close`));
        expect(beforeRemove).toHaveBeenCalledTimes(1);
        const [fileItem, fileList] = beforeRemove.mock.calls[0];
        expect(fileItem).toMatchObject({ uid: '1' });
        expect(fileList.map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(getCardNames()).toEqual(['test.jpeg']));
    });

    it('notifyBeforeClear 调用 beforeClear', async () => {
        const beforeClear = vi.fn<UploadCallback<'beforeClear'>>(() => true);
        renderUpload({
            defaultFileList,
            beforeClear,
        });
        await userEvent.click(screen.getByRole('button', { name: '清空' }));
        expect(beforeClear).toHaveBeenCalledTimes(1);
        expect(beforeClear.mock.calls[0][0].map((item) => item.uid)).toEqual(['1', '2']);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-file-card`)).toBeNull());
    });

    it('openFileDialog 方法调用 onClick', () => {
        const ref = createRef<UploadHandle>();
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        render(<Upload ref={ref} action={action} defaultFileList={defaultFileList} onOpenFileDialog={onOpenFileDialog} />);
        act(() => ref.current?.openFileDialog());
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
    });

    it('renderFile 中的 onReplace 回调调用 replace', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        renderUpload({
            defaultFileList,
            showReplace: true,
            listType: 'list',
        });
        const replaceButtons = document.querySelectorAll(`.${prefixCls}-file-card-replace`);
        expect(replaceButtons).toHaveLength(1);
        await userEvent.click(replaceButtons[0]);
        expect(inputClick.mock.contexts).toEqual([getReplaceInput()]);
    });

    it('renderFile 中的 onPreviewClick 回调调用 handlePreviewClick', async () => {
        const onPreviewClick = vi.fn<UploadCallback<'onPreviewClick'>>();
        renderUpload({
            defaultFileList,
            listType: 'picture',
            onPreviewClick,
        });
        await userEvent.click(document.querySelector(`.${prefixCls}-picture-file-card-preview`));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0]).toMatchObject({ uid: '1', name: 'vigo.png' });
    });

    it('满足条件时 renderFileListPic 返回 null', () => {
        renderUpload({
            defaultFileList,
            listType: 'picture',
            showUploadList: false,
            limit: 2,
        });
        expect(document.querySelector(`.${prefixCls}-picture-file-list`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-add`)).toBeNull();
    });

    it('picture listType 下 fileList 为空且 showUploadList 为 false 时返回 null', () => {
        renderUpload({
            fileList: [],
            listType: 'picture',
            showUploadList: false,
        });
        expect(document.querySelector(`.${prefixCls}-picture-file-list`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-picture-add`)).not.toBeNull();
    });

    it('picture listType 下 showUploadList 与 showAddTriggerInList 均为 false 时，renderFileListPic 返回 null', () => {
        renderUpload({
            defaultFileList: [defaultFileList[0]],
            listType: 'picture',
            showUploadList: false,
            limit: 1,
        });
        expect(document.querySelector(`.${prefixCls}-picture-file-list`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-add`)).toBeNull();
        expect(getPicCards()).toHaveLength(0);
    });
});

describe('Upload 生命周期与属性', () => {
    const pasteFile = (name) =>
        fireEvent.paste(document.body, {
            clipboardData: { items: [{ kind: 'file', getAsFile: () => createFile(100, name) }] },
        });

    it('将 data-* 属性透传到根元素', () => {
        const { container } = renderUpload({ 'data-testid': 'upload-root' });
        expect(container.firstChild).toHaveClass(prefixCls);
        expect(container.firstChild).toHaveAttribute('data-testid', 'upload-root');
    });

    it('读取 semiGlobal overrideDefaultProps 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Upload: { showClear: false } };
        try {
            const { unmount } = renderUpload({ defaultFileList });
            expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
            unmount();
            renderUpload({ defaultFileList, showClear: true });
            expect(screen.getByRole('button', { name: '清空' })).toBeInTheDocument();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('父组件不更新的受控 fileList 始终作为每次选择的基础', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ fileList: defaultFileList, onChange, uploadTrigger: 'custom' });
        selectFiles([createFile(100, 'first.png')]);
        selectFiles([createFile(100, 'second.png')]);
        expect(lastFileList(onChange).map((item) => item.name)).toEqual(['vigo.png', 'test.jpeg', 'second.png']);
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('父组件回写的受控 fileList 跟随整个上传过程', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        function Demo() {
            const [fileList, setFileList] = useState([]);
            return (
                <Upload
                    action={action}
                    fileList={fileList}
                    onChange={(change) => {
                        onChange(change);
                        setFileList(change.fileList);
                    }}
                />
            );
        }
        render(<Demo />);
        selectFiles([createFile(100, 'a.png')]);
        expect(getCardNames()).toEqual(['a.png']);
        expect(requests).toHaveLength(1);
        requests[0].uploadProgress({ loaded: 80, total: 100 });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(80 * PROGRESS_COEFFICIENT));
        requests[0].respond(200, {}, '{"ok":true}');
        expect(lastFileList(onChange)[0]).toMatchObject({ name: 'a.png', status: 'success', response: { ok: true } });
        expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('StrictMode 下上传、上报与粘贴各执行一次', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        const { unmount } = render(
            <StrictMode>
                <Upload action={action} addOnPasting onChange={onChange} onFileChange={onFileChange} />
            </StrictMode>
        );
        selectFiles([createFile(100, 'strict.png')]);
        expect(requests).toHaveLength(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        pasteFile('pasted.png');
        expect(onFileChange).toHaveBeenCalledTimes(2);
        expect(requests).toHaveLength(2);
        unmount();
        pasteFile('late.png');
        expect(onFileChange).toHaveBeenCalledTimes(2);
    });

    it('禁用的列表隐藏其文件的删除按钮', () => {
        renderUpload({ defaultFileList, disabled: true });
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelector(`.${prefixCls}-file-card-close`)).toBeNull();
    });

    it('customRequest 替代内置请求，且不创建 XMLHttpRequest', async () => {
        const customRequest = vi.fn<UploadCallback<'customRequest'>>(({ onSuccess }) => {
            setTimeout(() => {
                onSuccess({ url: 'https://example.com/file.jpg' });
            }, 100);
        });
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ customRequest, onChange });
        const selected = createFile(100, 'custom.png');
        selectFiles([selected]);
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

    it('重试缺少 File 对象的文件时调用 onRetry 且不发送请求', async () => {
        const onRetry = vi.fn<UploadCallback<'onRetry'>>();
        renderUpload({ defaultFileList, onRetry });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
    });

    it('挂载后开启 addOnPasting 时可接收粘贴', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        const { rerender } = render(<Upload action={action} onFileChange={onFileChange} />);
        rerender(<Upload action={action} addOnPasting onFileChange={onFileChange} />);
        pasteFile('later.png');
        expect(onFileChange).toHaveBeenCalledTimes(1);
    });

    it('禁用后忽略粘贴，卸载时移除粘贴监听', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        const { rerender, unmount } = render(<Upload action={action} addOnPasting onFileChange={onFileChange} />);
        rerender(<Upload disabled action={action} addOnPasting onFileChange={onFileChange} />);
        pasteFile('disabled.png');
        unmount();
        pasteFile('late.png');
        expect(onFileChange).not.toHaveBeenCalled();
    });
});

describe('Upload 审计修复', () => {
    it('beforeUpload 同步返回的对象缺省 shouldUpload 时照常上传', () => {
        renderUpload({ beforeUpload: () => ({ validateMessage: 'checked' }) });
        selectFiles([createFile(10, 'a.png')]);
        expect(requests).toHaveLength(1);
    });

    const cloneFile = (f: File) => new File([f], f.name, { type: f.type });

    it('onExceed 在选择文件与 insert 两条路径都收到截断前的全部文件', () => {
        const onExceed = vi.fn<UploadCallback<'onExceed'>>();
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} limit={2} onExceed={onExceed} />);
        selectFiles([createFile(10, 'a'), createFile(10, 'b'), createFile(10, 'c')]);
        expect(onExceed.mock.calls[0][0].map((f) => f.name)).toEqual(['a', 'b', 'c']);
        act(() => ref.current?.insert([createFile(10, 'd'), createFile(10, 'e')]));
        expect(onExceed.mock.calls[1][0].map((f) => f.name)).toEqual(['d', 'e']);
    });

    it('limit 为 1 时选择文件与 insert 都不调用 onExceed', () => {
        const onExceed = vi.fn<UploadCallback<'onExceed'>>();
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} limit={1} onExceed={onExceed} />);
        selectFiles([createFile(10, 'a'), createFile(10, 'b')]);
        act(() => ref.current?.insert([createFile(10, 'c'), createFile(10, 'd')]));
        expect(onExceed).not.toHaveBeenCalled();
    });

    it('insert 配合返回新 File 的 transformFile 时文件项有唯一 uid', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} transformFile={cloneFile} onChange={onChange} />);
        act(() => ref.current?.insert([createFile(10, 'a.png'), createFile(10, 'b.png')]));
        const uids = lastFileList(onChange).map((item) => item.uid);
        expect(uids.every(Boolean)).toBe(true);
        expect(new Set(uids).size).toBe(2);
    });

    it('insert 的超限文件被标记为校验失败且不上传', () => {
        const ref = createRef<UploadHandle>();
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        render(<Upload ref={ref} action={action} maxSize={1} transformFile={cloneFile} onChange={onChange} />);
        act(() => ref.current?.insert([createFile(4096, 'big.png')]));
        expect(lastFileList(onChange)[0].status).toBe('validateFail');
        expect(requests).toHaveLength(0);
    });

    it('异步 beforeRemove 期间其他文件的状态变化不被旧快照覆盖', async () => {
        let release: (value: boolean) => void;
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({
            beforeRemove: () => new Promise<boolean>((resolve) => (release = resolve)),
            onChange,
        });
        selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png')]);
        await userEvent.click(document.querySelectorAll(`.${prefixCls}-file-card-close`)[0]);
        requests[1].respond(200, {}, '{}');
        release(true);
        await waitFor(() => expect(lastFileList(onChange).map((item) => item.name)).toEqual(['b.png']));
        expect(lastFileList(onChange)[0].status).toBe('success');
    });

    it('beforeRemove 被拒绝时视为取消，不产生未处理的 rejection', async () => {
        const onRemove = vi.fn<UploadCallback<'onRemove'>>();
        renderUpload({ beforeRemove: () => Promise.reject(new Error('no')), onRemove });
        selectFiles([createFile(10, 'a.png')]);
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-close`));
        await act(() => Promise.resolve());
        expect(onRemove).not.toHaveBeenCalled();
        expect(getCardNames()).toEqual(['a.png']);
    });

    it('accept 的扩展名接受大写文件名', () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({ accept: '.png', onAcceptInvalid });
        selectFiles([createFile(10, 'PHOTO.PNG', '')]);
        expect(onAcceptInvalid).not.toHaveBeenCalled();
        expect(requests).toHaveLength(1);
    });

    it('accept 的扩展名不接受仅以相同字母结尾的文件名', () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({ accept: '.png', onAcceptInvalid });
        selectFiles([createFile(10, 'notpng', '')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(0);
    });

    it('beforeUpload 返回 null 时不抛错', () => {
        renderUpload({ beforeUpload: () => null });
        expect(() => selectFiles([createFile(10, 'a.png')])).not.toThrow();
    });

    describe('disabled', () => {
        const items = [
            { uid: '1', name: 'bad.png', status: 'uploadFail', size: '1KB', url: 'https://example.com/a.png' },
            { uid: '2', name: 'ok.png', status: 'success', size: '1KB', url: 'https://example.com/b.png' },
        ];

        it.each(['list', 'picture'])('%s 模式不渲染重试与替换按钮', (listType) => {
            renderUpload({ disabled: true, fileList: items, listType, showRetry: true, showReplace: true });
            expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
            expect(screen.queryByRole('button', { name: '替换文件' })).toBeNull();
        });

        it('自定义渲染拿到的 onRetry 与 onReplace 也不生效', () => {
            const handles: Record<string, () => void> = {};
            const fileInstance = createFile(10, 'bad.png');
            renderUpload({
                disabled: true,
                fileList: [{ ...items[0], fileInstance }],
                renderFileItem: (props: RenderFileItemProps) => {
                    Object.assign(handles, props);
                    return <span>custom</span>;
                },
            });
            const click = vi.spyOn(getReplaceInput(), 'click');
            act(() => {
                handles.onRetry();
                handles.onReplace();
            });
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

    it('一次选择多个文件只触发一次 onChange，并带上全部新增项', () => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ onChange });
        selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [{ fileList, currentFile }] = onChange.mock.calls[0];
        expect(fileList.map((item) => item.name)).toEqual(['a.png', 'b.png', 'c.png']);
        expect(currentFile.name).toBe('c.png');
    });

    it.each(['image/svg+xml', 'image/avif'])('%s 文件在列表中显示缩略图', (type) => {
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        renderUpload({ onChange });
        selectFiles([createFile(10, 'a.img', type)]);
        expect(lastFileList(onChange)[0].preview).toBe(true);
    });

    it('所有文件被 accept 拒绝后重置选择框，再选同一文件仍会触发 onAcceptInvalid', () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({ accept: '.png', onAcceptInvalid });
        const before = getInput();
        selectFiles([createFile(10, 'a.jpg', 'image/jpeg')]);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getInput()).not.toBe(before);
    });

    it('替换的文件被 accept 拒绝后重置替换选择框', async () => {
        const onAcceptInvalid = vi.fn<UploadCallback<'onAcceptInvalid'>>();
        renderUpload({ accept: '.png', showReplace: true, defaultFileList: items(1), onAcceptInvalid });
        await userEvent.click(document.querySelector(`.${prefixCls}-file-card-replace`));
        const before = getReplaceInput();
        selectFiles([createFile(10, 'a.jpg', 'image/jpeg')], before);
        expect(onAcceptInvalid).toHaveBeenCalledTimes(1);
        expect(getReplaceInput()).not.toBe(before);
    });

    it('已有文件数超过 limit 时，选择与 insert 都不再追加文件', () => {
        const onExceed = vi.fn<UploadCallback<'onExceed'>>();
        const ref = createRef<UploadHandle>();
        render(<Upload ref={ref} action={action} defaultFileList={items(3)} limit={2} onExceed={onExceed} />);
        selectFiles([createFile(10, 'a.png'), createFile(10, 'b.png'), createFile(10, 'c.png')]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
        act(() => ref.current?.insert([createFile(10, 'e.png'), createFile(10, 'f.png')]));
        expect(onExceed).toHaveBeenCalledTimes(2);
        expect(getCardNames()).toEqual(['d0.png', 'd1.png', 'd2.png']);
    });
});

describe('Upload React 侧修复', () => {
    it('cropModalProps.width 覆盖裁剪弹窗的默认宽度', async () => {
        installFakeXhr();
        render(
            <Upload action={action} crop cropModalProps={{ motion: false, width: 800 }}>
                <Button>upload</Button>
            </Upload>
        );
        selectFiles([createFile(10, 'a.png')]);
        const dialog = await screen.findByRole('dialog');
        expect((dialog.closest(`.${BASE_CLASS_PREFIX}-modal`) as HTMLElement).style.width).toBe('800px');
    });

    it('不传 cropModalProps.width 时裁剪弹窗宽 600px', async () => {
        installFakeXhr();
        render(
            <Upload action={action} crop cropModalProps={{ motion: false }}>
                <Button>upload</Button>
            </Upload>
        );
        selectFiles([createFile(10, 'a.png')]);
        const dialog = await screen.findByRole('dialog');
        expect((dialog.closest(`.${BASE_CLASS_PREFIX}-modal`) as HTMLElement).style.width).toBe('600px');
    });

    it('children 里禁用的 Button 仍是使用方的控件：添加区域不成为按钮，移除按钮可用，恢复后不变', async () => {
        // lets the MutationObserver callback and the state update it makes run inside act before a negative assertion
        const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        const onRemove = vi.fn<UploadCallback<'onRemove'>>();
        const view = (disabled: boolean) => (
            <Upload action={action} defaultFileList={defaultFileList} onOpenFileDialog={onOpenFileDialog} onRemove={onRemove}>
                <Button disabled={disabled}>点击上传</Button>
            </Upload>
        );
        const { container, rerender } = render(view(true));
        await settle();
        const area = container.querySelector(`.${prefixCls}-add`);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        fireEvent.keyDown(area, { key: 'Enter' });
        expect(onOpenFileDialog).not.toHaveBeenCalled();
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Upload.remove })[0]);
        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));

        rerender(view(false));
        await settle();
        expect(area).not.toHaveAttribute('role');
        await userEvent.click(screen.getByRole('button', { name: '点击上传' }));
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);

        rerender(view(true));
        await settle();
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
    });

    it('children 里 aria-disabled 的使用方控件仍是已有控件，aria-disabled 由 false 变 true 后添加区域不成为按钮', async () => {
        const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        const onOpenFileDialog = vi.fn<UploadCallback<'onOpenFileDialog'>>();
        // the control leaves the Tab order while disabled, so only its aria-disabled marks it as a control
        const view = (disabled: boolean) => (
            <Upload action={action} onOpenFileDialog={onOpenFileDialog}>
                <button type="button" aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}>
                    自定义上传
                </button>
            </Upload>
        );
        const { container, rerender } = render(view(true));
        await settle();
        const area = container.querySelector(`.${prefixCls}-add`);
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
        fireEvent.keyDown(area, { key: 'Enter' });
        expect(onOpenFileDialog).not.toHaveBeenCalled();

        rerender(view(false));
        await settle();
        expect(area).not.toHaveAttribute('role');
        rerender(view(true));
        await settle();
        expect(area).not.toHaveAttribute('role');
        expect(area).not.toHaveAttribute('tabindex');
    });

    it('children 里 tabindex 为 -1 的按钮只在 aria-disabled 变为 true 时被识别为已有控件', async () => {
        const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        const { container } = render(
            <Upload action={action}>
                <button type="button" tabIndex={-1}>
                    自定义上传
                </button>
            </Upload>
        );
        await settle();
        const area = container.querySelector(`.${prefixCls}-add`);
        expect(area).toHaveAttribute('role', 'button');

        const control = screen.getByText('自定义上传');
        control.setAttribute('aria-disabled', 'true');
        await settle();
        expect(area).not.toHaveAttribute('role');
        control.setAttribute('aria-disabled', 'false');
        await settle();
        expect(area).toHaveAttribute('role', 'button');
    });

    it('根元素带 aria-label 或 aria-labelledby 时为 group，使用方的 role 优先', () => {
        const { rerender } = render(<Upload aria-label="附件" action={action} />);
        expect(screen.getByRole('group', { name: '附件' })).toBeInTheDocument();
        rerender(<Upload aria-labelledby="x" action={action} />);
        expect(document.querySelector(`.${prefixCls}`)).toHaveAttribute('role', 'group');
        rerender(<Upload aria-label="附件" role="toolbar" action={action} />);
        expect(screen.getByRole('toolbar', { name: '附件' })).toBeInTheDocument();
        rerender(<Upload action={action} />);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('role');
    });

    it('list 卡片的替换按钮不被带 tabindex 的包裹元素嵌套，Tab 只在替换按钮停一次', async () => {
        render(<FileCard name="a.png" listType="list" showReplace size="1KB" status="success" uid="1" onRemove={() => {}} onRetry={() => {}} />);
        const button = screen.getByRole('button', { name: '替换文件' });
        expect(button.parentElement.closest('[tabindex]')).toBeNull();
        await userEvent.tab();
        expect(button).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: '移除文件' })).toHaveFocus();
    });

    it('onChange 的 currentFile、onRemove 首参与 onError 的 xhr 按运行时值声明', () => {
        expectTypeOf<Parameters<UploadCallback<'onChange'>>[0]['currentFile']>().toEqualTypeOf<FileItem | null | undefined>();
        expectTypeOf<Parameters<UploadCallback<'onRemove'>>[0]>().toEqualTypeOf<CustomFile | undefined>();
        expectTypeOf<Parameters<UploadCallback<'onError'>>[3]>().toEqualTypeOf<XMLHttpRequest | { status?: number }>();
    });

    it('进度圆环的轨道色取自主题变量', () => {
        render(<FileCard name="a.png" listType="picture" percent={30} size="1KB" status="uploading" uid="1" url="https://example.com/a.png" onRemove={() => {}} onRetry={() => {}} />);
        const orbit = document.querySelector<SVGElement>(`.${BASE_CLASS_PREFIX}-progress-circle-ring-track`);
        expect(orbit.style.stroke).toBe('var(--semi-color-white)');
    });
});
