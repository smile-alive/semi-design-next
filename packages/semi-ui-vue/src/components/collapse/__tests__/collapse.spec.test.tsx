/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { collapseSpec, type CollapseSpecProps } from '@test/specs/collapse';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Collapse, { CollapsePanel } from '..';

const mount: SpecMount<CollapseSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { panels, ...props } = state;
            return (
                <Collapse {...props}>
                    {() =>
                        panels.map(({ content, header, extra, ...panel }) => (
                            <CollapsePanel key={panel.itemKey} {...panel}>
                                {{
                                    header: () => header,
                                    ...(extra === undefined ? {} : { extra: () => extra }),
                                    ...(content === undefined ? {} : { default: () => content }),
                                }}
                            </CollapsePanel>
                        ))
                    }
                </Collapse>
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

collapseSpec(mount);
