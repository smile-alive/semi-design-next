/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { popconfirmSpec, type PopconfirmSpecProps } from '@test/specs/popconfirm';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Popconfirm from '../popconfirm.vue';

const mount: SpecMount<PopconfirmSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { ...props } = state;
            return (
                <Popconfirm {...props} motion={false}>
                    {{ default: () => <button type="button">trigger</button> }}
                </Popconfirm>
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

popconfirmSpec(mount);
