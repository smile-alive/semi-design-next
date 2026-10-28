/** @jsxImportSource vue */
import { waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import TagGroup from '../group.vue';
import SplitTagGroup from '../split-tag-group.vue';
import Tag from '../tag.vue';

describe('Tag 浏览器', () => {
    it('Backspace 关闭标签后，焦点移到后一个标签', async () => {
        const view = render(() => (
            <>
                <Tag closable>{() => '甲'}</Tag>
                <Tag closable>{() => '乙'}</Tag>
            </>
        ));
        const tags = view.container.querySelectorAll<HTMLElement>('.semi-tag');
        tags[0].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[0]).toHaveClass('semi-tag-invisible');
        expect(tags[1]).toHaveFocus();
    });
    it('ShadowRoot 内 Backspace 关闭标签后，焦点移到后一个标签', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            () => (
                <>
                    <Tag closable>{() => '甲'}</Tag>
                    <Tag closable>{() => '乙'}</Tag>
                </>
            ),
            { container: mount }
        );
        try {
            const tags = shadow.querySelectorAll<HTMLElement>('.semi-tag');
            tags[0].focus();
            await userEvent.keyboard('{Backspace}');
            expect(tags[0]).toHaveClass('semi-tag-invisible');
            expect(shadow.activeElement).toBe(tags[1]);
        } finally {
            view.unmount();
            host.remove();
        }
    });
    it('Backspace 关闭最后一个标签后，焦点移到前一个标签', async () => {
        const view = render(() => (
            <>
                <Tag closable>{() => '甲'}</Tag>
                <Tag closable>{() => '乙'}</Tag>
            </>
        ));
        const tags = view.container.querySelectorAll<HTMLElement>('.semi-tag');
        tags[1].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[1]).toHaveClass('semi-tag-invisible');
        expect(tags[0]).toHaveFocus();
    });
    it('onClose 中 preventDefault 时焦点留在原标签', async () => {
        const view = render(() => (
            <>
                <Tag closable onClose={(event: Event) => event.preventDefault()}>
                    {() => '甲'}
                </Tag>
                <Tag closable>{() => '乙'}</Tag>
            </>
        ));
        const tags = view.container.querySelectorAll<HTMLElement>('.semi-tag');
        tags[0].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[0]).toHaveFocus();
    });
    it('最大数量之外的标签由 Popover 显示并在卸载后清理', async () => {
        const view = render(TagGroup, {
            props: {
                maxTagCount: 3,
                showPopover: true,
                size: 'large',
                popoverProps: { motion: false },
                tagList: ['抖音', '火山小视频', 'Abc', 'vigo', '皮皮虾'].map((children) => ({
                    children,
                    color: 'white' as const,
                })),
            },
        });
        expect(view.queryByText('vigo')).toBeNull();
        await userEvent.click(view.getByText('+2'));
        await waitFor(() => expect(document.querySelector('.semi-tag-rest-group-popover')).toMatchTextContent('vigo皮皮虾'));
        view.unmount();
        expect(document.querySelector('.semi-tag-rest-group-popover')).toBeNull();
    });
    it('键盘激活后 Tab 跳过静态标签并关闭可关闭标签，显示主题焦点环', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(() => (
            <>
                <Tag onClick={click}>{() => '李白'}</Tag>
                <Tag>{() => '白居易'}</Tag>
                <Tag closable>{() => '杜甫'}</Tag>
            </>
        ));
        const tags = view.container.querySelectorAll<HTMLElement>('.semi-tag');
        await tabTo(tags[0]);
        expectThemeFocusRing(tags[0]);
        await userEvent.keyboard('{Enter}');
        expect(click).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Tab}');
        expect(tags[2]).toHaveFocus();
        expectThemeFocusRing(tags[2]);
        await userEvent.keyboard('{Backspace}');
        expect(tags[2]).toHaveClass('semi-tag-invisible');
    });
});

describe('SplitTagGroup 浏览器', () => {
    it.each(['square', 'circle'] as const)('%s 首尾圆角仅影响直接子元素，支持单个标签', (shape) => {
        const view = render(SplitTagGroup, {
            slots: {
                default: () => (
                    <>
                        <Tag shape={shape}>{() => ['A', <Tag class="nested">{() => 'nested'}</Tag>]}</Tag>
                        <Tag shape={shape}>{() => 'B'}</Tag>
                        <Tag shape={shape}>{() => 'C'}</Tag>
                    </>
                ),
            },
        });
        const tags = view.getByRole('group').children;
        const radius = getComputedStyle(tags[0]).borderTopLeftRadius;
        expect(radius).not.toBe('0px');
        expect(getComputedStyle(tags[0]).borderTopRightRadius).toBe('0px');
        expect(getComputedStyle(tags[1]).borderRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopRightRadius).toBe(radius);
        expect(getComputedStyle(view.container.querySelector('.nested') as HTMLElement).borderTopLeftRadius).not.toBe('0px');
        const single = render(SplitTagGroup, { slots: { default: () => <Tag shape={shape}>{() => 'Only'}</Tag> } });
        const only = single.container.querySelector('.semi-tag') as HTMLElement;
        expect(getComputedStyle(only).borderTopLeftRadius).toBe(radius);
        expect(getComputedStyle(only).borderTopRightRadius).toBe(radius);
    });
});
