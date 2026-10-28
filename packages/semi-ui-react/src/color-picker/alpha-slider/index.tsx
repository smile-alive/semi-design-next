import type React from 'react';
import { useRef } from 'react';
import AlphaSliderFoundation, { type AlphaSliderAdapter, type AlphaSliderBaseProps, type AlphaSliderBaseState } from '@fibrae/semi-foundation/color-picker/alpha-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
import useFoundation from '../../_base/use-foundation';
import useLocale from '../../locale/use-locale';

export interface AlphaSliderProps extends AlphaSliderBaseProps {
    className?: string;
    style?: React.CSSProperties;
}

function getHandlePosition({ hsva, width, handleSize }: AlphaSliderBaseProps) {
    return hsva.a * width - handleSize / 2;
}

export default function AlphaSlider(props: AlphaSliderProps) {
    const { hsva, width, height, handleSize, style } = props;

    const { locale } = useLocale('ColorPicker');

    const domRef = useRef<HTMLDivElement>(null);

    const [foundation] = useFoundation<AlphaSliderFoundation<AlphaSliderBaseProps>, AlphaSliderAdapter<AlphaSliderBaseProps>, AlphaSliderBaseProps, AlphaSliderBaseState>(
        AlphaSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        () => ({ getDOM: () => domRef.current })
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
                        left: getHandlePosition(props),
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
