import clsx from 'clsx';
import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import { hsvaToHslString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
import useFoundation from '../_base/use-foundation';
import { useLocale } from '../locale';

export interface ColorSliderProps {
    hue: number;
    width: number;
    height: number;
    handleSize: number;
    class?: string;
    onChange: (hue: number) => void;
}

type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

export default function ColorSlider(props: ColorSliderProps) {
    const locale = useLocale('ColorPicker');

    let dom: HTMLDivElement | undefined;

    const foundationProps: ColorSliderBaseProps = {
        get width() {
            return props.width;
        },
        get value() {
            return props.hue;
        },
        max: 360,
        get onChange() {
            return props.onChange;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        foundationProps,
        () => ColorSliderFoundation.getInitialState(),
        () => ({
            getDOM: () => dom as HTMLDivElement,
            notifyChange: (value) => props.onChange(value),
        })
    );

    return (
        <div ref={(node) => (dom = node)} class={clsx(`${cssClasses.PREFIX}-colorSlider`, props.class)} style={{ width: `${props.width}px`, height: `${props.height}px` }} onLostPointerCapture={foundation.handleLostPointerCapture} onPointerDown={foundation.handlePointerDown} onPointerMove={foundation.handlePointerMove}>
            <div
                class={`${cssClasses.PREFIX}-handle`}
                style={{
                    width: `${props.handleSize}px`,
                    height: `${props.handleSize}px`,
                    left: `${ColorSliderFoundation.getHandlePosition(foundationProps, props.handleSize)}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    'background-color': hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 }),
                }}
            >
                <input
                    type="range"
                    class={`${cssClasses.PREFIX}-handleSlider`}
                    aria-label={locale().locale.hue}
                    max={360}
                    min={0}
                    value={Math.round(props.hue)}
                    onInput={(event) => {
                        foundation.setValue(Number(event.currentTarget.value));
                        // a change the owner does not accept leaves `value` unchanged, so the native range keeps its step
                        event.currentTarget.value = String(Math.round(props.hue));
                    }}
                    onKeyDown={foundation.handleKeyDown}
                />
            </div>
        </div>
    );
}
