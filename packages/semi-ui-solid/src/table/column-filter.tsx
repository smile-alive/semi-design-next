import { type JSX, For, Show, children, createComputed, createMemo, createSignal, on, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { toggleFilteredValue } from '@fibrae/semi-foundation/table/utils';
import { IconFilter } from '@fibrae/semi-icons-solid';
import Button from '../button';
import Checkbox from '../checkbox';
import Dropdown, { type GetDropdownTriggerProps } from '../dropdown';
import useLocale from '../locale/use-locale';
import Radio from '../radio';
import Space from '../space';
import type { Filter, FilterConfirmMode, FilterDropdownProps, FilterIcon, OnFilterDropdownVisibleChange, RenderFilterDropdownItem, RenderFilterDropdownProps } from './interface';

export interface OnSelectData {
    filteredValue?: any[];
}

export interface ColumnFilterProps {
    prefixCls?: string;
    filteredValue?: any[];
    filterIcon?: FilterIcon;
    filterDropdown?: () => JSX.Element;
    filterDropdownProps?: FilterDropdownProps;
    filters?: Filter[];
    filterMultiple?: boolean;
    filterDropdownVisible?: boolean;
    onSelect?: (data: OnSelectData) => void;
    onFilterDropdownVisibleChange?: OnFilterDropdownVisibleChange;
    renderFilterDropdown?: (props: RenderFilterDropdownProps) => JSX.Element;
    renderFilterDropdownItem?: RenderFilterDropdownItem;
    filterConfirmMode?: FilterConfirmMode;
}

interface FilterMenuProps {
    filter: ColumnFilterProps;
    filters: Filter[];
    level: number;
    /** The values checked in the menu, unconfirmed ones included */
    displayValue: () => any[];
    toggle: (value: any) => void;
    confirm: () => void;
    reset: () => void;
}

/** The options of one menu level; an option with children opens its own menu on hover */
function FilterMenuItems(props: FilterMenuProps) {
    const locale = useLocale('Table');

    const multiple = () => props.filter.filterMultiple ?? true;

    const isConfirmMode = () => (props.filter.filterConfirmMode ?? 'immediate') === 'confirm';

    const renderItem = (filter: Filter) => {
        const checked = () => props.displayValue().includes(filter.value);

        const changeFn = (e: MouseEvent) => {
            // keeps the pop-up layer open and stops the label click from firing twice
            e?.stopImmediatePropagation();
            e?.stopPropagation();
            e?.preventDefault();
            props.toggle(filter.value);
        };

        const custom = createMemo(() => {
            const render = props.filter.renderFilterDropdownItem;
            if (typeof render !== 'function') {
                return undefined;
            }
            const info = { onChange: changeFn, filterMultiple: multiple(), value: filter.value, text: filter.text, checked: checked(), filteredValue: props.displayValue(), level: props.level };
            return untrack(() => render(info));
        });

        const resolvedCustom = children(custom);

        const renderOption = (own: Record<string, unknown> = {}) => (
            <Show when={resolvedCustom.toArray().length === 0} fallback={resolvedCustom()}>
                <Dropdown.Item {...own} onClick={changeFn}>
                    <Show when={multiple()} fallback={<Radio checked={checked()}>{filter.text}</Radio>}>
                        <Checkbox checked={checked()}>{filter.text}</Checkbox>
                    </Show>
                </Dropdown.Item>
            </Show>
        );

        if (Array.isArray(filter.children) && filter.children.length) {
            // a submenu opening or closing is not the root menu opening or closing
            return (
                <FilterDropdown filter={props.filter} trigger="hover" position="right" render={() => <FilterMenuItems {...props} filters={filter.children ?? []} level={props.level + 1} />}>
                    {/* the user's item cannot take the trigger props, so the Dropdown wraps it */}
                    {resolvedCustom.toArray().length ? resolvedCustom() : (getTriggerProps: GetDropdownTriggerProps) => renderOption(getTriggerProps() as Record<string, unknown>)}
                </FilterDropdown>
            );
        }
        return renderOption();
    };

    return (
        <Dropdown.Menu>
            <For each={props.filters}>{renderItem}</For>
            <Show when={isConfirmMode() && props.level === 0}>
                <div class={`${cssClasses.PREFIX}-column-filter-footer`}>
                    <Space>
                        <Button size="small" onClick={() => props.reset()}>
                            {locale().locale.resetFilter}
                        </Button>
                        <Button size="small" theme="solid" onClick={() => props.confirm()}>
                            {locale().locale.confirmFilter}
                        </Button>
                    </Space>
                </div>
            </Show>
        </Dropdown.Menu>
    );
}

interface FilterDropdownComponentProps {
    filter: ColumnFilterProps;
    trigger: 'click' | 'hover';
    position: 'bottom' | 'right';
    render: () => JSX.Element;
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    onOpened?: () => void;
    children: JSX.Element | ((getTriggerProps: GetDropdownTriggerProps) => JSX.Element);
}

function FilterDropdown(props: FilterDropdownComponentProps) {
    const dropdownProps = () => props.filter.filterDropdownProps ?? {};

    return (
        <Dropdown
            {...dropdownProps()}
            // the column's own class is not the menu's
            class={clsx(`${cssClasses.PREFIX}-column-filter-dropdown`, dropdownProps().class)}
            trigger={dropdownProps().trigger ?? props.trigger}
            position={dropdownProps().position ?? props.position}
            render={props.render()}
            visible={props.visible}
            onVisibleChange={(visible) => props.onVisibleChange?.(visible)}
            onOpen={() => {
                dropdownProps().onOpen?.();
                props.onOpened?.();
            }}
        >
            {props.children}
        </Dropdown>
    );
}

export default function ColumnFilter(props: ColumnFilterProps) {
    const locale = useLocale('Table');

    const [pendingFilteredValue, setPendingFilteredValue] = createSignal<any[]>();

    const filterDropdown = children(() => props.filterDropdown?.());

    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    const confirmMode = () => (props.filterConfirmMode ?? 'immediate') === 'confirm';

    const isControlled = () => props.filterDropdownVisible !== undefined;

    const isCustomFilterDropdown = () => typeof props.renderFilterDropdown === 'function';

    const isCustomDropdownVisible = () => !isControlled() && (isCustomFilterDropdown() || confirmMode());

    // the initial value only: a custom dropdown starts closed, a controlled one as given
    const [dropdownVisible, setDropdownVisible] = createSignal<boolean | undefined>(untrack(() => (isCustomDropdownVisible() ? false : props.filterDropdownVisible)));

    const tempFilteredValue = () => pendingFilteredValue() ?? props.filteredValue;

    const filtered = () => Array.isArray(props.filteredValue) && props.filteredValue.length > 0;

    const filterIcon = createMemo(() => {
        const icon = props.filterIcon;
        const isFiltered = filtered();
        return icon ? untrack(() => icon(isFiltered)) : undefined;
    });

    const resolvedIcon = children(filterIcon);

    const displayValue = () => (confirmMode() ? (tempFilteredValue() ?? []) : (props.filteredValue ?? []));

    const handleFilterDropdownVisibleChange = (visible: boolean) => {
        if (isCustomDropdownVisible()) {
            setDropdownVisible(visible);
        }
        // an unconfirmed check is dropped on close, so the next opening starts from the applied value
        if (!visible && confirmMode()) {
            setPendingFilteredValue(undefined);
        }
        // the Dropdown asks before it opens; a menu this component controls reports the opening from onOpen, once
        // the panel is shown, so the callback can reach the panel's elements as with an uncontrolled menu
        if (visible && isCustomDropdownVisible()) {
            return;
        }
        props.onFilterDropdownVisibleChange?.(visible);
    };

    const requestClose = () => {
        if (isControlled()) {
            props.onFilterDropdownVisibleChange?.(false);
        } else {
            // the Dropdown does not report a close its owner applies
            handleFilterDropdownVisibleChange(false);
        }
    };

    const confirm: RenderFilterDropdownProps['confirm'] = (options = {}) => {
        const newFilteredValue = options.filteredValue || tempFilteredValue();
        if (!isEqual(newFilteredValue, props.filteredValue)) {
            props.onSelect?.({ filteredValue: newFilteredValue });
        }
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const clear: RenderFilterDropdownProps['clear'] = (options = {}) => {
        setPendingFilteredValue([]);
        props.onSelect?.({ filteredValue: [] });
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const reset = () => setPendingFilteredValue(undefined);

    // renderFilterDropdown is called once per opening with live fields
    const renderFilterDropdownProps: RenderFilterDropdownProps = {
        get tempFilteredValue() {
            return tempFilteredValue() ?? [];
        },
        setTempFilteredValue: (value) => setPendingFilteredValue(value),
        confirm,
        clear,
        close: requestClose,
        reset,
        get filters() {
            return props.filters;
        },
    };

    const toggle = (value: any) => {
        const multiple = props.filterMultiple ?? true;
        if (confirmMode()) {
            setPendingFilteredValue(toggleFilteredValue(tempFilteredValue() ?? props.filteredValue ?? [], value, multiple));
        } else {
            props.onSelect?.({ filteredValue: toggleFilteredValue(props.filteredValue ?? [], value, multiple) });
        }
    };

    const renderMenu = () => {
        const render = props.renderFilterDropdown;
        if (typeof render === 'function') {
            return untrack(() => render(renderFilterDropdownProps));
        }
        return <FilterMenuItems filter={props} filters={props.filters ?? []} level={0} displayValue={displayValue} toggle={toggle} confirm={() => confirm({ closeDropdown: true })} reset={reset} />;
    };

    // native button for keyboard access; the name carries the filtered state the `on` class shows by color
    const renderFilterButton = (getTriggerProps: GetDropdownTriggerProps) => (
        <button
            {...getTriggerProps({
                type: 'button',
                get class() {
                    return clsx(`${prefixCls()}-column-filter`, { on: filtered() });
                },
                get 'aria-label'() {
                    return filtered() ? locale().locale.filterColumnActive : locale().locale.filterColumn;
                },
            })}
        >
            {'​'}
            <IconFilter size="default" />
        </button>
    );

    // props reset the pending value as React does during render, so the change shows in the same pass
    createComputed(
        on(
            () => props.filteredValue,
            () => setPendingFilteredValue(undefined),
            { defer: true }
        )
    );

    createComputed(
        on(
            // a memo, so a rebuilt column with the same value does not close a menu this component opened
            createMemo(() => props.filterDropdownVisible),
            (visible) => {
                // a withdrawn controlled value hands the menu back to the Dropdown, or to this component for a custom dropdown
                setDropdownVisible(visible !== undefined ? visible : isCustomDropdownVisible() ? false : undefined);
            },
            { defer: true }
        )
    );

    return (
        <Show when={filterDropdown.toArray().length === 0} fallback={filterDropdown()}>
            <FilterDropdown
                filter={props}
                trigger="click"
                position="bottom"
                render={renderMenu}
                visible={isControlled() ? props.filterDropdownVisible : dropdownVisible()}
                onVisibleChange={handleFilterDropdownVisibleChange}
                onOpened={() => {
                    if (isCustomDropdownVisible()) {
                        props.onFilterDropdownVisibleChange?.(true);
                    }
                }}
            >
                {resolvedIcon.toArray().length ? resolvedIcon() : renderFilterButton}
            </FilterDropdown>
        </Show>
    );
}
