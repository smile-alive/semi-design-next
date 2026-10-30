import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { Upload } from '..';
import type { FileItem } from '../interface';

const prefix = 'semi-upload';
const action = 'https://example.com/upload';
// the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
const ringStyle = '--semi-color-primary-light-active: rgb(1, 2, 3)';

const items: FileItem[] = [
    { uid: 'a', name: 'a.png', status: 'success', size: '1KB' },
    { uid: 'b', name: 'b.png', status: 'success', size: '1KB' },
    { uid: 'c', name: 'c.png', status: 'success', size: '1KB' },
];

const names = () => Array.from(document.querySelectorAll(`.${prefix}-file-card-info-name`)).map((node) => node.textContent?.trim());

function dataTransferOf(...files: File[]) {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    return transfer;
}

function drag(target: Element, type: 'dragenter' | 'dragover' | 'dragleave' | 'drop', files: File[] = []) {
    target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dataTransferOf(...files) }));
}

describe('Svelte Upload 浏览器', () => {
    it('拖入文件：显示松手提示，放下后进入列表并发出 drop', async () => {
        const onDrop = vi.fn<(event: DragEvent, files: File[], fileList: FileItem[]) => void>();
        render(Upload, { props: { action, draggable: true, customRequest: () => {}, onDrop } });
        const area = document.querySelector(`.${prefix}-drag-area`) as HTMLElement;
        drag(area, 'dragenter');
        await waitFor(() => expect(area).toHaveClass(`${prefix}-drag-area-legal`));
        expect(screen.getByText('松手开始上传')).toBeInTheDocument();
        const dropped = new File(['x'], 'dropped.png', { type: 'image/png' });
        drag(area, 'drop', [dropped]);
        await waitFor(() => expect(names()).toEqual(['dropped.png']));
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop.mock.calls[0][1]).toEqual([dropped]);
        expect(area).not.toHaveClass(`${prefix}-drag-area-legal`);
    });

    it('拖拽经过拖拽区内的子元素时提示不闪烁，离开后复位', async () => {
        render(Upload, { props: { action, draggable: true } });
        const area = document.querySelector(`.${prefix}-drag-area`) as HTMLElement;
        const child = area.querySelector(`.${prefix}-drag-area-main-text`) as HTMLElement;
        drag(area, 'dragenter');
        drag(child, 'dragenter');
        drag(area, 'dragleave');
        await waitFor(() => expect(area).toHaveClass(`${prefix}-drag-area-legal`));
        drag(child, 'dragleave');
        await waitFor(() => expect(area).not.toHaveClass(`${prefix}-drag-area-legal`));
    });

    it('添加区用 Tab 到达并显示主题焦点环，Enter 与空格打开文件选择框', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
        const onOpenFileDialog = vi.fn<() => void>();
        render(Upload, { props: { action, style: ringStyle, onOpenFileDialog } });
        const add = document.querySelector(`.${prefix}-add`) as HTMLElement;
        await tabTo(add);
        expectThemeFocusRing(add);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onOpenFileDialog).toHaveBeenCalledTimes(2);
        expect(inputClick).toHaveBeenCalledTimes(2);
        inputClick.mockRestore();
    });

    it('删除文件后焦点留在列表内，删完后回到添加区', async () => {
        render(Upload, { props: { action, fileList: items } });
        const closes = () => Array.from(document.querySelectorAll<HTMLElement>(`.${prefix}-file-card-close`));
        await tabTo(closes()[1]);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(names()).toEqual(['a.png', 'c.png']));
        const list = document.querySelector(`.${prefix}-file-list-main`) as HTMLElement;
        await waitFor(() => expect(list.contains(document.activeElement)).toBe(true));
        for (let left = 2; left > 0; left--) {
            (document.activeElement as HTMLElement).click();
            await waitFor(() => expect(names()).toHaveLength(left - 1));
        }
        await waitFor(() => expect(document.activeElement).toBe(document.querySelector(`.${prefix}-add`)));
    });

    it('图片墙里添加第一张图片时添加按钮保持焦点', async () => {
        render(Upload, { props: { action, listType: 'picture', customRequest: () => {} } });
        const add = document.querySelector(`.${prefix}-picture-add`) as HTMLElement;
        await tabTo(add);
        const input = document.querySelector(`.${prefix}-hidden-input`) as HTMLInputElement;
        input.files = dataTransferOf(new File(['x'], 'first.png', { type: 'image/png' })).files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await waitFor(() => expect(document.querySelectorAll(`.${prefix}-picture-file-card`)).toHaveLength(1));
        expect(document.activeElement).toBe(document.querySelector(`.${prefix}-picture-add`));
    });
});
