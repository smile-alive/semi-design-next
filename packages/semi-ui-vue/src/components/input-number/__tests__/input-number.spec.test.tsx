/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { inputNumberSpec, type InputNumberSpecProps } from '@test/specs/input-number';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import InputNumber from '..';

const mount: SpecMount<InputNumberSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { value, className, onKeyDown, ...props } = state;
            return <InputNumber {...props} class={className} modelValue={value} onKeydown={onKeyDown} />;
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

inputNumberSpec(mount);
