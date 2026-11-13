/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSpec, type TreeSpecProps } from '@test/specs/tree';
import { render } from '@test/utils/vue';
import Tree, { type TreeLabelSlotProps } from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<TreeSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { direction, labelButtons, onLabelButtonPress, value, ...props } = state;
            return (
                <ConfigProvider direction={direction}>
                    {() => (
                        <Tree motion={false} modelValue={value} {...props}>
                            {labelButtons
                                ? {
                                      label: ({ item, label }: TreeLabelSlotProps) => (
                                          <button
                                              type="button"
                                              onClick={(event: MouseEvent) => {
                                                  event.stopPropagation();
                                                  onLabelButtonPress?.(item.key);
                                              }}
                                          >
                                              {label}
                                          </button>
                                      ),
                                  }
                                : undefined}
                        </Tree>
                    )}
                </ConfigProvider>
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

treeSpec(mount);
