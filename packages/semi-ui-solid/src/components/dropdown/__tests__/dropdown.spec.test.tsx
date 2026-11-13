import { createSignal, For, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { dropdownSpec, type DropdownSpecItem, type DropdownSpecProps } from '@test/specs/dropdown';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Dropdown from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<DropdownSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const renderItems = (list: DropdownSpecItem[]) => (
        <Dropdown.Menu>
            <For each={list}>
                {(entry) =>
                    entry.submenu ? (
                        <Dropdown motion={false} position="rightTop" render={renderItems(entry.submenu)} trigger="click">
                            {(t) => (
                                <Dropdown.Item {...t()} active={entry.active} disabled={entry.disabled}>
                                    {entry.name}
                                </Dropdown.Item>
                            )}
                        </Dropdown>
                    ) : (
                        <Dropdown.Item active={entry.active} disabled={entry.disabled} onClick={() => props().onItemClick?.(entry.name)}>
                            {entry.name}
                        </Dropdown.Item>
                    )
                }
            </For>
        </Dropdown.Menu>
    );
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Dropdown motion={false} mouseEnterDelay={0} mouseLeaveDelay={0} render={renderItems(props().items)} {...splitProps(props(), ['items', 'direction', 'onItemClick'])[1]}>
                {(t) => <button {...t()}>trigger</button>}
            </Dropdown>
            <button type="button">after</button>
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

dropdownSpec(mount);
