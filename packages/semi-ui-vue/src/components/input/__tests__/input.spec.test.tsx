/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { inputSpec, type InputSpecProps } from '@test/specs/input';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Input from '..';

const mount: SpecMount<InputSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { value, className, maxLength, minLength, prefix, suffix, addonBefore, addonAfter, insetLabel, ...props } = state;
            const slot = (content: string | number | undefined) => (content === undefined ? undefined : () => String(content));
            return (
                <Input {...props} class={className} maxlength={maxLength} minlength={minLength} modelValue={value}>
                    {{ prefix: slot(prefix), suffix: slot(suffix), addonBefore: slot(addonBefore), addonAfter: slot(addonAfter), insetLabel: slot(insetLabel) }}
                </Input>
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

inputSpec(mount);
