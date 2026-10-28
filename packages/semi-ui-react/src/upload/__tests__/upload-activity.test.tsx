import { Activity } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Upload, { type UploadProps } from '../index';

type UploadCallback<K extends keyof UploadProps> = NonNullable<UploadProps[K]>;

const action = 'https://semi.bytendance.com';

class FakeXMLHttpRequest {
    static requests: FakeXMLHttpRequest[] = [];
    upload: { onprogress?: (event: { loaded: number; total: number }) => void } = {};
    onload?: (event: object) => void;
    status = 0;
    responseText = '';
    aborted = false;
    constructor() {
        FakeXMLHttpRequest.requests.push(this);
    }
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {
        this.aborted = true;
    }
    respond(status: number, body: string) {
        this.status = status;
        this.responseText = body;
        act(() => this.onload?.({}));
    }
}

beforeEach(() => {
    FakeXMLHttpRequest.requests = [];
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    URL.createObjectURL = vi.fn<typeof URL.createObjectURL>();
});

describe('Activity 隐藏进行中的 Upload', () => {
    it('隐藏期间上传完成：请求不被中止，onSuccess 调用一次，恢复显示后文件为成功状态', () => {
        const onSuccess = vi.fn<UploadCallback<'onSuccess'>>();
        const onChange = vi.fn<UploadCallback<'onChange'>>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Upload action={action} onChange={onChange} onSuccess={onSuccess}>
                    <button type="button">upload</button>
                </Upload>
            </Activity>
        );
        const { rerender } = render(view('visible'));
        const input = document.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-upload-hidden-input`);
        fireEvent.change(input, { target: { files: [new File(['a'], 'hidden.png', { type: 'image/png' })] } });
        expect(FakeXMLHttpRequest.requests).toHaveLength(1);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        rerender(view('hidden'));
        const [request] = FakeXMLHttpRequest.requests;
        request.respond(200, '{"ok":true}');
        rerender(view('visible'));

        expect(request.aborted).toBe(false);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall[0].fileList[0]).toMatchObject({ name: 'hidden.png', status: 'success', response: { ok: true } });
        expect(screen.getByText('hidden.png')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).toBeNull();
    });
});
