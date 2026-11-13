/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { modalSpec, type ModalSpecProps } from '@test/specs/modal';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Modal from '../modal.vue';

const mount: SpecMount<ModalSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { content, stacked, afterClose, ...props } = state;
            return (
                <>
                    <Modal motion={false} onAfterClose={afterClose} {...props}>
                        {() => <p>{content}</p>}
                    </Modal>
                    {stacked && <Modal motion={false} {...stacked} />}
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

modalSpec(mount);
