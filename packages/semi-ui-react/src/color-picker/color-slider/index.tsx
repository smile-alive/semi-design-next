import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/color-picker/color-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import { hsvaToHslString } from '@fibrae/semi-foundation/color-picker/utils/convert';
import useFoundation from '../../_base/use-foundation';
import useLocale from '../../locale/use-locale';

export interface ColorSliderProps extends ColorSliderBaseProps {
    className?: string;
    style?: React.CSSProperties;
}

function getHandlePosition({ hue, width, handleSize }: ColorSliderBaseProps) {
    return (hue / 360) * width - handleSize / 2;
}

export default function ColorSlider(props: ColorSliderProps) {
    const { hue, width, height, handleSize, className, style } = props;

    const { locale } = useLocale('ColorPicker');

    const domRef = useRef<HTMLDivElement>(null);

    const [foundation] = useFoundation<ColorSliderFoundation<ColorSliderBaseProps>, ColorSliderAdapter<ColorSliderBaseProps>, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        () => ({ getDOM: () => domRef.current })
    );

    return (
        <div
            ref={domRef}
            className={clsx(`${cssClasses.PREFIX}-colorSlider`, className)}
            style={{
                width,
                height,
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
                    left: getHandlePosition(props),
                    top: `50%`,
                    transform: `translateY(-50%)`,
                    backgroundColor: hsvaToHslString({ h: hue, s: 100, v: 100, a: 1 }),
                }}
            >
                <input type="range" className={`${cssClasses.PREFIX}-handleSlider`} aria-label={locale.hue} max={360} min={0} value={Math.round(hue)} onChange={(e) => foundation.setValue(Number(e.target.value))} onKeyDown={foundation.handleKeyDown} />
            </div>
        </div>
    );
}
