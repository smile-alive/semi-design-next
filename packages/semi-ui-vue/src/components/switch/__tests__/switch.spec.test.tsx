/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { switchSpec, type SwitchSpecProps } from '@test/specs/switch';
import { render } from '@test/utils/vue';
import Switch from '..';

const mount: SpecMount<SwitchSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { checked, checkedText, uncheckedText, tabIndex, ...props } = state;
            return (
                <Switch {...props} modelValue={checked} tabindex={tabIndex}>
                    {{
                        checkedText: checkedText === undefined ? undefined : () => checkedText,
                        uncheckedText: uncheckedText === undefined ? undefined : () => uncheckedText,
                    }}
                </Switch>
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

switchSpec(mount);
