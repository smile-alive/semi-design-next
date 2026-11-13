/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tabsSpec, type TabsSpecProps } from '@test/specs/tabs';
import { render } from '@test/utils/vue';
import Tabs, { TabPane } from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<TabsSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { items, direction, ...props } = state;
            return (
                <ConfigProvider direction={direction}>
                    {() => (
                        <Tabs {...props}>
                            {() =>
                                items.map(({ content, tab, ...item }) => (
                                    <TabPane key={item.itemKey} {...item}>
                                        {{ default: () => content, tab: () => tab }}
                                    </TabPane>
                                ))
                            }
                        </Tabs>
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

tabsSpec(mount);
