/** @jsxImportSource vue */
import { fireEvent, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { IconBolt } from '@fibrae/semi-icons-vue';
import { createFile, fn, getDragArea, installFakeXhr, prefix, query, renderUpload, type FakeXhr, type Slots } from './helpers';

const drop = (files: File[]) => fireEvent.drop(getDragArea(), { dataTransfer: { files, effectAllowed: 'none' } });
const renderDraggable = (props: Record<string, unknown>, slots: Slots = {}) => renderUpload({ ...props, draggable: true }, slots);

describe('拖拽上传', () => {
    let requests: FakeXhr[];
    beforeEach(() => {
        requests = installFakeXhr();
    });

    it('draggable 用法', async () => {
        const onSuccess = fn();
        renderDraggable({ onSuccess });
        const file = createFile(200, 'drag.jpg');
        await drop([file]);
        const response = { code: 0, message: 'success' };
        await requests[0].respond(200, JSON.stringify(response));
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][0]).toEqual(response);
        expect(onSuccess.mock.calls[0][1]).toBe(file);
    });

    it('禁用上传时不应触发上传', async () => {
        const onFileChange = fn();
        renderDraggable({ disabled: true, onFileChange });
        await drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        expect(requests).toHaveLength(0);
    });

    it('#dragMainText、#dragIcon、#dragSubText', () => {
        renderDraggable(
            {},
            {
                dragIcon: () => <IconBolt />,
                dragMainText: () => <span>Drop files here to upload or Click to browse files</span>,
                dragSubText: () => <span>Only support jpeg / pdf</span>,
            }
        );
        expect(document.querySelector(`.${prefix}-drag-area-icon .semi-icon-bolt`)).not.toBeNull();
        expect(query(`.${prefix}-drag-area-main-text`)).toHaveTextContent('Drop files here to upload or Click to browse files');
        expect(query(`.${prefix}-drag-area-sub-text`)).toHaveTextContent('Only support jpeg / pdf');
    });

    it('draggable 与 accept', async () => {
        const onFileChange = fn();
        renderDraggable({ accept: 'application/pdf', onFileChange });
        await drop([createFile(200, 'drag.jpg')]);
        expect(onFileChange).not.toHaveBeenCalled();
        await drop([createFile(200, 'drag.pdf', 'application/pdf')]);
        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(screen.getByText('drag.pdf')).toBeInTheDocument();
    });
});
