import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Dropdown, Tag, TagGroup } from '@fibrae/semi-ui-react';
import type { TagProps } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-tag`;

describe('Tag', () => {
    it('Backspace 关闭标签后，焦点移到相邻的标签', async () => {
        render(
            <div>
                <Tag closable>甲</Tag>
                <Tag closable>乙</Tag>
            </div>
        );
        const tags = document.querySelectorAll<HTMLElement>(`.${prefix}`);
        tags[0].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[0]).toHaveClass(`${prefix}-invisible`);
        expect(tags[1]).toHaveFocus();
    });

    it('ShadowRoot 内 Backspace 关闭标签后，焦点移到相邻的标签', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            <div>
                <Tag closable>甲</Tag>
                <Tag closable>乙</Tag>
            </div>,
            { container: mount }
        );
        try {
            const tags = shadow.querySelectorAll<HTMLElement>(`.${prefix}`);
            tags[0].focus();
            await userEvent.keyboard('{Backspace}');
            expect(tags[0]).toHaveClass(`${prefix}-invisible`);
            expect(shadow.activeElement).toBe(tags[1]);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('Backspace 关闭最后一个标签后，焦点移到前一个标签', async () => {
        render(
            <div>
                <Tag closable>甲</Tag>
                <Tag closable>乙</Tag>
            </div>
        );
        const tags = document.querySelectorAll<HTMLElement>(`.${prefix}`);
        tags[1].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[1]).toHaveClass(`${prefix}-invisible`);
        expect(tags[0]).toHaveFocus();
    });

    it('TagGroup 在关闭回调里移除标签，焦点落到相邻的标签而不是 body', async () => {
        const Probe = () => {
            const [list, setList] = useState(['甲', '乙', '丙']);
            return <TagGroup tagList={list.map((children) => ({ children, closable: true }))} onTagClose={(children) => setList((prev) => prev.filter((item) => item !== children))} />;
        };
        render(<Probe />);
        document.querySelectorAll<HTMLElement>(`.${prefix}`)[1].focus();
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(document.querySelectorAll(`.${prefix}`)).toHaveLength(2));
        expect(document.querySelectorAll<HTMLElement>(`.${prefix}`)[1]).toHaveFocus();
    });

    it('onClose 中 preventDefault 时焦点留在原标签', async () => {
        render(
            <div>
                <Tag closable onClose={(_, e) => e.preventDefault()}>
                    甲
                </Tag>
                <Tag closable>乙</Tag>
            </div>
        );
        const tags = document.querySelectorAll<HTMLElement>(`.${prefix}`);
        tags[0].focus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[0]).toHaveFocus();
    });

    it('带最大数量的标签组', async () => {
        const tagList = ['抖音', '火山小视频', 'Abc', 'vigo', '皮皮虾'].map((children): TagProps => ({
            color: 'white',
            children,
        }));
        render(<TagGroup style={{ width: 300 }} maxTagCount={3} showPopover size="large" tagList={tagList} />);
        expect(screen.queryByText('vigo')).toBeNull();

        await userEvent.click(screen.getByText('+2'));
        const popover = await waitFor(() => {
            const el = document.querySelector(`.${prefix}-rest-group-popover`);
            expect(el).not.toBeNull();
            return el;
        });
        expect(popover).toMatchTextContent('vigo');
        expect(popover).toMatchTextContent('皮皮虾');
    });

    it('键盘测试', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        render(
            <div>
                <Tag onClick={onClick}>李白</Tag>
                <Tag size="large">李白</Tag>
                <Tag>白居易</Tag>
                <Tag size="large">白居易</Tag>
                <Tag closable>杜甫</Tag>
                <Tag closable size="large">
                    杜甫
                </Tag>
            </div>
        );
        const tags = document.querySelectorAll<HTMLElement>(`.${prefix}`);

        tags[0].focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Tab}');
        expect(tags[4]).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(tags[4]).toHaveClass(`${prefix}-invisible`);
    });

    it('作为 Dropdown 触发器的可点击标签，Escape 关闭浮层后焦点仍在标签上', async () => {
        render(
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>选项</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                <Tag onClick={() => {}}>李白</Tag>
            </Dropdown>
        );
        const tag = screen.getByRole('button', { name: /李白/ });
        tag.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('menuitem')).toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menuitem')).toBeNull());
        expect(tag).toHaveFocus();
    });
});
