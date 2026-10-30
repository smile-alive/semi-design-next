/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Input, { TextArea } from '..';

type Modifiers = { lazy?: boolean; trim?: boolean; number?: boolean };

// Stands in for `<Input v-model.lazy="value">`; `accept: false` stands in for a one-way binding that rejects the update.
// `rerender` re-renders the host with a changed prop, as any parent update would.
function createHost(Control: typeof Input | typeof TextArea, modifiers: Modifiers, accept = true, extraProps: Record<string, unknown> = {}) {
    const rerender = ref(false);
    const Host = defineComponent(() => {
        const value = ref('');
        return () => (
            <>
                <Control aria-label="control" modelValue={value.value} modelModifiers={modifiers} validateStatus={rerender.value ? 'warning' : 'default'} onUpdate:modelValue={(next: string) => accept && (value.value = next)} {...extraProps} />
                <span data-testid="bound">{JSON.stringify(value.value)}</span>
            </>
        );
    });
    return { Host, rerender };
}

describe.each([
    ['Input', Input],
    ['TextArea', TextArea],
])('%s v-model.lazy', (_, Control) => {
    const bound = () => screen.getByTestId('bound');
    const control = () => screen.getByRole('textbox', { name: 'control' });

    it('输入过程中绑定值不变，输入框显示输入内容', async () => {
        render(createHost(Control, { lazy: true }).Host);
        await userEvent.type(control(), 'semi');
        expect(control()).toHaveValue('semi');
        expect(bound()).toHaveTextContent('""');
    });

    it('失焦触发 change 后绑定值更新', async () => {
        render(createHost(Control, { lazy: true }).Host);
        await userEvent.type(control(), 'semi');
        await userEvent.tab();
        expect(bound()).toHaveTextContent('"semi"');
        expect(control()).toHaveValue('semi');
    });

    it('.lazy.trim 在 change 时才更新，且去除首尾空白', async () => {
        render(createHost(Control, { lazy: true, trim: true }).Host);
        await userEvent.type(control(), ' a b ');
        expect(bound()).toHaveTextContent('""');
        expect(control()).toHaveValue(' a b ');
        await userEvent.tab();
        expect(bound()).toHaveTextContent('"a b"');
    });

    it('父组件不接受新值时，失焦后输入框回到 modelValue', async () => {
        render(createHost(Control, { lazy: true }, false).Host);
        await userEvent.type(control(), 'semi');
        expect(control()).toHaveValue('semi');
        await userEvent.tab();
        expect(bound()).toHaveTextContent('""');
        expect(control()).toHaveValue('');
    });

    it('未设 lazy 时每次输入都更新绑定值', async () => {
        render(createHost(Control, {}).Host);
        await userEvent.type(control(), 'ab');
        expect(bound()).toHaveTextContent('"ab"');
    });

    it('草稿期间父组件重新渲染，输入框仍显示输入内容', async () => {
        const { Host, rerender } = createHost(Control, { lazy: true });
        render(Host);
        await userEvent.type(control(), 'semi');
        rerender.value = true;
        await nextTick();
        expect(control()).toHaveValue('semi');
        expect(bound()).toHaveTextContent('""');
    });

    it('开启 composition：输入法上屏后文字保留，失焦才更新绑定值', async () => {
        const { Host, rerender } = createHost(Control, { lazy: true }, true, { composition: true });
        render(Host);
        await userEvent.click(control());
        await fireEvent.compositionStart(control());
        await fireEvent.update(control(), '中文');
        await fireEvent.compositionEnd(control());
        rerender.value = true;
        await nextTick();
        expect(control()).toHaveValue('中文');
        expect(bound()).toHaveTextContent('""');
        await fireEvent.change(control());
        expect(bound()).toHaveTextContent('"中文"');
    });

    it('开启 composition：已有草稿后再次组合，组合中的文字在重渲染后保留', async () => {
        render(createHost(Control, { lazy: true }, true, { composition: true }).Host);
        await userEvent.click(control());
        await fireEvent.compositionStart(control());
        await fireEvent.update(control(), '中');
        await fireEvent.compositionEnd(control());
        await fireEvent.compositionStart(control());
        const el = control() as HTMLInputElement | HTMLTextAreaElement;
        el.value = '中w';
        el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
        await nextTick();
        expect(control()).toHaveValue('中w');
    });

    it('超出 getValueLength 限制的输入被截断回上限', async () => {
        render(createHost(Control, { lazy: true }, true, { maxlength: 3, getValueLength: (text: string) => text.length }).Host);
        await userEvent.click(control());
        await fireEvent.update(control(), 'abc');
        await fireEvent.update(control(), 'abcd');
        await nextTick();
        expect(control()).toHaveValue('abc');
    });

    it('change 事件仍在每次输入时触发', async () => {
        const change = vi.fn<(value: string) => void>();
        render(Control, { props: { modelModifiers: { lazy: true }, onChange: change } });
        await userEvent.type(screen.getByRole('textbox'), 'ab');
        expect(change.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
    });
});

describe.each([
    ['Input', Input],
    ['TextArea', TextArea],
])('%s v-model.trim', (_, Control) => {
    it('输入末尾空格后，无关的重新渲染不覆盖输入框里的文本', async () => {
        const { Host, rerender } = createHost(Control, { trim: true });
        render(Host);
        const control = screen.getByRole('textbox', { name: 'control' });
        await userEvent.type(control, 'a ');
        expect(screen.getByTestId('bound')).toHaveTextContent('"a"');
        rerender.value = true;
        await nextTick();
        expect(control).toHaveValue('a ');
    });
});

describe('Input v-model.lazy 草稿显示', () => {
    it('密码模式下点击眼睛按钮，已输入的内容保留', async () => {
        render(createHost(Input, { lazy: true }, true, { mode: 'password' }).Host);
        const input = screen.getByLabelText('control');
        await userEvent.type(input, 'secret');
        await fireEvent.click(screen.getByRole('button'));
        expect(input).toHaveValue('secret');
    });

    it('草稿非空时出现清除按钮', async () => {
        render(createHost(Input, { lazy: true }, true, { showClear: true }).Host);
        expect(screen.queryByRole('button')).toBeNull();
        await userEvent.type(screen.getByLabelText('control'), 'a');
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('有草稿时点击清除按钮，绑定值立即清空', async () => {
        render(createHost(Input, { lazy: true }, true, { showClear: true }).Host);
        const input = screen.getByLabelText('control');
        await userEvent.type(input, 'semi');
        await userEvent.tab();
        await userEvent.type(input, 'x');
        expect(screen.getByTestId('bound')).toHaveTextContent('"semi"');
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByTestId('bound')).toHaveTextContent('""');
        expect(input).toHaveValue('');
    });
});

describe('TextArea v-model.lazy 草稿显示', () => {
    it('计数器随草稿变化', async () => {
        render(createHost(TextArea, { lazy: true }, true, { showCounter: true }).Host);
        await userEvent.type(screen.getByLabelText('control'), 'abc');
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
