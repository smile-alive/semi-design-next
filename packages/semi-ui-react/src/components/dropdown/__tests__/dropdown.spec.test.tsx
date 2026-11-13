import { render } from '@testing-library/react';
import { ConfigProvider, Dropdown } from '@fibrae/semi-ui-react';
import { dropdownSpec, type DropdownSpecItem, type DropdownSpecProps } from '@test/specs/dropdown';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ items, direction, onItemClick, ...props }: DropdownSpecProps) {
    const renderItems = (list: DropdownSpecItem[]) => (
        <Dropdown.Menu>
            {list.map(({ name, disabled, active, submenu }) =>
                submenu ? (
                    <Dropdown key={name} motion={false} position="rightTop" render={renderItems(submenu)} trigger="click">
                        <Dropdown.Item disabled={disabled} active={active}>
                            {name}
                        </Dropdown.Item>
                    </Dropdown>
                ) : (
                    <Dropdown.Item key={name} disabled={disabled} active={active} onClick={() => onItemClick?.(name)}>
                        {name}
                    </Dropdown.Item>
                )
            )}
        </Dropdown.Menu>
    );
    return (
        <ConfigProvider direction={direction}>
            <Dropdown motion={false} mouseEnterDelay={0} mouseLeaveDelay={0} render={renderItems(items)} {...props}>
                <button type="button">trigger</button>
            </Dropdown>
            <button type="button">after</button>
        </ConfigProvider>
    );
}

const mount: SpecMount<DropdownSpecProps> = (initial) => {
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

dropdownSpec(mount);
