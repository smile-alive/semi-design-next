/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { autoCompleteSpec, type AutoCompleteSpecProps } from '@test/specs/auto-complete';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import AutoComplete from '..';

const mount: SpecMount<AutoCompleteSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { value, ...props } = state;
            return (
                <>
                    <AutoComplete aria-label="City" modelValue={value} motion={false} {...props} />
                    <button type="button">after</button>
                </>
            );
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

autoCompleteSpec(mount);
