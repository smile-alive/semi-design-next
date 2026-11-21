import { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-react';
import type { CheckboxEvent, CheckboxGroupProps, CheckboxOptionItem, CheckboxProps } from '../index';

const options = [
    { label: 'Abc', value: 'abc' },
    { label: 'Hotsoon', value: 'hotsoon' },
    { label: 'Pipixia', value: 'pipixia' },
    { label: 'Toutiao', value: 'toutiao' },
];

function getCG(props: CheckboxGroupProps = {}) {
    if (!props.children && !props.options) {
        props.options = options;
    }
    return <CheckboxGroup {...props} />;
}

const getCheckbox = (name) => screen.getByRole('checkbox', { name });

describe('CheckboxGroup', () => {
    it('className 与 style', () => {
        const { container } = render(
            getCG({
                style: { color: 'red' },
                className: 'cbg-test',
            })
        );
        const group = container.querySelector(`div.${BASE_CLASS_PREFIX}-checkboxGroup`);
        expect(group).toHaveClass('cbg-test');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('通过 options 声明', () => {
        const { container } = render(getCG({}));
        const group = container.querySelector(`div.${BASE_CLASS_PREFIX}-checkboxGroup`);
        expect(group.children).toHaveLength(4);
        const labels = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-addon`), (label) => label.textContent);
        expect(labels).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'Toutiao']);
    });

    it('通过 children 声明', () => {
        const children = options.map((item) => (
            <Checkbox key={item.value} value={item.value}>
                {item.label}
            </Checkbox>
        ));
        const { container } = render(getCG({ children }));
        const group = container.querySelector(`div.${BASE_CLASS_PREFIX}-checkboxGroup`);
        expect(group.children).toHaveLength(4);
        const labels = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-addon`), (label) => label.textContent);
        expect(labels).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'Toutiao']);
    });

    it('禁用', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        const { container } = render(getCG({ onChange, disabled: true }));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-disabled`)).toHaveLength(4);
        screen.getAllByRole('checkbox').forEach((el) => expect(el).toBeDisabled());
        // the native input swallows clicks while disabled, so click the visible box
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner`));
        expect(onChange).not.toHaveBeenCalled();
        expect(getCheckbox('Abc')).not.toBeChecked();
    });

    it('defaultValue', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        render(getCG({ onChange, defaultValue: ['hotsoon'] }));
        expect(getCheckbox('Hotsoon')).toBeChecked();
        expect(getCheckbox('Abc')).not.toBeChecked();
        await userEvent.click(getCheckbox('Abc'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['hotsoon', 'abc']);
    });

    it('受 value 控制', () => {
        const options = [
            { label: 'Apple', value: 'Apple' },
            { label: 'Orange', value: 'Orange' },
        ];

        const { rerender } = render(getCG({ options }));
        expect(getCheckbox('Apple')).not.toBeChecked();
        expect(getCheckbox('Orange')).not.toBeChecked();
        rerender(getCG({ options, value: ['Apple'] }));
        expect(getCheckbox('Apple')).toBeChecked();
        expect(getCheckbox('Orange')).not.toBeChecked();
    });

    it('子 Checkbox 触发 onChange', async () => {
        const onItemChange = vi.fn<(e: CheckboxEvent) => void>();
        const onGroupChange = vi.fn<(value: unknown[]) => void>();
        render(
            <CheckboxGroup onChange={onGroupChange}>
                <Checkbox value="my" onChange={onItemChange} />
            </CheckboxGroup>
        );
        await userEvent.click(screen.getByRole('checkbox'));
        expect(onItemChange).toHaveBeenCalledTimes(1);
        expect(onGroupChange).toHaveBeenCalledTimes(1);
        expect(onGroupChange).toHaveBeenCalledWith(['my']);
    });

    it('checkboxGroup card 样式', () => {
        const { container, unmount } = render(getCG({ type: 'card' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-cardType`)).not.toBeNull();
        unmount();

        // a string instead of an array on purpose: the group must still mark the matching card checked
        const disabled = render(getCG({ type: 'card', disabled: true, defaultValue: 'abc' as unknown as string[] }));
        const cards = disabled.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-cardType`);
        expect(cards[0]).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-cardType_checked_disabled`);
    });

    it('checkboxGroup pureCard 样式', () => {
        const { container, unmount } = render(getCG({ type: 'pureCard' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-cardType`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-pureCardType`)).not.toBeNull();
        unmount();

        const disabled = render(getCG({ type: 'pureCard', disabled: true, defaultValue: 'abc' as unknown as string[] }));
        const cards = disabled.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-cardType`);
        expect(cards[0]).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-cardType_checked_disabled`);
    });

    it('文本子节点原样渲染而不抛错', () => {
        render(
            <CheckboxGroup>
                plain text
                <Checkbox value="a">A</Checkbox>
            </CheckboxGroup>
        );
        expect(screen.getByText('plain text')).toBeInTheDocument();
        expect(getCheckbox('A')).toBeInTheDocument();
    });

    it('带 key 的子项条件插入后已有 Checkbox 的 DOM 节点保持不变', () => {
        const App = ({ show }: { show: boolean }) => (
            <CheckboxGroup>
                {show ? (
                    <Checkbox key="x" value="x">
                        X
                    </Checkbox>
                ) : null}
                <Checkbox key="a" value="a">
                    A
                </Checkbox>
            </CheckboxGroup>
        );
        const { rerender } = render(<App show={false} />);
        const before = getCheckbox('A');
        rerender(<App show />);
        expect(getCheckbox('A')).toBe(before);
    });

    it('受控 value 变化时，首次提交的 DOM 就已是新值', () => {
        const commits: boolean[][] = [];
        const Spy = () => {
            useLayoutEffect(() => {
                commits.push(screen.getAllByRole<HTMLInputElement>('checkbox').map((input) => input.checked));
            });
            return null;
        };
        const App = ({ value }: { value: string[] }) => (
            <CheckboxGroup value={value}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox value="b">B</Checkbox>
                <Spy />
            </CheckboxGroup>
        );
        const { rerender } = render(<App value={['a']} />);
        commits.length = 0;
        rerender(<App value={['b']} />);
        expect(commits[0]).toEqual([false, true]);
    });

    it('options 与 value 的类型与运行时一致', () => {
        expectTypeOf<CheckboxGroupProps['options']>().toEqualTypeOf<Array<string | CheckboxOptionItem> | undefined>();
        expectTypeOf<{ label: string; value: boolean }>().toExtend<CheckboxOptionItem>();
        expectTypeOf<{ lable: string }>().not.toExtend<CheckboxOptionItem>();
        expectTypeOf<NonNullable<CheckboxGroupProps['value']>>().toEqualTypeOf<Array<string | number | boolean>>();
        expectTypeOf<CheckboxProps['name']>().toEqualTypeOf<string | undefined>();
    });

    it('classNames 与 styles 按部位落到组内每个 Checkbox 的对应元素', () => {
        const parts = ['item', 'itemIcon', 'itemLabel', 'itemExtra'] as const;
        const selectors = { item: '', itemIcon: '-inner-display', itemLabel: '-addon', itemExtra: '-extra' };
        const { container } = render(
            <CheckboxGroup
                classNames={Object.fromEntries(parts.map((p) => [p, `my-${p}`]))}
                styles={Object.fromEntries(parts.map((p) => [p, { order: parts.indexOf(p) + 1 }]))}
                options={[
                    { label: 'A', value: 'a', extra: 'ea' },
                    { label: 'B', value: 'b', extra: 'eb' },
                ]}
            />
        );
        for (const part of parts) {
            const els = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox${selectors[part]}`);
            expect(els).toHaveLength(2);
            for (const el of els) {
                expect(el).toHaveClass(`my-${part}`);
                expect(el).toHaveStyle({ order: String(parts.indexOf(part) + 1) });
            }
        }
    });

    it('组的 item* 先于 Checkbox 自己的 classNames 与 styles，自己的后写', () => {
        const { container } = render(
            <CheckboxGroup classNames={{ item: 'g-item', itemIcon: 'g-icon', itemLabel: 'g-label', itemExtra: 'g-extra' }} styles={{ itemIcon: { order: 1, color: 'red' } }}>
                <Checkbox className="own" classNames={{ icon: 'c-icon', label: 'c-label', extra: 'c-extra' }} styles={{ icon: { order: 2 } }} value="a" extra="more">
                    A
                </Checkbox>
            </CheckboxGroup>
        );
        const classes = (selector: string) => container.querySelector(selector).className.split(' ');
        const prefix = `.${BASE_CLASS_PREFIX}-checkbox`;
        const root = classes(prefix);
        expect(root.indexOf('g-item')).toBeGreaterThan(-1);
        expect(root.indexOf('g-item')).toBeLessThan(root.indexOf('own'));
        for (const [selector, group, own] of [
            ['-inner-display', 'g-icon', 'c-icon'],
            ['-addon', 'g-label', 'c-label'],
            ['-extra', 'g-extra', 'c-extra'],
        ]) {
            const list = classes(`${prefix}${selector}`);
            expect(list.indexOf(group)).toBeGreaterThan(-1);
            expect(list.indexOf(group)).toBeLessThan(list.indexOf(own));
        }
        const icon = container.querySelector(`${prefix}-inner-display`);
        expect(icon).toHaveStyle({ order: '2', color: 'rgb(255, 0, 0)' });
    });
});
