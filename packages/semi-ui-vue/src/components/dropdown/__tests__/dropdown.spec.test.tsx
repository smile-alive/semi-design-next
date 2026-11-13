/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { dropdownSpec, type DropdownSpecItem, type DropdownSpecProps } from '@test/specs/dropdown';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Dropdown, { DropdownItem, DropdownMenu } from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<DropdownSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const renderItems = (list: DropdownSpecItem[], onItemClick: DropdownSpecProps['onItemClick']) => (
        <DropdownMenu>
            {() =>
                list.map(({ name, submenu, ...item }) =>
                    submenu ? (
                        <Dropdown key={name} motion={false} position="rightTop" trigger="click">
                            {{
                                default: () => <DropdownItem {...item}>{() => name}</DropdownItem>,
                                content: () => renderItems(submenu, onItemClick),
                            }}
                        </Dropdown>
                    ) : (
                        <DropdownItem key={name} {...item} onClick={() => onItemClick?.(name)}>
                            {() => name}
                        </DropdownItem>
                    )
                )
            }
        </DropdownMenu>
    );
    const view = render(
        defineComponent(() => () => {
            const { items, direction, onItemClick, ...props } = state;
            return (
                <ConfigProvider direction={direction}>
                    {() => (
                        <>
                            <Dropdown motion={false} mouseEnterDelay={0} mouseLeaveDelay={0} {...props}>
                                {{
                                    default: () => <button type="button">trigger</button>,
                                    content: () => renderItems(items, onItemClick),
                                }}
                            </Dropdown>
                            <button type="button">after</button>
                        </>
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

dropdownSpec(mount);
