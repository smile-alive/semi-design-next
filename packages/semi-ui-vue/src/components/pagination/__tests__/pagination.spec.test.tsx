/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { paginationSpec, type PaginationSpecProps } from '@test/specs/pagination';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Pagination from '..';

const mount: SpecMount<PaginationSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { attrs, ...props } = state;
            return <Pagination {...attrs} {...props} />;
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

paginationSpec(mount);
