import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconBolt } from '@fibrae/semi-icons-solid';
import Upload, { type UploadProps } from '..';

type UploadCallback<K extends keyof UploadProps> = NonNullable<UploadProps[K]>;

const action = 'https://semi.bytendance.com';

function installFakeXhr() {
    const requests: FakeXMLHttpRequest[] = [];
    class FakeXMLHttpRequest {
        withCredentials = false;
        upload = {};
        method?: string;
        url?: string;
        requestBody?: FormData;
        requestHeaders: Record<string, string> = {};
        status = 0;
        responseText = '';
        constructor() {
            requests.push(this);
        }
        onload: (event: object) => void = () => {
            throw new Error('the foundation did not assign onload');
        };
        open(method: string, url: string) {
            this.method = method;
            this.url = url;
        }
        setRequestHeader(key: string, value: string) {
            this.requestHeaders[key] = value;
        }
        send(body: FormData) {
            this.requestBody = body;
        }
        abort() {}
        respond(status: number, _headers: Record<string, string>, body: string) {
            this.status = status;
            this.responseText = body;
            this.onload({});
        }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    return requests;
}

function renderUpload(props: Partial<UploadProps>) {
    return render(() => <Upload action={action} {...props} draggable />);
}

const getDragArea = () => document.querySelector(`.${BASE_CLASS_PREFIX}-upload-drag-area`) as HTMLElement;

function drop(files: File[]) {
    fireEvent.drop(getDragArea(), { dataTransfer: { files, effectAllowed: 'none' } });
}

const createFile = (size = 1024, name = 'semi-logo.png', type = 'image/png') => new File([new ArrayBuffer(size)], name, { type });

describe('拖拽上传', () => {
    let requests: ReturnType<typeof installFakeXhr>;
    const createObjectURL = vi.fn<typeof URL.createObjectURL>();
    window.URL.createObjectURL = createObjectURL;

    beforeEach(() => {
        requests = installFakeXhr();
        createObjectURL.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('draggable 用法', () => {
        const onSuccess = vi.fn<UploadCallback<'onSuccess'>>();
        renderUpload({ onSuccess });
        const file = createFile(200, 'drag.jpg');
        drop([file]);
        const response = { code: 0, message: 'success' };
        requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][0]).toEqual(response);
        expect(onSuccess.mock.calls[0][1]).toBe(file);
    });

    it('禁用上传时不应触发上传', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ disabled: true, onFileChange });
        drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        expect(requests).toHaveLength(0);
    });

    it('dragMainText / dragIcon / dragSubText', () => {
        renderUpload({
            dragIcon: <IconBolt />,
            dragMainText: <span>Drop files here to upload or Click to browse files</span>,
            dragSubText: <span>Only support jpeg / pdf</span>,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-drag-area-icon .${BASE_CLASS_PREFIX}-icon-bolt`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-drag-area-main-text`)).toHaveTextContent('Drop files here to upload or Click to browse files');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-upload-drag-area-sub-text`)).toHaveTextContent('Only support jpeg / pdf');
    });

    it('draggable 与 accept', () => {
        const onFileChange = vi.fn<UploadCallback<'onFileChange'>>();
        renderUpload({ accept: 'application/pdf', onFileChange });
        drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        drop([createFile(200, 'drag.pdf', 'application/pdf')]);
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(screen.getByText('drag.pdf')).toBeInTheDocument();
    });
});
