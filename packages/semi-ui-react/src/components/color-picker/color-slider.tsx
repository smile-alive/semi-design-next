import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
import { cssClasses, type ColorPickerPart } from '@fibrae/semi-foundation/components/color-picker/constants';
import { hsvaToHslString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import { useFoundation } from '../../base/index';
import useLocale from '../locale/use-locale';

type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

export interface ColorSliderProps {
    hue: number;
    width: number;
    height: number;
    handleSize: number;
    className?: string;
    style?: React.CSSProperties;
    classNames?: Partial<Record<ColorPickerPart, string>>;
    styles?: Partial<Record<ColorPickerPart, React.CSSProperties>>;
    onChange: (hue: number) => void;
}

export default function ColorSlider({ hue, width, height, handleSize, className, style, classNames, styles, onChange }: ColorSliderProps) {
    const { locale } = useLocale('ColorPicker');

    const domRef = useRef<HTMLDivElement>(null);

    const foundationProps = { width, value: hue, max: 360, onChange };

    const [foundation] = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        foundationProps,
        () => ColorSliderFoundation.getInitialState(),
        (base) => ({
            getDOM: () => domRef.current,
            notifyChange: (value) => base.getProps().onChange(value),
        })
    );

    return (
        <div
            ref={domRef}
            className={clsx(`${cssClasses.PREFIX}-colorSlider`, className, classNames?.hue)}
            style={{
                width,
                height,
                ...style,
                ...styles?.hue,
            }}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <div
                className={clsx(`${cssClasses.PREFIX}-handle`, classNames?.handle)}
                style={{
                    width: handleSize,
                    height: handleSize,
                    left: ColorSliderFoundation.getHandlePosition(foundationProps, handleSize),
                    top: `50%`,
                    transform: `translateY(-50%)`,
                    backgroundColor: hsvaToHslString({ h: hue, s: 100, v: 100, a: 1 }),
                    ...styles?.handle,
                }}
            >
                <input type="range" className={`${cssClasses.PREFIX}-handleSlider`} aria-label={locale.hue} max={360} min={0} value={Math.round(hue)} onChange={(e) => foundation.setValue(Number(e.target.value))} onKeyDown={foundation.handleKeyDown} />
            </div>
        </div>
    );
}
