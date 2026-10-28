/** @jsxImportSource vue */
import { shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Button, { SplitButtonGroup } from '..';
import ConfigProvider from '../../config-provider';
import Dropdown, { DropdownItem, DropdownMenu } from '../../dropdown';

const button = (name: string) => screen.getByText(name).closest('button') as HTMLButtonElement;

function renderGroup(labels: string[]) {
    const current = shallowRef(labels);
    const view = render(SplitButtonGroup, {
        props: { 'aria-label': 'split' },
        // the slot reads the ref while the group renders, so assigning it re-renders the group
        slots: { default: () => current.value.map((label) => <Button key={label}>{() => label}</Button>) },
    });
    return { view, current };
}

describe('SplitButtonGroup', () => {
    it('根元素为 role="group"，aria-label 经 attrs 命名，使用方 role 不覆盖 group', () => {
        render(SplitButtonGroup, {
            props: { 'aria-label': 'split', role: 'toolbar', class: 'own' },
            slots: { default: () => <Button>{() => 'a'}</Button> },
        });
        const group = screen.getByRole('group', { name: 'split' });
        expect(group).toHaveClass('semi-button-split', 'own');
    });

    it('模板 ref 的 $el 是根元素', () => {
        const ref = vi.fn<(instance: unknown) => void>();
        // a ref needs an owner, so the group is rendered from the slot of a provider that renders nothing itself
        render(ConfigProvider, {
            slots: {
                default: () => (
                    <SplitButtonGroup ref={ref} aria-label="split">
                        {() => <Button>{() => 'a'}</Button>}
                    </SplitButtonGroup>
                ),
            },
        });
        expect((ref.mock.lastCall?.[0] as { $el: Element } | undefined)?.$el).toBe(screen.getByRole('group', { name: 'split' }));
    });

    it('标记首尾按钮，增加按钮后同样生效', async () => {
        const { current } = renderGroup(['a', 'b']);
        expect(button('a')).toHaveClass('semi-button-first');
        expect(button('b')).toHaveClass('semi-button-last');
        current.value = ['a', 'b', 'c'];
        await waitFor(() => expect(button('c')).toHaveClass('semi-button-last'));
        expect(button('b')).not.toHaveClass('semi-button-last');
        expect(button('a')).toHaveClass('semi-button-first');
    });

    it('移除末尾按钮后，新的末尾按钮标记为 last', async () => {
        const { current } = renderGroup(['a', 'b', 'c']);
        current.value = ['a', 'b'];
        await waitFor(() => expect(button('b')).toHaveClass('semi-button-last'));
    });

    it('Dropdown 包裹的 loading 或 disabled 按钮被 span 包住后仍标记为 last', async () => {
        const trailing = shallowRef<{ loading?: boolean; disabled?: boolean }>({ loading: true });
        render(SplitButtonGroup, {
            props: { 'aria-label': 'split' },
            slots: {
                default: () => (
                    <>
                        <Button>{() => 'main'}</Button>
                        <Dropdown trigger="click" motion={false}>
                            {{
                                default: () => <Button {...trailing.value}>{() => 'more'}</Button>,
                                content: () => <DropdownMenu>{() => <DropdownItem>{() => 'item'}</DropdownItem>}</DropdownMenu>,
                            }}
                        </Dropdown>
                    </>
                ),
            },
        });
        expect(button('more').parentElement).toHaveClass('semi-tooltip-trigger-wrapper');
        expect(button('more')).toHaveClass('semi-button-last');
        expect(button('main')).toHaveClass('semi-button-first');
        trailing.value = { disabled: true };
        await waitFor(() => expect(button('more')).toHaveClass('semi-button-disabled'));
        expect(button('more').parentElement).toHaveClass('semi-tooltip-trigger-wrapper');
        expect(button('more')).toHaveClass('semi-button-last');
    });
});
