/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { cascaderSpec, type CascaderSpecProps } from '@test/specs/cascader';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Cascader from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<CascaderSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { direction, value, onChangeWithObject, ...props } = state;
            return <ConfigProvider direction={direction}>{() => <Cascader {...(props as object)} modelValue={value as never} changeWithObject={onChangeWithObject} motion={false} />}</ConfigProvider>;
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

cascaderSpec(mount);
