import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sliderSpec, type SliderSpecProps } from '@test/specs/slider';
import Slider from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<SliderSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Slider {...splitProps(props(), ['direction', 'ariaLabel'])[1]} aria-label={props().ariaLabel} />
        </ConfigProvider>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

sliderSpec(mount);
