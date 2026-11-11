import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import type { HsvaColor } from '@fibrae/semi-foundation/components/color-picker/interface';
import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/components/color-picker/utils/round';
import { useFoundation } from '../../base/index';
import { useLocale } from '../locale';

export interface AlphaSliderProps {
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
    onChange: (alpha: number) => void;
}

type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

export default function AlphaSlider(props: AlphaSliderProps) {
    const locale = useLocale('ColorPicker');

    let dom: HTMLDivElement | undefined;

    const foundationProps: ColorSliderBaseProps = {
        get width() {
            return props.width;
        },
        get value() {
            return props.hsva.a * 100;
        },
        max: 100,
        get onChange() {
            return props.onChange;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        foundationProps,
        () => ColorSliderFoundation.getInitialState(),
        () => ({
            getDOM: () => dom!,
            notifyChange: (percent) => props.onChange(percent / 100),
        })
    );

    const percent = () => round(props.hsva.a * 100);

    return (
        <div ref={(node) => (dom = node)} class={`${cssClasses.PREFIX}-alphaSlider`} style={{ width: `${props.width}px`, height: `${props.height}px` }} onLostPointerCapture={foundation.handleLostPointerCapture} onPointerDown={foundation.handlePointerDown} onPointerMove={foundation.handlePointerMove}>
            <div class={`${cssClasses.PREFIX}-alphaSliderInner`} style={{ background: `linear-gradient(90deg, ${hsvaToHslaString({ ...props.hsva, a: 0 })}, ${hsvaToHslaString({ ...props.hsva, a: 1 })})` }}>
                <div
                    class={`${cssClasses.PREFIX}-alphaHandle`}
                    style={{
                        width: `${props.handleSize}px`,
                        height: `${props.handleSize}px`,
                        left: `${ColorSliderFoundation.getHandlePosition(foundationProps, props.handleSize)}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        'background-color': hsvaToRgbaString(props.hsva),
                    }}
                >
                    <input
                        type="range"
                        class={`${cssClasses.PREFIX}-handleSlider`}
                        aria-label={locale().locale.alpha}
                        aria-valuetext={`${percent()}%`}
                        max={100}
                        min={0}
                        value={percent()}
                        onInput={(event) => {
                            foundation.setValue(Number(event.currentTarget.value));
                            // a change the owner does not accept leaves `value` unchanged, so the native range keeps its step
                            event.currentTarget.value = String(percent());
                        }}
                        onKeyDown={foundation.handleKeyDown}
                    />
                </div>
            </div>
        </div>
    );
}
