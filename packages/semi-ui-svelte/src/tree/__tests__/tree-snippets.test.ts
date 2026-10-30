import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { TreeProps } from '../interface';
import { click, getNode, getSearchWrapper, optionCls, press, search, spyOn } from './data';
import TreeSnippets from './tree-snippets.svelte';

type Kind = 'label' | 'icon' | 'expandIcon' | 'fullLabel' | 'search' | 'emptyContent' | 'draggingNode' | 'button';

const renderKind = (kind: Kind, props: TreeProps = {}, log: string[] = []) => render(TreeSnippets, { props: { kind, props: { motion: false, ...props }, log } });

describe('Tree snippet', () => {
    it('label 收到节点数据、标签和搜索词', async () => {
        renderKind('label', { filterTreeNode: true });
        expect(getNode('yazhou').querySelector('.custom-label')).toHaveTextContent('亚洲|yazhou|');
        await search('亚');
        expect(getNode('yazhou').querySelector('.custom-label')).toHaveTextContent('亚洲|yazhou|亚');
    });

    it('icon 按节点状态渲染，取代目录图标', () => {
        renderKind('icon', { directory: true, expandedKeys: ['beimeizhou'] });
        expect(getNode('beimeizhou').querySelector('.custom-icon')).toHaveTextContent('beimeizhou:true:false');
        expect(getNode('meiguo').querySelector('.custom-icon')).toHaveTextContent('meiguo:false:true');
        expect(getNode('beimeizhou').querySelector('.semi-icon-folder_open')).toBeNull();
    });

    it('expandIcon 收到 class 与 onClick，点击只展开一次', async () => {
        const onExpand = spyOn('onExpand');
        renderKind('expandIcon', { onExpand });
        const button = getNode('yazhou').querySelector('button') as HTMLButtonElement;
        expect(button).toHaveClass(`${optionCls}-expand-icon`);
        expect(button).toHaveTextContent('+');
        await click(button);
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('yazhou').querySelector('button')).toHaveTextContent('-');
    });

    it('fullLabel 渲染自定义行，回调驱动选择和展开；行元素仍带 id、role 与状态', async () => {
        const onChange = spyOn('onChange');
        renderKind('fullLabel', { onChange });
        const row = getNode('yazhou');
        expect(row).toHaveAttribute('role', 'treeitem');
        expect(row.id).not.toBe('');
        expect(screen.getByTestId('full-yazhou')).toHaveClass(optionCls, `${optionCls}-level-1`);
        expect(row.querySelector(`.${optionCls}-expand-icon`)).not.toBeNull();
        await click(screen.getByTestId('full-yazhou'));
        expect(onChange).toHaveBeenCalledWith('Yazhou');
        expect(row).toHaveAttribute('aria-selected', 'true');
        await click(screen.getByRole('button', { name: 'open 亚洲' }));
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
    });

    it('search 取代搜索框，收到搜索框的参数', async () => {
        const onSearch = spyOn('onSearch');
        renderKind('search', { onSearch, searchPlaceholder: 'find' });
        const input = screen.getByRole('textbox', { name: 'custom search' });
        expect(input).toHaveAttribute('placeholder', 'find');
        expect(input).toHaveClass('semi-tree-input');
        expect(getSearchWrapper()).toContainElement(input);
        await fireEvent.input(input, { target: { value: '东京' } });
        flushSync();
        expect(onSearch).toHaveBeenCalledWith('东京', expect.any(Array));
    });

    it('emptyContent 取代空状态文案', () => {
        renderKind('emptyContent');
        expect(document.querySelector(`.${optionCls}-label-empty`)).toHaveTextContent(/^diy empty$/);
    });

    it('renderDraggingNode 的内容作为拖拽图像，拖拽开始后移除', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'] });
        const setDragImage = vi.fn<DataTransfer['setDragImage']>();
        renderKind('draggingNode');
        await fireEvent.dragStart(getNode('yazhou'), { dataTransfer: { setDragImage } });
        expect(setDragImage).toHaveBeenCalledTimes(1);
        const image = setDragImage.mock.calls[0][0] as HTMLElement;
        expect(image.querySelector('.drag-image')).toHaveTextContent('亚洲');
        expect(document.body).toContainElement(image);
        vi.runAllTimers();
        expect(document.body).not.toContainElement(image);
        vi.useRealTimers();
    });

    it('行内可聚焦控件保留自身的 Enter 和 Space', async () => {
        const onSelect = spyOn('onSelect');
        const log: string[] = [];
        renderKind('button', { onSelect }, log);
        const button = screen.getByRole('button', { name: 'open 亚洲' });
        button.focus();
        await fireEvent.keyDown(button, { key: 'Enter' });
        await fireEvent.keyDown(button, { key: ' ' });
        flushSync();
        expect(onSelect).not.toHaveBeenCalled();
        await press('ArrowDown');
        expect(onSelect).not.toHaveBeenCalled();
    });
});
