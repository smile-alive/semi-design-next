import AlphaSliderFoundation, { type AlphaSliderAdapter, type AlphaSliderBaseProps, type AlphaSliderBaseState } from '@fibrae/semi-foundation/color-picker/alpha-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
import useFoundation from '../_base/use-foundation';
import { useLocale } from '../locale';

export type AlphaSliderProps = AlphaSliderBaseProps;

type Foundation = AlphaSliderFoundation<AlphaSliderBaseProps>;
type Adapter = AlphaSliderAdapter<AlphaSliderBaseProps>;

export default function AlphaSlider(props: AlphaSliderProps) {
    const locale = useLocale('ColorPicker');

    let dom: HTMLDivElement | undefined;

    const { foundation } = useFoundation<Foundation, Adapter, AlphaSliderBaseProps, AlphaSliderBaseState>(
        AlphaSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        // the foundation guards a missing element itself
        () => ({ getDOM: () => dom as HTMLDivElement })
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
                        left: `${props.hsva.a * props.width - props.handleSize / 2}px`,
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
