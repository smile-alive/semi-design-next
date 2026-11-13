/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { popoverSpec, type PopoverSpecProps } from '@test/specs/popover';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Popover from '../popover.vue';

const mount: SpecMount<PopoverSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { content, contentButton, popupLabel, ...props } = state;
            return (
                <Popover {...props} aria-label={popupLabel} motion={false}>
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => (
                            <>
                                {content}
                                {contentButton && <button type="button">{contentButton}</button>}
                            </>
                        ),
                    }}
                </Popover>
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

popoverSpec(mount);
