import type React from 'react';
import { useRef } from 'react';
import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import type { HsvaColor } from '@fibrae/semi-foundation/components/color-picker/interface';
import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/components/color-picker/utils/round';
import useFoundation from '../_base/use-foundation';
import useLocale from '../locale/use-locale';

type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

export interface AlphaSliderProps {
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
    className?: string;
    style?: React.CSSProperties;
    onChange: (alpha: number) => void;
}

export default function AlphaSlider({ hsva, width, height, handleSize, style, onChange }: AlphaSliderProps) {
    const { locale } = useLocale('ColorPicker');

    const domRef = useRef<HTMLDivElement>(null);

    const foundationProps = { width, value: hsva.a * 100, max: 100, onChange };

    const [foundation] = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        foundationProps,
        () => ColorSliderFoundation.getInitialState(),
        (base) => ({
            getDOM: () => domRef.current,
            notifyChange: (percent) => base.getProps().onChange(percent / 100),
        })
    );

    const colorFrom = hsvaToHslaString({ ...hsva, a: 0 });
    const colorTo = hsvaToHslaString({ ...hsva, a: 1 });

    return (
        <div
            ref={domRef}
            className={`${cssClasses.PREFIX}-alphaSlider`}
            style={{
                width,
                height,
                ...style,
            }}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <div className={`${cssClasses.PREFIX}-alphaSliderInner`} style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}>
                <div
                    className={`${cssClasses.PREFIX}-alphaHandle`}
                    style={{
                        width: handleSize,
                        height: handleSize,
                        left: ColorSliderFoundation.getHandlePosition(foundationProps, handleSize),
                        top: `50%`,
                        transform: `translateY(-50%)`,
                        backgroundColor: hsvaToRgbaString(hsva),
                    }}
                >
                    <input type="range" className={`${cssClasses.PREFIX}-handleSlider`} aria-label={locale.alpha} aria-valuetext={`${round(hsva.a * 100)}%`} max={100} min={0} value={round(hsva.a * 100)} onChange={(e) => foundation.setValue(Number(e.target.value))} onKeyDown={foundation.handleKeyDown} />
                </div>
            </div>
        </div>
    );
}
