/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSelectSpec, type TreeSelectSpecProps } from '@test/specs/tree-select';
import { render } from '@test/utils/vue';
import TreeSelect from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<TreeSelectSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { direction, value, ...props } = state;
            return <ConfigProvider direction={direction}>{() => <TreeSelect motion={false} motionExpand={false} modelValue={value} {...props} />}</ConfigProvider>;
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

treeSelectSpec(mount);
