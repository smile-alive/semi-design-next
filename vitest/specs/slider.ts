import { fireEvent, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

type SliderValue = number | number[];

/** Framework-free Slider props; each fixture maps the naming differences (`modelValue`, `bind:value`, `aria-label`) */
export interface SliderSpecProps {
    /** `undefined` is uncontrolled and falls back to `defaultValue` */
    value?: SliderValue;
    defaultValue?: SliderValue;
    range?: boolean;
    min?: number;
    max?: number;
    step?: number;
    vertical?: boolean;
    verticalReverse?: boolean;
    disabled?: boolean;
    marks?: Record<number, string>;
    showMarkLabel?: boolean;
    ariaLabel?: string;
    getAriaValueText?: (value: number, index?: number) => string;
    direction?: 'ltr' | 'rtl';
    // Solid declares the callback parameter as possibly undefined, so the common type has to admit it
    onChange?: (value: SliderValue | undefined) => void;
    onAfterChange?: (value: SliderValue | undefined) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-slider`;

export function sliderSpec(mount: SpecMount<SliderSpecProps>, options: SpecOptions = {}) {
    defineSpec('Slider（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<SliderSpecProps>;

        async function render(props: Partial<SliderSpecProps> = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        // every handle is a native range input; jsdom runs no key default action on it, so only the keys the component handles move it
        const inputs = () => view.getAllByRole('slider') as HTMLInputElement[];
        const values = () => inputs().map((input) => Number(input.value));
        // dom-testing-library's fireEvent does not wait for the framework, so flush with a no-op update
        const changeTo = async (input: HTMLInputElement, value: number) => {
            fireEvent.input(input, { target: { value: String(value) } });
            await handle.update({});
        };

        test('单值 slider 渲染一个原生 range 输入框：值、min、max、step 都在输入框上，不再重复输出 aria-value*', async () => {
            await render({ defaultValue: 50, min: 10, max: 90, step: 5 });
            expect(inputs()).toHaveLength(1);
            const [input] = inputs();
            expect(input).toHaveAttribute('type', 'range');
            expect(input).toHaveValue('50');
            expect(input).toHaveAttribute('min', '10');
            expect(input).toHaveAttribute('max', '90');
            expect(input).toHaveAttribute('step', '5');
            expect(input).not.toHaveAttribute('aria-valuenow');
            expect(input).not.toHaveAttribute('aria-valuemax');
        });

        test('没有 value 与 defaultValue 时，单值取 min，范围取 [min, min]', async () => {
            await render();
            expect(values()).toEqual([0]);
            handle.unmount();

            await render({ min: 5 });
            expect(values()).toEqual([5]);
            handle.unmount();

            await render({ range: true, min: 5 });
            expect(values()).toEqual([5, 5]);
        });

        test('范围 slider 有两个输入框，defaultValue 给出两端；两个输入框都横跨 slider 的 min 与 max', async () => {
            await render({ range: true, defaultValue: [20, 60], min: 0, max: 100 });
            expect(values()).toEqual([20, 60]);
            inputs().forEach((input) => {
                expect(input).toHaveAttribute('min', '0');
                expect(input).toHaveAttribute('max', '100');
            });
        });

        test('每个输入框都是 Tab 停靠点，按顺序先小端后大端', async () => {
            await render({ range: true, defaultValue: [20, 60] });
            const [minInput, maxInput] = inputs();
            await userEvent.tab();
            expect(minInput).toHaveFocus();
            await userEvent.tab();
            expect(maxInput).toHaveFocus();
        });

        test('键盘：右、上方向键增加一个 step，左、下方向键减少，到达 min 与 max 后不再越界；松开键后调用 onAfterChange', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            const onAfterChange = vi.fn<NonNullable<SliderSpecProps['onAfterChange']>>();
            await render({ defaultValue: 98, step: 1, onChange, onAfterChange });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowRight}');
            expect(values()).toEqual([99]);
            expect(onChange).toHaveBeenLastCalledWith(99);
            expect(onAfterChange).toHaveBeenLastCalledWith(99);
            await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
            expect(values()).toEqual([100]);
            await userEvent.keyboard('{ArrowLeft}');
            expect(values()).toEqual([99]);
            await userEvent.keyboard('{ArrowDown}');
            expect(values()).toEqual([98]);
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([99, 100, 99, 98]);
        });

        test('键盘：方向键按 step 移动，步长网格从 min 起算', async () => {
            await render({ defaultValue: 3, min: 3, max: 30, step: 5 });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowRight}');
            expect(values()).toEqual([8]);
            await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
            expect(values()).toEqual([3]);
        });

        // Semi's vertical track runs min at the top, so the arrow pointing at max is Down (Up with verticalReverse); the APG's "Up raises" does not hold here
        test('键盘：vertical 时指向 max 一端的方向键增加（默认为下，verticalReverse 时为上），右方向键也增加', async () => {
            await render({ defaultValue: 30, vertical: true });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowDown}');
            expect(values()).toEqual([31]);
            await userEvent.keyboard('{ArrowRight}');
            expect(values()).toEqual([32]);
            await userEvent.keyboard('{ArrowUp}');
            expect(values()).toEqual([31]);
            handle.unmount();

            await render({ defaultValue: 30, vertical: true, verticalReverse: true });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowUp}');
            expect(values()).toEqual([31]);
            await userEvent.keyboard('{ArrowDown}');
            expect(values()).toEqual([30]);
        });

        test('键盘：RTL 页面中水平 slider 的左方向键增加、右方向键减少', async () => {
            await render({ defaultValue: 30, direction: 'rtl' });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowLeft}');
            expect(values()).toEqual([31]);
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(values()).toEqual([29]);
        });

        test('aria-orientation 只在 vertical 时为 vertical', async () => {
            await render({ defaultValue: 30 });
            expect(inputs()[0]).not.toHaveAttribute('aria-orientation', 'vertical');
            await handle.update({ vertical: true });
            expect(inputs()[0]).toHaveAttribute('aria-orientation', 'vertical');
        });

        test('带 Alt、Ctrl 或 Meta 的方向键是浏览器快捷键：不移动手柄，也不结束一次变化', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            const onAfterChange = vi.fn<NonNullable<SliderSpecProps['onAfterChange']>>();
            await render({ defaultValue: 30, onChange, onAfterChange });
            await userEvent.tab();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                const down = new KeyboardEvent('keydown', { key: 'ArrowLeft', [modifier]: true, bubbles: true, cancelable: true });
                expect(inputs()[0].dispatchEvent(down)).toBe(true);
                fireEvent.keyUp(inputs()[0], { key: 'ArrowLeft', [modifier]: true });
            }
            expect(values()).toEqual([30]);
            expect(onChange).not.toHaveBeenCalled();
            expect(onAfterChange).not.toHaveBeenCalled();
        });

        test('输入框的 change（辅助技术或原生行为）移动手柄并报告新值', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            await render({ defaultValue: 30, onChange });
            await changeTo(inputs()[0], 31);
            expect(values()).toEqual([31]);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(31);
        });

        test('范围 slider：输入框 change 只移动那个手柄，且一端不能越过另一端', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            await render({ range: true, defaultValue: [20, 60], onChange });
            const [minInput, maxInput] = inputs();
            await changeTo(minInput, 40);
            expect(onChange).toHaveBeenLastCalledWith([40, 60]);
            await changeTo(maxInput, 10);
            expect(onChange).toHaveBeenLastCalledWith([40, 40]);
            expect(values()).toEqual([40, 40]);
        });

        test('范围 slider：方向键只移动当前聚焦的手柄', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            await render({ range: true, defaultValue: [20, 60], onChange });
            await userEvent.tab();
            await userEvent.tab();
            await userEvent.keyboard('{ArrowLeft}');
            expect(onChange).toHaveBeenLastCalledWith([20, 59]);
            expect(values()).toEqual([20, 59]);
            await userEvent.tab({ shift: true });
            await userEvent.keyboard('{ArrowRight}');
            expect(onChange).toHaveBeenLastCalledWith([21, 59]);
        });

        test('受控：输入框 change 只报告新值，手柄由 value 决定；value 改变后手柄跟随，超出范围时夹到 min 与 max', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            await render({ value: 30, onChange });
            await changeTo(inputs()[0], 31);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(31);
            expect(values()).toEqual([30]);

            await handle.update({ value: 20 });
            expect(values()).toEqual([20]);
            await handle.update({ value: 101 });
            expect(values()).toEqual([100]);
            await handle.update({ value: -10 });
            expect(values()).toEqual([0]);
        });

        test('受控的 value 为 0 时手柄在 0，不取 defaultValue', async () => {
            await render({ defaultValue: 50, value: 0 });
            expect(values()).toEqual([0]);
        });

        test('value 改回 undefined 后回到 defaultValue', async () => {
            await render({ range: true, defaultValue: [10, 20], value: [30, 80] });
            expect(values()).toEqual([30, 80]);
            await handle.update({ value: undefined });
            expect(values()).toEqual([10, 20]);
        });

        test('disabled：输入框被禁用，不在 Tab 顺序里，change 与键盘都不改变值', async () => {
            const onChange = vi.fn<NonNullable<SliderSpecProps['onChange']>>();
            await render({ range: true, defaultValue: [20, 60], disabled: true, onChange });
            inputs().forEach((input) => expect(input).toBeDisabled());
            await userEvent.tab();
            expect(inputs()).not.toContain(document.activeElement);
            await changeTo(inputs()[0], 30);
            expect(onChange).not.toHaveBeenCalled();
            expect(values()).toEqual([20, 60]);
        });

        test('marks 渲染每个刻度的标签；showMarkLabel 为 false 时只留刻度点', async () => {
            await render({ defaultValue: 30, marks: { 20: '20c', 40: '40c' } });
            expect(view.getByText('20c')).toBeInTheDocument();
            expect(view.getByText('40c')).toBeInTheDocument();
            expect(handle.container.querySelectorAll(`.${prefix}-dot`)).toHaveLength(2);
            handle.unmount();

            await render({ defaultValue: 30, marks: { 20: '20c', 40: '40c' }, showMarkLabel: false });
            expect(view.queryByText('20c')).toBeNull();
            expect(handle.container.querySelectorAll(`.${prefix}-dot`)).toHaveLength(2);
        });

        test('ariaLabel 作为滑块的可访问名称', async () => {
            await render({ ariaLabel: 'Volume', defaultValue: 30 });
            expect(view.getByRole('slider', { name: 'Volume' })).toBe(inputs()[0]);
        });

        test('getAriaValueText 给每个手柄的 aria-valuetext，参数是值和手柄序号', async () => {
            const getAriaValueText = (value: number, index?: number) => `${value}% (${index === 0 ? 'min' : 'max'})`;
            await render({ range: true, defaultValue: [20, 60], getAriaValueText });
            expect(inputs().map((input) => input.getAttribute('aria-valuetext'))).toEqual(['20% (min)', '60% (max)']);
        });
    });
}
