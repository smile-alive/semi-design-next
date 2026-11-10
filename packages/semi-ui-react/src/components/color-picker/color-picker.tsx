import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps, type ColorPickerState } from '@fibrae/semi-foundation/components/color-picker/foundation';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/color-picker/color-picker.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover';
import AlphaSlider from './alpha-slider';
import ColorChooseArea from './color-choose-area';
import ColorSlider from './color-slider';
import DataPart from './data-part';

type Foundation = ColorPickerFoundation<ColorPickerProps>;
type Adapter = ColorPickerAdapter<ColorPickerProps>;

export interface ColorPickerReactProps extends ColorPickerProps, ElementProps<'div', 'defaultValue' | 'onChange'> {
    usePopover?: boolean;
    popoverProps?: PopoverProps;
    className?: string;
    style?: React.CSSProperties;
    bottomSlot?: React.ReactNode;
    topSlot?: React.ReactNode;
    /** The popover trigger when `usePopover`, a swatch of the current color by default; ignored otherwise */
    children?: React.ReactNode;
    /** Attached to the picker div, which is inside the popover when `usePopover` */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    defaultValue: {
        hsva: { h: 176, s: 71, v: 77, a: 1 },
        rgba: { r: 57, g: 197, b: 187, a: 1 },
        hex: '#39c5bb',
    },
    alpha: true,
    eyeDropper: true,
    defaultFormat: 'hex',
} satisfies Partial<ColorPickerReactProps>;

function ColorPicker(rawProps: ColorPickerReactProps) {
    const props = useDefaultProps('ColorPicker', rawProps, defaultProps);

    // The root is not focusable; a Tooltip around the picker injects a tabIndex that would add a Tab stop of its own
    const { ref, value, defaultValue, onChange, alpha, width: widthProp, height, defaultFormat, eyeDropper, usePopover, popoverProps, className, style, topSlot, bottomSlot, children, tabIndex, ...rest } = props;

    const { locale } = useLocale('ColorPicker');

    const [foundation, state] = useFoundation<Foundation, Adapter, ColorPickerProps, ColorPickerState>(
        ColorPickerFoundation,
        props,
        () => ColorPickerFoundation.getInitialState(props),
        (base) => ({ notifyChange: (value) => base.getProps().onChange?.(value) })
    );

    const currentColor = ColorPickerFoundation.deriveColor(props, state);
    const width = widthProp ?? 280;

    const picker = (
        <div role={namedRole(rest)} {...rest} ref={ref} className={clsx(cssClasses.PREFIX, className)} style={style}>
            {topSlot}
            <ColorChooseArea height={height ?? 280} hsva={currentColor.hsva} width={width} handleSize={20} onChange={foundation.handleAreaChange} />
            <ColorSlider className="colorSliderWrapper" height={10} hue={currentColor.hsva.h} width={width} handleSize={18} onChange={foundation.handleHueChange} />
            {alpha && <AlphaSlider className="alphaSliderWrapper" height={10} hsva={currentColor.hsva} width={width} handleSize={18} onChange={foundation.handleAlphaChange} />}
            <DataPart alpha={alpha} currentColor={currentColor} defaultFormat={defaultFormat} eyeDropper={eyeDropper} width={width} onAlphaChange={foundation.handleAlphaChange} onChange={foundation.handleChange} />
            {bottomSlot}
        </div>
    );

    if (!usePopover) {
        return picker;
    }

    return (
        <Popover
            {...popoverProps}
            className={clsx(`${cssClasses.PREFIX}-popover`, popoverProps?.className)}
            aria-label={popoverProps?.['aria-label'] ?? (popoverProps?.['aria-labelledby'] ? undefined : locale.color)}
            // a dialog opened by click: moving the pointer away must not close it mid-edit
            role={popoverProps?.role ?? 'dialog'}
            content={picker}
            trigger={popoverProps?.trigger ?? 'click'}
        >
            {children ?? <button type="button" className={clsx(`${cssClasses.PREFIX}-popover-defaultChildren`)} style={{ backgroundColor: currentColor.hex }} aria-label={locale.color} />}
        </Popover>
    );
}

export type { ColorValue } from '@fibrae/semi-foundation/components/color-picker/foundation';
export type { ColorFormat, HsvaColor, RgbaColor } from '@fibrae/semi-foundation/components/color-picker/interface';

export default Object.assign(ColorPicker, { colorStringToValue: ColorPickerFoundation.colorStringToValue });
