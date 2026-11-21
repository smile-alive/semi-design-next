import type { JSX } from 'solid-js';
import clsx from 'clsx';
import ColorChooseAreaFoundation, { type ColorChooseAreaAdapter, type ColorChooseAreaBaseProps, type ColorChooseAreaBaseState } from '@fibrae/semi-foundation/components/color-picker/color-choose-area-foundation';
import { cssClasses, type ColorPickerPart } from '@fibrae/semi-foundation/components/color-picker/constants';
import ColorPickerFoundation from '@fibrae/semi-foundation/components/color-picker/foundation';
import { hsvaToHslString, hsvaToRgba } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/components/color-picker/utils/round';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import { useFoundation } from '../../base/index';
import { mergeStyles } from '../../utils/index';
import { useLocale } from '../locale';

export interface ColorChooseAreaProps extends ColorChooseAreaBaseProps {
    classNames?: Partial<Record<ColorPickerPart, string>>;
    styles?: Partial<Record<ColorPickerPart, JSX.CSSProperties | string>>;
}

type Foundation = ColorChooseAreaFoundation<ColorChooseAreaBaseProps>;
type Adapter = ColorChooseAreaAdapter<ColorChooseAreaBaseProps>;
type Axis = 's' | 'v';

export default function ColorChooseArea(props: ColorChooseAreaProps) {
    const locale = useLocale('ColorPicker');

    let dom: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, ColorChooseAreaBaseProps, ColorChooseAreaBaseState>(
        ColorChooseAreaFoundation,
        props,
        () => ColorChooseAreaFoundation.getInitialState(),
        () => ({
            getDOM: () => dom!,
            notifyChange: (newColor) => props.onChange(newColor),
        })
    );

    const handlePosition = () => ColorPickerFoundation.getHandlePositionByHSVA(props.hsva, { width: props.width, height: props.height }, props.handleSize);

    const handleColor = () => {
        const { r, g, b, a } = hsvaToRgba(props.hsva);
        return `rgba(${r},${g},${b},${a})`;
    };

    const valueText = () => formatLocale(locale().locale.saturationBrightness, { saturation: round(props.hsva.s), brightness: round(props.hsva.v) });

    const renderRange = (axis: Axis, name: () => string) => (
        <input
            type="range"
            class={`${cssClasses.PREFIX}-handleSlider`}
            aria-label={name()}
            aria-valuetext={valueText()}
            max={100}
            min={0}
            value={round(props.hsva[axis])}
            onInput={(event) => {
                foundation.setValue(axis, Number(event.currentTarget.value));
                // a change the owner does not accept leaves `value` unchanged, so the native range keeps its step
                event.currentTarget.value = String(round(props.hsva[axis]));
            }}
            onKeyDown={(event) => foundation.handleKeyDown(axis, event)}
        />
    );

    return (
        <div
            ref={(node) => (dom = node)}
            class={clsx(`${cssClasses.PREFIX}-colorChooseArea`, props.classNames?.area)}
            style={mergeStyles(
                {
                    'background-color': hsvaToHslString({ h: props.hsva.h, s: 100, v: 100, a: 1 }),
                    width: `${props.width}px`,
                    height: `${props.height}px`,
                    cursor: state().isHandleGrabbing ? 'grabbing' : 'pointer',
                },
                props.styles?.area
            )}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <div
                class={clsx(`${cssClasses.PREFIX}-handle`, props.classNames?.handle)}
                style={mergeStyles(
                    {
                        width: `${props.handleSize}px`,
                        height: `${props.handleSize}px`,
                        left: `${handlePosition().x}px`,
                        top: `${handlePosition().y}px`,
                        'background-color': handleColor(),
                    },
                    props.styles?.handle
                )}
            >
                {renderRange('s', () => locale().locale.saturation)}
                {renderRange('v', () => locale().locale.brightness)}
            </div>
        </div>
    );
}
