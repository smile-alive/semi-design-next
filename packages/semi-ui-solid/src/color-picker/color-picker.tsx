import { type JSX, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps as BaseColorPickerProps, type ColorPickerState, type ColorValue } from '@fibrae/semi-foundation/color-picker/foundation';
import '@fibrae/semi-foundation/color-picker/color-picker.scss';
import type { ElementProps } from '../_base/element-props';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import { useLocale } from '../locale';
import Popover, { type PopoverProps } from '../popover';
import AlphaSlider from './alpha-slider';
import ColorChooseArea from './color-choose-area';
import ColorSlider from './color-slider';
import DataPart from './data-part';

export interface ColorPickerProps extends BaseColorPickerProps, ElementProps<'div', 'defaultValue' | 'onChange' | 'children'> {
    usePopover?: boolean;
    popoverProps?: PopoverProps;
    bottomSlot?: JSX.Element;
    topSlot?: JSX.Element;
    /**
     * The popover trigger when `usePopover`, a swatch of the current color by default; ignored otherwise. A function
     * (declare its parameter) gets getTriggerProps for the element that takes focus
     */
    children?: PopoverProps['children'];
}

type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];
type Foundation = ColorPickerFoundation<BaseColorPickerProps>;
type Adapter = ColorPickerAdapter<BaseColorPickerProps>;

const DEFAULT_COLOR: ColorValue = {
    hsva: { h: 176, s: 71, v: 77, a: 1 },
    rgba: { r: 57, g: 197, b: 187, a: 1 },
    hex: '#39c5bb',
};

const defaultProps = {
    defaultValue: DEFAULT_COLOR,
    alpha: true,
    eyeDropper: true,
    defaultFormat: 'hex',
} satisfies Partial<ColorPickerProps>;

function ColorPicker(rawProps: ColorPickerProps) {
    const props = useDefaultProps('ColorPicker', rawProps, defaultProps);

    // tabIndex is dropped: the root is not focusable, and a Tooltip around the picker would add a Tab stop of its own
    const [local, rest] = splitProps(props, ['value', 'defaultValue', 'onChange', 'alpha', 'width', 'height', 'defaultFormat', 'eyeDropper', 'usePopover', 'popoverProps', 'class', 'topSlot', 'bottomSlot', 'children', 'tabIndex']);

    const locale = useLocale('ColorPicker');

    const { foundation, state } = useFoundation<Foundation, Adapter, BaseColorPickerProps, ColorPickerState>(
        ColorPickerFoundation,
        props,
        () => ({ currentColor: props.value ?? props.defaultValue }),
        () => ({ notifyChange: (value) => props.onChange?.(value) })
    );

    // shortcut: repeats ColorPickerFoundation.getCurrentColor, which is protected; share it when the foundation exports it
    const currentColor = () => (local.value !== undefined ? (local.value ?? local.defaultValue) : state().currentColor);

    const width = () => local.width ?? 280;

    const renderPicker = () => (
        <div {...rest} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role} class={clsx(cssClasses.PREFIX, local.class)}>
            {local.topSlot}
            <ColorChooseArea
                handleSize={20}
                height={local.height ?? 280}
                hsva={currentColor().hsva}
                width={width()}
                onChange={({ s, v }) => {
                    const { h, a } = currentColor().hsva;
                    foundation.handleChange({ h, s, v, a }, 'hsva');
                }}
            />
            <ColorSlider class="colorSliderWrapper" foundation={foundation} handleSize={18} height={10} hue={currentColor().hsva.h} width={width()} />
            <Show when={local.alpha}>
                <AlphaSlider foundation={foundation} handleSize={18} height={10} hsva={currentColor().hsva} width={width()} />
            </Show>
            <DataPart alpha={local.alpha} currentColor={currentColor()} defaultFormat={local.defaultFormat} eyeDropper={local.eyeDropper} foundation={foundation} width={width()} />
            {local.bottomSlot}
        </div>
    );

    useWatch(
        () => local.value,
        (value) => {
            if (value === undefined) {
                foundation.resetToDefault();
            }
        }
    );

    return (
        <Show when={local.usePopover} fallback={renderPicker()}>
            <Popover
                {...local.popoverProps}
                class={clsx(`${cssClasses.PREFIX}-popover`, local.popoverProps?.class)}
                aria-label={local.popoverProps?.['aria-label'] ?? (local.popoverProps?.['aria-labelledby'] ? undefined : locale().locale.color)}
                // a dialog opened by click: moving the pointer away must not close it mid-edit
                role={local.popoverProps?.role ?? 'dialog'}
                content={renderPicker}
                trigger={local.popoverProps?.trigger ?? 'click'}
            >
                {local.children ?? ((getTriggerProps) => <button {...getTriggerProps({ type: 'button' })} class={`${cssClasses.PREFIX}-popover-defaultChildren`} style={{ 'background-color': currentColor().hex }} aria-label={locale().locale.color} />)}
            </Popover>
        </Show>
    );
}

export default Object.assign(ColorPicker, { colorStringToValue: ColorPickerFoundation.colorStringToValue });
