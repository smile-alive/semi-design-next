import { createSignal, For, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tabsSpec, type TabsSpecProps } from '@test/specs/tabs';
import Tabs from '..';
import ConfigProvider from '../../config-provider';

const { TabPane } = Tabs;

const mount: SpecMount<TabsSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Tabs {...splitProps(props(), ['items', 'direction'])[1]}>
                <For each={props().items}>{({ content, ...item }) => <TabPane {...item}>{content}</TabPane>}</For>
            </Tabs>
        </ConfigProvider>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

tabsSpec(mount);
