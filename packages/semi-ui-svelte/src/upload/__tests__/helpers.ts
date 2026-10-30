import { flushSync, tick } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FileItem, UploadHandle, UploadProps } from '../interface';
import UploadHost from './upload-host.svelte';

type HostStore = NonNullable<Parameters<typeof UploadHost>[1]>['store'];

export const action = 'https://semi.bytendance.com';
export const PROGRESS_COEFFICIENT = 0.95;
export const prefix = 'semi-upload';

export type Listener = (...args: any[]) => unknown;
export const fn = () => vi.fn<Listener>();

export const getInput = () => document.querySelector<HTMLInputElement>(`.${prefix}-hidden-input`) as HTMLInputElement;
export const getReplaceInput = () => document.querySelector<HTMLInputElement>(`.${prefix}-hidden-input-replace`) as HTMLInputElement;
export const getCardNames = () => Array.from(document.querySelectorAll(`.${prefix}-file-card-info-name`)).map((node) => node.textContent?.trim());
export const getPicCards = () => document.querySelectorAll<HTMLElement>(`.${prefix}-picture-file-card`);
export const getDragArea = () => document.querySelector(`.${prefix}-drag-area`) as HTMLElement;
export function query<E extends Element = HTMLElement>(selector: string, root: ParentNode = document) {
    const found = root.querySelector<E>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}

/** What a test passes besides the Upload's own props */
export interface RenderOptions {
    trigger?: HostStore['trigger'];
    snippets?: string[];
    seen?: Record<string, unknown[]>;
}

export function renderUpload(props: Record<string, unknown> = {}, { trigger = 'button', snippets = [], seen = {} }: RenderOptions = {}) {
    const store = createStore<HostStore>({ props: { action, ...props } as UploadProps, trigger, snippets });
    let handle: UploadHandle | undefined;
    const view = render(UploadHost, { props: { store, seen, onReady: (ready: UploadHandle) => (handle = ready) } });
    return {
        ...view,
        store,
        /** Writes new props and flushes, as a parent re-rendering would */
        update(next: Record<string, unknown>) {
            Object.assign(store.props, next);
            flushSync();
        },
        call(run: (handle: UploadHandle) => void) {
            run(handle as UploadHandle);
            flushSync();
        },
    };
}

// user-event's upload() filters by `accept` and keeps one file on a non-multiple input, hiding the component's own
// accept / limit handling, so fire the change event directly
export async function selectFiles(files: File[], input = getInput()) {
    await fireEvent.change(input, { target: { files } });
    flushSync();
}

export async function click(element: Element) {
    await fireEvent.click(element);
    flushSync();
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
            await tick();
            flushSync();
        }
        async uploadProgress(event: { loaded: number; total: number }) {
            this.upload.onprogress(event);
            await tick();
            flushSync();
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
