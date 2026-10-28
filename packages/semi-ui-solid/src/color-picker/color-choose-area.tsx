import ColorChooseAreaFoundation, { type ColorChooseAreaAdapter, type ColorChooseAreaBaseProps, type ColorChooseAreaBaseState } from '@fibrae/semi-foundation/color-picker/color-choose-area-foundation';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
import { hsvaToHslString, hsvaToRgba } from '@fibrae/semi-foundation/color-picker/utils/convert';
import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
import useFoundation from '../_base/use-foundation';
import { useLocale } from '../locale';

export type ColorChooseAreaProps = ColorChooseAreaBaseProps;

type Foundation = ColorChooseAreaFoundation<ColorChooseAreaBaseProps>;
type Adapter = ColorChooseAreaAdapter<ColorChooseAreaBaseProps>;
type Axis = 's' | 'v';

export default function ColorChooseArea(props: ColorChooseAreaProps) {
    const locale = useLocale('ColorPicker');

    let dom: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, ColorChooseAreaBaseProps, ColorChooseAreaBaseState>(
        ColorChooseAreaFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        () => ({
            // the foundation guards a missing element itself
            getDOM: () => dom as HTMLDivElement,
            notifyChange: (newColor) => props.onChange(newColor),
        })
    );

    const handlePosition = () => ColorPickerFoundation.getHandlePositionByHSVA(props.hsva, { width: props.width, height: props.height }, props.handleSize);

    const handleColor = () => {
        const { r, g, b, a } = hsvaToRgba(props.hsva);
        return `rgba(${r},${g},${b},${a})`;
    };

    const valueText = () =>
        locale()
            .locale.saturationBrightness.replace('${saturation}', String(round(props.hsva.s)))
            .replace('${brightness}', String(round(props.hsva.v)));

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
            class={`${cssClasses.PREFIX}-colorChooseArea`}
            style={{
                'background-color': hsvaToHslString({ h: props.hsva.h, s: 100, v: 100, a: 1 }),
                width: `${props.width}px`,
                height: `${props.height}px`,
                cursor: state().isHandleGrabbing ? 'grabbing' : 'pointer',
            }}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <div
                class={`${cssClasses.PREFIX}-handle`}
                style={{
                    width: `${props.handleSize}px`,
                    height: `${props.handleSize}px`,
                    left: `${handlePosition().x}px`,
                    top: `${handlePosition().y}px`,
                    'background-color': handleColor(),
                }}
            >
                {renderRange('s', () => locale().locale.saturation)}
                {renderRange('v', () => locale().locale.brightness)}
            </div>
        </div>
    );
}
