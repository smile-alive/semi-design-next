import { render } from '@testing-library/react';
import { ConfigProvider, TabPane, Tabs } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tabsSpec, type TabsSpecProps } from '@test/specs/tabs';

function Fixture({ items, direction, ...props }: TabsSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <Tabs {...props}>
                {items.map(({ content, ...item }) => (
                    <TabPane key={item.itemKey} {...item}>
                        {content}
                    </TabPane>
                ))}
            </Tabs>
        </ConfigProvider>
    );
}

const mount: SpecMount<TabsSpecProps> = (initial) => {
    let props = initial;
    const view = render(<Fixture {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<Fixture {...props} />);
        },
        unmount: view.unmount,
    };
};

tabsSpec(mount);
