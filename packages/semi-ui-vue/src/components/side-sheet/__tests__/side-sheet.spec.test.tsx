/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sideSheetSpec, type SideSheetSpecProps } from '@test/specs/side-sheet';
import { render } from '@test/utils/vue';
import SideSheet from '../side-sheet.vue';

const mount: SpecMount<SideSheetSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { content, stacked, afterVisibleChange, onCancel, ...props } = state;
            return (
                <>
                    <SideSheet motion={false} onAfterVisibleChange={afterVisibleChange} onCancel={onCancel} {...props}>
                        {() => [<p>{content}</p>, <button type="button">Inner</button>]}
                    </SideSheet>
                    {stacked && <SideSheet motion={false} {...stacked} />}
                </>
            );
        })
    );
    return {
        container: view.container as HTMLElement,
        update: async (next) => {
            Object.assign(state, next);
            await nextTick();
            await nextTick();
        },
        unmount: () => view.unmount(),
    };
};

sideSheetSpec(mount);
