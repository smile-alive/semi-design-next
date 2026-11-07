import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import ColorChooseAreaFoundation, { type ColorChooseAreaAdapter, type ColorChooseAreaBaseProps, type ColorChooseAreaBaseState } from '@fibrae/semi-foundation/components/color-picker/color-choose-area-foundation';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import ColorPickerFoundation from '@fibrae/semi-foundation/components/color-picker/foundation';
import { hsvaToHslString, hsvaToRgba } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/components/color-picker/utils/round';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import useFoundation from '../../base/use-foundation';
import useLocale from '../locale/use-locale';

type Foundation = ColorChooseAreaFoundation<ColorChooseAreaBaseProps>;
type Adapter = ColorChooseAreaAdapter<ColorChooseAreaBaseProps>;

export interface ColorChooseAreaProps extends ColorChooseAreaBaseProps {
    className?: string;
    style?: React.CSSProperties;
}

export default function ColorChooseArea(props: ColorChooseAreaProps) {
    const { hsva, handleSize, width, height, className, style } = props;

    const { locale } = useLocale('ColorPicker');

    const domRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, ColorChooseAreaBaseProps, ColorChooseAreaBaseState>(
        ColorChooseAreaFoundation,
        props,
        () => ColorChooseAreaFoundation.getInitialState(),
        (base) => ({
            getDOM: () => domRef.current,
            notifyChange: (newColor) => base.getProps().onChange(newColor),
        })
    );

    const handlePosition = ColorPickerFoundation.getHandlePositionByHSVA(hsva, { width, height }, handleSize);
    const currentColor = hsvaToRgba(hsva);
    const valueText = formatLocale(locale.saturationBrightness, { saturation: round(hsva.s), brightness: round(hsva.v) });

    const sliders = [
        { axis: 's', name: locale.saturation },
        { axis: 'v', name: locale.brightness },
    ] as const;

    return (
        <div
            ref={domRef}
            className={clsx(`${cssClasses.PREFIX}-colorChooseArea`, className)}
            style={{
                backgroundColor: hsvaToHslString({ h: hsva.h, s: 100, v: 100, a: 1 }),
                width,
                height,
                cursor: state.isHandleGrabbing ? 'grabbing' : 'pointer',
                ...style,
            }}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <div
                className={`${cssClasses.PREFIX}-handle`}
                style={{
                    width: handleSize,
                    height: handleSize,
                    left: handlePosition.x,
                    top: handlePosition.y,
                    backgroundColor: `rgba(${currentColor.r},${currentColor.g},${currentColor.b},${currentColor.a})`,
                }}
            >
                {sliders.map(({ axis, name }) => (
                    <input key={axis} type="range" className={`${cssClasses.PREFIX}-handleSlider`} aria-label={name} aria-valuetext={valueText} max={100} min={0} value={round(hsva[axis])} onChange={(e) => foundation.setValue(axis, Number(e.target.value))} onKeyDown={(e) => foundation.handleKeyDown(axis, e)} />
                ))}
            </div>
        </div>
    );
}
