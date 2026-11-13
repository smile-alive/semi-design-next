/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tagInputSpec, type TagInputSpecProps } from '@test/specs/tag-input';
import { render } from '@test/utils/vue';
import TagInput from '..';

const mount: SpecMount<TagInputSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { attrs, value, ...props } = state;
            return <TagInput {...attrs} {...props} modelValue={value} />;
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

tagInputSpec(mount);
