/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tooltipSpec, type TooltipSpecProps } from '@test/specs/tooltip';
import { render } from '@test/utils/vue';
import Tooltip from '../tooltip.vue';

const mount: SpecMount<TooltipSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { content, contentButton, triggerDisabled, popupLabel, ...props } = state;
            return (
                <Tooltip {...props} aria-label={popupLabel} motion={false}>
                    {{
                        default: () => (
                            <button disabled={triggerDisabled} type="button">
                                trigger
                            </button>
                        ),
                        content: () => (
                            <>
                                {content}
                                {contentButton && <button type="button">{contentButton}</button>}
                            </>
                        ),
                    }}
                </Tooltip>
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

tooltipSpec(mount);
