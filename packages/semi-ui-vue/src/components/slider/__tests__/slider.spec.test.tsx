/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sliderSpec, type SliderSpecProps } from '@test/specs/slider';
import { render } from '@test/utils/vue';
import Slider from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<SliderSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { direction, value, ...props } = state;
            return <ConfigProvider direction={direction}>{() => <Slider {...props} modelValue={value} />}</ConfigProvider>;
        })
    );
    return {
        container: view.container as HTMLElement,
        update: async (next) => {
            Object.assign(state, next);
            await nextTick();
        },
        unmount: () => view.unmount(),
    };
};

sliderSpec(mount);
