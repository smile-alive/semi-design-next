/** @jsxImportSource vue */
import { type ComponentPublicInstance } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconEdit } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Input, { InputGroup, TextArea, type InputGroupProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import AutoComplete from '../../auto-complete';
import Button, { ButtonGroup } from '../../button';
import Cascader from '../../cascader';
import DatePicker from '../../date-picker';
import IconButton from '../../icon-button';
import InputNumber from '../../input-number';
import Select from '../../select';
import TagInput from '../../tag-input';
import TimePicker from '../../time-picker';
import TreeSelect from '../../tree-select';
import GroupChildren from './fixtures/group-children.vue';
import GroupLabel from './fixtures/group-label.vue';
import GroupProps from './fixtures/group-props.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const labelCls = `${BASE_CLASS_PREFIX}-form-field-label`;
const buttonCls = `${BASE_CLASS_PREFIX}-button`;
const getInput = () => document.querySelector('input') as HTMLInputElement;
const byPlaceholder = (text: string) => screen.getByPlaceholderText(text);
// Vue ignores an ancestor listener attached at or after the timestamp of an event coming up from a child, and the
// suite freezes the system clock, so time has to be moved on by hand.
function settle() {
    vi.setSystemTime(Date.now() + 10);
}
// A function ref receives the component instance, whose $el is the rendered root
function renderGroup(props: InputGroupProps = {}) {
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
}

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

    it('子项自带的 size 优先于组的，未写的子项取组的；未声明属性与 class、style 只落在分组元素', () => {
        render(GroupProps, { props: { groupDisabled: true } });
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', zh_CN.Input.group);
        expect(group).not.toHaveAttribute('aria-disabled');
        expect(group).toHaveClass(`${prefixCls}-group`, `${prefixCls}-small`, 'g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(group).toHaveAttribute('data-group', '1');
        expect(group).toHaveAttribute('aria-labelledby', 'external');
        expect(group.querySelectorAll('[data-group], [aria-labelledby], .g')).toHaveLength(0);
        expect(byPlaceholder('own-enabled')).toHaveClass(`${prefixCls}-small`);
        expect(byPlaceholder('shorthand')).toHaveClass(`${prefixCls}-small`);
        expect(byPlaceholder('inherit')).toHaveClass(`${prefixCls}-large`);
    });

    it('嵌套在包装元素里的 Input 也接收组的 size 与 disabled', () => {
        render(InputGroup, {
            props: { size: 'large', disabled: true },
            slots: {
                default: () => (
                    <div>
                        <span>
                            <Input placeholder="deep" />
                        </span>
                    </div>
                ),
            },
        });
        expect(byPlaceholder('deep')).toBeDisabled();
        expect(byPlaceholder('deep')).toHaveClass(`${prefixCls}-large`);
    });

    it('控件显式写的 size 与 disabled 优先于组的，size 写成 undefined 视为没写', () => {
        render(InputGroup, {
            props: { size: 'large', disabled: true },
            slots: {
                default: () => (
                    <>
                        <Input disabled={false} placeholder="enabled" size="small" />
                        <Input disabled placeholder="shorthand" size={undefined} />
                        <Input disabled={undefined} placeholder="unset" />
                        <Button disabled={false} size="small">
                            {() => 'own'}
                        </Button>
                    </>
                ),
            },
        });
        expect(byPlaceholder('enabled')).toBeEnabled();
        expect(byPlaceholder('enabled')).toHaveClass(`${prefixCls}-small`);
        expect(byPlaceholder('shorthand')).toHaveClass(`${prefixCls}-large`);
        expect(byPlaceholder('unset')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'own' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'own' })).toHaveClass(`${buttonCls}-size-small`);
    });

    it('组内没有显式值时，全局默认值排在组的值之后', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'small', disabled: true } };
        render(InputGroup, { props: { size: 'large' }, slots: { default: () => <Input placeholder="a" /> } });
        expect(byPlaceholder('a')).toHaveClass(`${prefixCls}-large`);
        expect(byPlaceholder('a')).toBeDisabled();
    });

    it('组没有设 size 时，组内控件取自己的全局默认 size', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'small' } };
        render(InputGroup, { slots: { default: () => <Input placeholder="a" /> } });
        expect(byPlaceholder('a')).toHaveClass(`${prefixCls}-small`);
    });

    it('TextArea 读组的 disabled，自身的 disabled 优先', () => {
        render(InputGroup, {
            props: { disabled: true },
            slots: {
                default: () => (
                    <div>
                        <TextArea placeholder="inherit" />
                        <TextArea disabled={false} placeholder="own" />
                    </div>
                ),
            },
        });
        expect(byPlaceholder('inherit')).toBeDisabled();
        expect(byPlaceholder('own')).toBeEnabled();
    });

    it('Button、IconButton 与 ButtonGroup 里的 Button 接收组的 size 与 disabled', () => {
        render(InputGroup, {
            props: { size: 'large', disabled: true },
            slots: {
                default: () => (
                    <div>
                        <Button>{() => 'plain'}</Button>
                        <IconButton aria-label="icon">{{ icon: () => <IconEdit /> }}</IconButton>
                        <ButtonGroup>{() => [<Button>a</Button>, <Button>b</Button>]}</ButtonGroup>
                    </div>
                ),
            },
        });
        for (const button of screen.getAllByRole('button')) {
            expect(button).toBeDisabled();
            expect(button).toHaveClass(`${buttonCls}-size-large`);
        }
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('ButtonGroup 自己的 size 与 disabled 优先于组的，分隔线跟随按钮的 disabled', () => {
        render(InputGroup, {
            props: { size: 'large', disabled: true },
            slots: {
                default: () => (
                    <div>
                        <ButtonGroup size="small">{() => [<Button>a</Button>, <Button>b</Button>]}</ButtonGroup>
                        <ButtonGroup disabled={false}>{() => [<Button>c</Button>, <Button>d</Button>]}</ButtonGroup>
                    </div>
                ),
            },
        });
        const [small, large] = document.querySelectorAll(`.${buttonCls}-group`);
        for (const button of small.querySelectorAll('button')) {
            expect(button).toHaveClass(`${buttonCls}-disabled`);
            expect(button).not.toHaveClass(`${buttonCls}-size-large`);
        }
        expect(small.querySelector(`.${buttonCls}-group-line`)).toHaveClass(`${buttonCls}-group-line-disabled`);
        for (const button of large.querySelectorAll('button')) {
            expect(button).toBeEnabled();
            expect(button).toHaveClass(`${buttonCls}-size-large`);
        }
        expect(large.querySelector(`.${buttonCls}-group-line`)).not.toHaveClass(`${buttonCls}-group-line-disabled`);
    });

    it('组的 aria-*、data-*、name 只落在分组元素，不传给任何子控件', () => {
        render(InputGroup, {
            attrs: { 'aria-describedby': 'hint', 'data-part': 'g', name: 'g' },
            slots: {
                default: () => (
                    <>
                        <Input />
                        <Button>{() => 'b'}</Button>
                    </>
                ),
            },
        });
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-describedby', 'hint');
        expect(group).toHaveAttribute('data-part', 'g');
        expect(group).toHaveAttribute('name', 'g');
        expect(group.querySelectorAll('[aria-describedby], [data-part], [name]')).toHaveLength(0);
    });

    it('使用方传入的 role、aria-label 与 aria-labelledby 优先于内置值', () => {
        render(InputGroup, {
            attrs: { role: 'radiogroup', 'aria-label': 'mine' },
            slots: { default: () => <Input /> },
        });
        expect(screen.getByRole('radiogroup', { name: 'mine' })).toBeInTheDocument();
        expect(screen.queryByRole('group')).toBeNull();
        expect(document.querySelector('input')).not.toHaveAttribute('role');
    });

    it('带 label 的分组：使用方传入的 id 与 aria-labelledby 优先，未声明属性落在 role="group" 的元素上', () => {
        render(InputGroup, {
            props: { label: { text: 'Score' } },
            attrs: { id: 'mine', 'aria-labelledby': 'external', 'data-part': 'g' },
            slots: { default: () => <Input /> },
        });
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('id', 'mine');
        expect(group).toHaveAttribute('aria-labelledby', 'external');
        expect(group).toHaveAttribute('data-part', 'g');
        expect(document.querySelector(`.${prefixCls}-group-wrapper`)).not.toHaveAttribute('data-part');
    });

    const slotButton = () => <Button>{() => 'slot'}</Button>;
    // the selector finds the part of the control that proves it read the group
    it.each([
        ['Select', () => <Select>{{ prefix: slotButton }}</Select>, `.${BASE_CLASS_PREFIX}-select-disabled`],
        ['Cascader', () => <Cascader>{{ prefix: slotButton }}</Cascader>, `.${BASE_CLASS_PREFIX}-cascader-disabled`],
        ['TreeSelect', () => <TreeSelect>{{ prefix: slotButton }}</TreeSelect>, `.${BASE_CLASS_PREFIX}-tree-select-disabled`],
        ['AutoComplete', () => <AutoComplete>{{ prefix: slotButton }}</AutoComplete>, 'input:disabled'],
        ['DatePicker', () => <DatePicker>{{ prefix: slotButton }}</DatePicker>, 'input:disabled'],
        ['TimePicker', () => <TimePicker>{{ prefix: slotButton }}</TimePicker>, 'input:disabled'],
        ['TagInput', () => <TagInput>{{ prefix: slotButton }}</TagInput>, 'input:disabled'],
        ['InputNumber', () => <InputNumber>{{ prefix: slotButton }}</InputNumber>, 'input:disabled'],
    ])('%s 读组的值，自身子树里的 Button 不读组', (_, control, readsGroup) => {
        const warn = vi.spyOn(console, 'warn');
        render(InputGroup, { props: { size: 'large', disabled: true }, slots: { default: () => <div>{control()}</div> } });
        expect(document.querySelector(readsGroup)).not.toBeNull();
        const inner = screen.getByRole('button', { name: 'slot' });
        expect(inner).toBeEnabled();
        expect(inner).not.toHaveClass(`${buttonCls}-size-large`);
        expect(warn).not.toHaveBeenCalled();
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
        expect(screen.getByRole('textbox', { name: 'prefix' })).toBeInTheDocument();
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
