/** @jsxImportSource vue */
import { type ComponentPublicInstance } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Input, { InputGroup, type InputGroupProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import GroupChildren from './fixtures/group-children.vue';
import GroupLabel from './fixtures/group-label.vue';
import GroupProps from './fixtures/group-props.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const labelCls = `${BASE_CLASS_PREFIX}-form-field-label`;
const getInput = () => document.querySelector('input') as HTMLInputElement;
const byPlaceholder = (text: string) => screen.getByPlaceholderText(text);
// Vue ignores an ancestor listener attached at or after the timestamp of an event coming up from a child, and the
// suite freezes the system clock, so time has to be moved on by hand.
const settle = () => {
    vi.setSystemTime(Date.now() + 10);
};
// A function ref receives the component instance, whose $el is the rendered root
const renderGroup = (props: InputGroupProps = {}) => {
    let instance: ComponentPublicInstance | null = null;
    const Host = () => (
        <InputGroup
            {...props}
            ref={(value) => {
                instance = value as ComponentPublicInstance | null;
            }}
        >
            {{
                default: () => <Input />,
            }}
        </InputGroup>
    );
    const view = render(Host);
    return { ...view, el: () => instance?.$el as Element };
};

describe('InputGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('子项自带的 disabled 优先于组的值，未写的子项取组的值', async () => {
        const view = render(GroupProps, { props: { groupDisabled: true } });
        expect(byPlaceholder('own-enabled')).toBeEnabled();
        expect(byPlaceholder('shorthand')).toBeDisabled();
        expect(byPlaceholder('inherit')).toBeDisabled();
        await view.rerender({ groupDisabled: false });
        expect(byPlaceholder('own-enabled')).toBeEnabled();
        expect(byPlaceholder('shorthand')).toBeDisabled();
        expect(byPlaceholder('inherit')).toBeEnabled();
    });

    it('focus 与 blur 在分组元素上各触发一次，不下发给子项', async () => {
        const view = render(GroupProps);
        settle();
        await userEvent.click(byPlaceholder('own-enabled'));
        expect(view.emitted('groupFocus')).toHaveLength(1);
        expect((view.emitted('groupFocus')[0] as FocusEvent[])[0].type).toBe('focusin');
        expect(view.emitted('childFocus')).toHaveLength(1);
        await userEvent.click(document.body);
        expect(view.emitted('groupBlur')).toHaveLength(1);
        expect((view.emitted('groupBlur')[0] as FocusEvent[])[0].type).toBe('focusout');
    });

    it('size、disabled 与未声明属性传给每个子项，class 与 style 留在分组元素', () => {
        render(GroupProps, { props: { groupDisabled: true } });
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', zh_CN.Input.group);
        expect(group).not.toHaveAttribute('aria-disabled');
        expect(group).toHaveClass(`${prefixCls}-group`, `${prefixCls}-small`, 'g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(group).not.toHaveAttribute('data-group');
        expect(group).not.toHaveAttribute('aria-labelledby');
        for (const input of document.querySelectorAll('input')) {
            expect(input).toHaveClass(`${prefixCls}-small`);
            expect(input).toHaveAttribute('data-group', '1');
            expect(input).toHaveAttribute('aria-labelledby', 'external');
            expect(input).not.toHaveClass('g');
        }
    });

    it('原样渲染文本子节点，跳过 v-if 为假的子项', () => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(GroupChildren, { props: { keys: ['name'] } });
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        expect(container).toHaveTextContent('-2');
        expect(warn).not.toHaveBeenCalled();
    });

    it('在前面插入带 key 的子项后，已有输入框保持同一实例', async () => {
        const view = render(GroupChildren, { props: { keys: ['name'] } });
        const name = screen.getByRole('textbox', { name: 'name' });
        await userEvent.type(name, 'abc');
        await view.rerender({ keys: ['prefix', 'name'] });
        expect(screen.getByRole('textbox', { name: 'name' })).toBe(name);
        expect(name).toHaveValue('abc');
        expect(screen.getByRole('textbox', { name: 'prefix' })).toHaveAttribute('data-group', '1');
    });

    it('带 label 的分组：label 文本、位置类名，分组以 aria-labelledby 引用 label', () => {
        render(GroupLabel);
        const [top, left] = document.querySelectorAll(`.${prefixCls}-group-wrapper`);
        expect(top).toHaveClass(`${prefixCls}-group-wrapper-with-top-label`);
        expect(left).toHaveClass(`${prefixCls}-group-wrapper-with-left-label`);
        const score = screen.getByRole('group', { name: 'Score' });
        expect(score).toHaveClass('g');
        expect(score).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(top).not.toHaveClass('g');
        const [scoreLabel, slotLabel] = document.querySelectorAll(`.${labelCls}`);
        expect(scoreLabel).toHaveTextContent('Score');
        expect(score).toHaveAttribute('aria-labelledby', scoreLabel.id);
        expect(scoreLabel).not.toHaveAttribute('for');
        expect(byPlaceholder('score')).not.toHaveAttribute('labelposition');
        const slotted = screen.getByRole('group', { name: 'Slot label extra' });
        expect(slotted).toHaveAttribute('aria-labelledby', slotLabel.id);
    });

    it('#labelExtra 渲染在 label 的 extra 区域', () => {
        render(GroupLabel);
        const extra = document.querySelector(`.${labelCls}-extra`);
        expect(extra).toHaveTextContent('extra');
        expect(document.querySelectorAll(`.${labelCls}-with-extra`)).toHaveLength(1);
    });

    it('同页两个带 label 的分组，group id 与 label id 都不重复', () => {
        render(GroupLabel);
        const groups = screen.getAllByRole('group');
        const labels = [...document.querySelectorAll(`.${labelCls}`)];
        const ids = [...groups, ...labels].map((el) => el.id);
        expect(ids.every(Boolean)).toBe(true);
        expect(new Set(ids).size).toBe(4);
    });

    it('label.name 作为分组 id，label.id 作为 label 的 id', () => {
        render(InputGroup, {
            props: { label: { text: 'Score', name: 'score', id: 'score-label' } },
            slots: { default: () => <Input /> },
        });
        const group = screen.getByRole('group', { name: 'Score' });
        expect(group).toHaveAttribute('id', 'score');
        expect(group).toHaveAttribute('aria-labelledby', 'score-label');
        expect(document.querySelector(`.${labelCls}`)).toHaveAttribute('id', 'score-label');
    });

    it('label.text 为 0 时仍渲染 label', () => {
        render(InputGroup, { props: { label: { text: 0 } }, slots: { default: () => <Input /> } });
        expect(document.querySelector(`.${prefixCls}-group-wrapper`)).not.toBeNull();
        expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
    });

    it('size 属性同时作用于分组与子项', () => {
        render(InputGroup, { props: { size: 'large' }, slots: { default: () => <Input /> } });
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
    });

    it('单个子节点', () => {
        render(InputGroup, { slots: { default: () => <Input /> } });
        expect(document.querySelectorAll('input')).toHaveLength(1);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { InputGroup: { size: 'large' } };
        render(InputGroup, { slots: { default: () => <Input /> } });
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
    });

    it('$el 无 label 时是分组元素，有 label 时是外层容器', () => {
        const plain = renderGroup();
        expect(plain.el()).toBe(screen.getByRole('group'));
        plain.unmount();
        const labelled = renderGroup({ label: { text: 'Score' } });
        expect(labelled.el()).toHaveClass(`${prefixCls}-group-wrapper`);
        expect(labelled.el()).toContainElement(screen.getByRole('group'));
    });
});
