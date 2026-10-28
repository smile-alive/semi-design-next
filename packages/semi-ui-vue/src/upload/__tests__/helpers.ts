import { h, nextTick, type VNode } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Button from '../../button';
import type { FileItem } from '../interface';
import Upload from '../upload.vue';

export const action = 'https://semi.bytendance.com';
export const PROGRESS_COEFFICIENT = 0.95;
export const prefix = 'semi-upload';

export type Listener = (...args: any[]) => unknown;
export const fn = () => vi.fn<Listener>();

export type Slots = Record<string, (props: never) => VNode | VNode[] | string>;

const defaultTrigger = () => h(Button, { theme: 'light' }, () => '点击上传');

export function renderUpload(props: Record<string, unknown> = {}, slots: Slots = { default: defaultTrigger }) {
    return render(Upload, { props: { action, ...props } as never, slots: slots as never });
}

export const getInput = () => document.querySelector<HTMLInputElement>(`.${prefix}-hidden-input`) as HTMLInputElement;
export const getReplaceInput = () => document.querySelector<HTMLInputElement>(`.${prefix}-hidden-input-replace`) as HTMLInputElement;
export const getCardNames = () => Array.from(document.querySelectorAll(`.${prefix}-file-card-info-name`)).map((node) => node.textContent?.trim());
export const getPicCards = () => document.querySelectorAll<HTMLElement>(`.${prefix}-picture-file-card`);
export const getDragArea = () => document.querySelector(`.${prefix}-drag-area`) as HTMLElement;
export const query = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) => {
    const found = root.querySelector<E>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
};

// user-event's upload() filters by `accept` and keeps one file on a non-multiple input, hiding the component's own
// accept / limit handling, so fire the change event directly
export function selectFiles(files: File[], input = getInput()) {
    return fireEvent.change(input, { target: { files } });
}

export function lastFileList(onChange: { mock: { lastCall?: unknown[] } }) {
    const call = onChange.mock.lastCall;
    if (!call) throw new Error('change was never emitted');
    return (call[0] as { fileList: FileItem[] }).fileList;
}

export interface FakeXhr {
    withCredentials: boolean;
    method?: string;
    url?: string;
    requestBody: FormData;
    requestHeaders: Record<string, string>;
    aborted: boolean;
    respond: (status: number, body: string) => Promise<void>;
    uploadProgress: (event: { loaded: number; total: number }) => Promise<void>;
}

export function installFakeXhr() {
    const requests: FakeXhr[] = [];
    class FakeXMLHttpRequest {
        withCredentials = false;
        upload: { onprogress: (event: { loaded: number; total: number }) => void } = {
            onprogress: () => {
                throw new Error('the foundation did not assign upload.onprogress');
            },
        };
        method?: string;
        url?: string;
        requestBody = new FormData();
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
        abort() {
            this.aborted = true;
        }
        async respond(status: number, body: string) {
            this.status = status;
            this.responseText = body;
            this.onload({});
            await nextTick();
        }
        async uploadProgress(event: { loaded: number; total: number }) {
            this.upload.onprogress(event);
            await nextTick();
        }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    return requests;
}

export const createFile = (size = 44320, name = 'semi-logo.png', type = 'image/png') => new File([new ArrayBuffer(size)], name, { type });

export const defaultFileList: FileItem[] = [
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

export const createObjectURL = vi.fn<typeof URL.createObjectURL>();
export const revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
URL.createObjectURL = createObjectURL;
URL.revokeObjectURL = revokeObjectURL;
