import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { AnnotationInfo } from '../annotation/interface';
import { Annotation, MCPConfigure, Sidebar } from '../index';
import BindHost, { type BindHostStore } from './bind-host.svelte';
import RichTextSample from './rich-text-sample.svelte';

const { FileItem } = Sidebar;
const text = zh_CN.Sidebar;

const info: AnnotationInfo[] = [
    {
        header: 'Sources',
        key: '1',
        annotations: [
            { type: 'text', title: 'Text title', url: 'https://semi.design/text', detail: 'detail', siteName: 'Semi' },
            { type: 'video', title: 'Video title', url: 'https://semi.design/video', siteName: 'Video site' },
        ],
    },
];

describe('Sidebar.Container 浏览器', () => {
    it('关闭动画结束后焦点回到打开前聚焦的元素', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => opener.remove());
        const store = createStore<BindHostStore>({ kind: 'container', visible: false, log: [] });
        render(BindHost, { props: { store } });
        opener.focus();
        store.visible = true;
        await waitFor(() => expect(page.getByRole('button', { name: text.close }).element()).toBeTruthy());
        (page.getByRole('button', { name: text.close }).element() as HTMLElement).focus();
        store.visible = false;
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it('显示与关闭时分别带上进入和离开的动画类，离开结束后移除节点', async () => {
        const store = createStore<BindHostStore>({ kind: 'container', visible: false, log: [] });
        render(BindHost, { props: { store } });
        store.visible = true;
        const root = await waitFor(() => {
            const found = document.querySelector<HTMLElement>('.semi-sidebar-container');
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        expect(root).toHaveClass('semi-sidebar-animation-content_show');
        await waitFor(() => expect(root).not.toHaveClass('semi-sidebar-animation-content_show'));
        store.visible = false;
        await waitFor(() => expect(root).toHaveClass('semi-sidebar-animation-content_hide'));
        await waitFor(() => expect(document.querySelector('.semi-sidebar-container')).toBeNull());
    });

    it('渲染在 shadow root 内时，关闭后焦点回到打开前聚焦的元素', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const target = shadow.appendChild(document.createElement('div'));
        const opener = target.appendChild(document.createElement('button'));
        const mount = target.appendChild(document.createElement('div'));
        const store = createStore<BindHostStore>({ kind: 'container', visible: false, log: [] });
        render(BindHost, { props: { store }, target: mount });
        opener.focus();
        store.visible = true;
        const close = await waitFor(() => {
            const found = mount.querySelector<HTMLElement>(`[aria-label="${text.close}"]`);
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        close.focus();
        expect(shadow.activeElement).toBe(close);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement).toBe(opener));
    });
});

describe('Annotation 浏览器', () => {
    it.each([/Text title/, /Video title/])('%s 项是可通过 Tab 到达的链接，不带链接样式，并显示主题焦点环', async (name) => {
        render(Annotation, { props: { activeKey: ['1'], info, visible: true } });
        const link = page.getByRole('link', { name }).element();
        const { display, textDecorationLine } = getComputedStyle(link);
        expect({ display, textDecorationLine }).toEqual({
            display: link.classList.contains('semi-sidebar-annotation-item-text') ? 'flex' : 'block',
            textDecorationLine: 'none',
        });
        await tabTo(link);
        expectThemeFocusRing(link);
    });
});

describe('MCPConfigure 浏览器', () => {
    it('容器窄于整行时激活数量文字保持单行原宽，不按字换行', () => {
        const options = [
            { label: 'GitHub', value: 'github', desc: 'Code hosting', active: true },
            { label: 'Figma', value: 'figma', desc: 'Design tool' },
        ];
        const wide = document.body.appendChild(document.createElement('div'));
        const narrow = document.body.appendChild(document.createElement('div'));
        wide.style.width = '600px';
        narrow.style.width = '260px';
        onTestFinished(() => {
            wide.remove();
            narrow.remove();
        });
        for (const target of [wide, narrow]) {
            render(MCPConfigure, { props: { visible: true, motion: false, resizable: false, options }, target });
        }
        const sizes = [wide, narrow].map((target) => {
            const { width, height } = (target.querySelector('.semi-sidebar-mcp-configure-content-header-count') as Element).getBoundingClientRect();
            return { width, height };
        });
        expect(sizes[1]).toEqual(sizes[0]);
    });
});

describe('Sidebar 富文本编辑器 浏览器', () => {
    it('宿主 Preflight 重置下，标题、列表和链接仍可区分于正文', () => {
        // what Tailwind Preflight does, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = `@layer semi.reset {
            *, ::before, ::after { margin: 0; padding: 0; }
            h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
            ol, ul { list-style: none; }
            a { color: inherit; text-decoration: inherit; }
        }`;
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(RichTextSample);
        const style = (selector: string) => getComputedStyle(container.querySelector(selector) as Element);
        const bodySize = parseFloat(style('p').fontSize);
        for (const tag of ['h1', 'h2', 'h3']) {
            expect(parseFloat(style(tag).fontSize)).toBeGreaterThan(bodySize);
        }
        for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
            expect(Number(style(tag).fontWeight)).toBeGreaterThanOrEqual(600);
        }
        expect(style('ul').listStyleType).toBe('disc');
        expect(style('ol').listStyleType).toBe('decimal');
        expect(parseFloat(style('ul').paddingInlineStart)).toBeGreaterThan(0);
        expect(style('a').textDecorationLine).toBe('underline');
        expect(style('a').color).not.toBe(style('p').color);
    });
});

describe('Sidebar.FileItem 浏览器', () => {
    const mountBar = () => {
        const { container } = render(FileItem, { props: { content: '<p>text</p>' } });
        return waitFor(() => {
            const bar = container.querySelector('.semi-sidebar-file-menu-bar');
            expect(bar).not.toBeNull();
            return bar as Element;
        });
    };

    it('Tab 遍历工具栏时每个停靠点都是按钮，标题与链接下拉没有额外的空停靠点', async () => {
        const bar = await mountBar();
        const stops: Element[] = [];
        for (let i = 0; i < 40 && !bar.contains(document.activeElement); i++) {
            await userEvent.keyboard('{Tab}');
        }
        while (bar.contains(document.activeElement) && stops.length < 40) {
            stops.push(document.activeElement as Element);
            await userEvent.keyboard('{Tab}');
        }
        expect(stops.length).toBeGreaterThan(0);
        expect(stops.map((el) => el.tagName)).toEqual(stops.map(() => 'BUTTON'));
        expect(stops.every((el) => el.getAttribute('aria-label'))).toBe(true);
    });

    it('悬停标题按钮打开级别菜单，触发器暴露展开状态', async () => {
        await mountBar();
        const heading = page.getByRole('button', { name: text.heading });
        await userEvent.hover(heading);
        await expect.element(page.getByRole('menuitem', { name: text.headingLevel.replace('${level}', '1') })).toBeVisible();
        await expect.element(heading).toHaveAttribute('aria-expanded', 'true');
    });
});
