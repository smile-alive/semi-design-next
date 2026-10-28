import React, { isValidElement, useState } from 'react';
import clsx from 'clsx';
import { isEqual, pick } from 'es-toolkit';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { toggleFilteredValue } from '@fibrae/semi-foundation/table/utils';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconFilter } from '@fibrae/semi-icons-react';
import Button from '../button';
import { Checkbox } from '../checkbox';
import Dropdown, { type DropdownProps } from '../dropdown';
import LocaleConsumer from '../locale/locale-consumer';
import useLocale from '../locale/use-locale';
import { Radio } from '../radio';
import Space from '../space';
import type { FilterIcon, Filter, OnFilterDropdownVisibleChange, RenderFilterDropdownItem, FilterConfirmMode } from './interface';

function renderDropdown(props: RenderDropdownProps, nestedElem: React.ReactNode, level: number, locale: Locale['Table'], onOpened?: () => void) {
    const {
        filterMultiple = true,
        filters = [],
        filteredValue = [],
        filterDropdownVisible,
        onSelect = noop,
        onFilterDropdownVisibleChange = noop,
        trigger = 'click',
        position = 'bottom',
        renderFilterDropdown,
        renderFilterDropdownItem,
        filterConfirmMode = 'immediate',
        tempFilteredValue,
        setTempFilteredValue,
        confirm,
        reset,
    } = props ?? {};

    const displayValue = filterConfirmMode === 'confirm' ? (tempFilteredValue ?? []) : filteredValue;

    const renderFilterDropdownProps: RenderFilterDropdownProps = pick(props, ['tempFilteredValue', 'setTempFilteredValue', 'confirm', 'clear', 'close', 'reset', 'filters']);
    const render =
        typeof renderFilterDropdown === 'function' ? (
            renderFilterDropdown(renderFilterDropdownProps)
        ) : (
            <Dropdown.Menu>
                {Array.isArray(filters) &&
                    filters.map((filter, index) => {
                        const changeFn = (e: React.MouseEvent<HTMLLIElement>) => {
                            const domEvent = e && e.nativeEvent;
                            if (domEvent) {
                                // keeps the pop-up layer open and stops the label click from firing twice
                                domEvent.stopImmediatePropagation();
                                domEvent.stopPropagation();
                                domEvent.preventDefault();
                            }

                            if (filterConfirmMode === 'confirm') {
                                setTempFilteredValue?.(toggleFilteredValue(tempFilteredValue ?? filteredValue, filter.value, filterMultiple));
                            } else {
                                onSelect({
                                    filteredValue: toggleFilteredValue(filteredValue, filter.value, filterMultiple),
                                });
                            }
                        };

                        const checked = displayValue.includes(filter.value);
                        const { text } = filter;
                        const { value } = filter;
                        const key = `${level}_${index}`;

                        const dropdownItem =
                            typeof renderFilterDropdownItem === 'function'
                                ? renderFilterDropdownItem({
                                      onChange: changeFn,
                                      filterMultiple,
                                      value,
                                      text,
                                      checked,
                                      filteredValue: displayValue,
                                      level,
                                  })
                                : null;

                        let item =
                            dropdownItem && React.isValidElement(dropdownItem) ? (
                                React.cloneElement(dropdownItem, { key })
                            ) : (
                                <Dropdown.Item key={key} onClick={changeFn}>
                                    {filterMultiple ? <Checkbox checked={checked}>{text}</Checkbox> : <Radio checked={checked}>{text}</Radio>}
                                </Dropdown.Item>
                            );

                        if (Array.isArray(filter.children) && filter.children.length) {
                            const childrenDropdownProps = {
                                ...props,
                                filters: filter.children,
                                trigger: 'hover' as const,
                                position: 'right' as const,
                                // a submenu opening or closing is not the root menu opening or closing
                                onFilterDropdownVisibleChange: noop,
                            };

                            delete childrenDropdownProps.filterDropdownVisible;

                            item = React.cloneElement(renderDropdown(childrenDropdownProps, item, level + 1, locale), {
                                key,
                            });
                        }
                        return item;
                    })}
                {filterConfirmMode === 'confirm' && level === 0 && (
                    <div className={`${cssClasses.PREFIX}-column-filter-footer`}>
                        <Space>
                            <Button size="small" onClick={() => reset?.()}>
                                {locale.resetFilter}
                            </Button>
                            <Button size="small" theme="solid" onClick={() => confirm?.({ closeDropdown: true })}>
                                {locale.confirmFilter}
                            </Button>
                        </Space>
                    </div>
                )}
            </Dropdown.Menu>
        );

    const { filterDropdownVisible: _, ...restProps } = props;

    const dropdownProps: DropdownProps = {
        ...restProps,
        trigger,
        position,
        render,
        onOpen: () => {
            restProps.onOpen?.();
            onOpened?.();
        },
        onVisibleChange: (visible: boolean) => onFilterDropdownVisibleChange(visible),
    };

    if (filterDropdownVisible != null) {
        dropdownProps.visible = filterDropdownVisible;
    }

    return (
        <Dropdown {...dropdownProps} key={`Dropdown_level_${level}`}>
            {nestedElem}
        </Dropdown>
    );
}

export default function ColumnFilter(props: ColumnFilterProps = {}): React.ReactElement {
    const { prefixCls = cssClasses.PREFIX, filteredValue, filterIcon, filterDropdownProps, onSelect, filterDropdownVisible, renderFilterDropdown, onFilterDropdownVisibleChange, filterConfirmMode = 'immediate' } = props;
    let { filterDropdown = null } = props;

    const { locale: tableLocale } = useLocale('Table');

    const [pendingFilteredValue, setPendingFilteredValue] = useState<any[]>();

    // props reset the state during render so the change shows in the same pass
    const [prevFilterDropdownVisible, setPrevFilterDropdownVisible] = useState(filterDropdownVisible);

    const isFilterDropdownVisibleControlled = typeof filterDropdownVisible !== 'undefined';
    const isCustomFilterDropdown = typeof renderFilterDropdown === 'function';
    const isCustomDropdownVisible = !isFilterDropdownVisibleControlled && (isCustomFilterDropdown || filterConfirmMode === 'confirm');
    const tempFilteredValue = pendingFilteredValue ?? filteredValue;
    const dropdownVisibleInitValue = isCustomDropdownVisible ? false : filterDropdownVisible;

    const [dropdownVisible, setDropdownVisible] = useState<boolean | undefined>(dropdownVisibleInitValue);

    if (filterDropdownVisible !== prevFilterDropdownVisible) {
        setPrevFilterDropdownVisible(filterDropdownVisible);
        // a withdrawn controlled value hands the menu back to the Dropdown, or to this component for a custom dropdown
        setDropdownVisible(typeof filterDropdownVisible !== 'undefined' ? filterDropdownVisible : isCustomDropdownVisible ? false : undefined);
    }

    const [prevFilteredValue, setPrevFilteredValue] = useState(filteredValue);

    if (filteredValue !== prevFilteredValue) {
        setPrevFilteredValue(filteredValue);
        setPendingFilteredValue(undefined);
    }

    let iconElem;

    const filtered = Array.isArray(filteredValue) && filteredValue.length > 0;
    const finalCls = clsx(`${prefixCls}-column-filter`, { on: filtered });

    const requestClose = () => {
        if (isFilterDropdownVisibleControlled) {
            onFilterDropdownVisibleChange?.(false);
        } else {
            // the Dropdown does not report a close its owner applies
            handleFilterDropdownVisibleChange(false);
        }
    };

    const close: RenderFilterDropdownProps['close'] = requestClose;

    const confirm: RenderFilterDropdownProps['confirm'] = (props = {}) => {
        const newFilteredValue = props?.filteredValue || tempFilteredValue;
        if (!isEqual(newFilteredValue, filteredValue)) {
            onSelect({ filteredValue: newFilteredValue });
        }
        if (props.closeDropdown) {
            requestClose();
        }
    };

    const clear: RenderFilterDropdownProps['clear'] = (props: { closeDropdown?: boolean } = {}) => {
        setPendingFilteredValue([]);
        onSelect({ filteredValue: [] });
        if (props.closeDropdown) {
            requestClose();
        }
    };

    const reset: RenderFilterDropdownProps['reset'] = () => {
        setPendingFilteredValue(undefined);
    };

    const renderFilterDropdownProps: RenderFilterDropdownProps = {
        tempFilteredValue,
        setTempFilteredValue: setPendingFilteredValue,
        confirm,
        clear,
        close,
        reset,
        filters: props.filters,
    };

    const handleFilterDropdownVisibleChange = (visible: boolean) => {
        if (isCustomDropdownVisible) {
            setDropdownVisible(visible);
        }
        // an unconfirmed check is dropped on close, so the next opening starts from the applied value
        if (!visible && filterConfirmMode === 'confirm') {
            setPendingFilteredValue(undefined);
        }
        // the Dropdown asks before it opens; a menu this component controls reports the opening from onOpen, once
        // the panel is shown, so the callback can reach the panel's elements as with an uncontrolled menu
        if (visible && isCustomDropdownVisible) {
            return;
        }
        onFilterDropdownVisibleChange?.(visible);
    };

    if (typeof filterIcon === 'function') {
        iconElem = filterIcon(filtered);
    } else if (isValidElement(filterIcon)) {
        iconElem = filterIcon;
    } else {
        iconElem = (
            // native button for keyboard access; the name carries the filtered state the `on` class shows by color
            <button type="button" className={finalCls} aria-label={filtered ? tableLocale.filterColumnActive : tableLocale.filterColumn}>
                {'\u200b' /* ZWSP(zero-width space) */}
                <IconFilter size="default" />
            </button>
        );
    }

    const renderProps = {
        ...props,
        ...filterDropdownProps,
        // the column's own className is not the menu's
        className: clsx(`${cssClasses.PREFIX}-column-filter-dropdown`, filterDropdownProps?.className),
        ...renderFilterDropdownProps,
        filterDropdownVisible: isFilterDropdownVisibleControlled ? filterDropdownVisible : dropdownVisible,
        onFilterDropdownVisibleChange: handleFilterDropdownVisibleChange,
    };

    return (
        <LocaleConsumer componentName="Table">
            {(locale: Locale['Table']) => {
                if (React.isValidElement<ColumnFilterProps>(filterDropdown)) {
                    return filterDropdown;
                }
                return renderDropdown(renderProps, iconElem, 0, locale, isCustomDropdownVisible ? () => onFilterDropdownVisibleChange?.(true) : undefined);
            }}
        </LocaleConsumer>
    );
}

export interface ColumnFilterProps extends Omit<RenderDropdownProps, keyof RenderFilterDropdownProps> {
    prefixCls?: string;
    filteredValue?: any[];
    filterIcon?: FilterIcon;
    filterDropdown?: React.ReactElement;
    filterDropdownProps?: FilterDropdownProps;
    filters?: Filter[];
}

export interface RenderDropdownProps extends FilterDropdownProps, RenderFilterDropdownProps {
    filterMultiple?: boolean;
    filters?: Filter[];
    filteredValue?: any[];
    filterDropdownVisible?: boolean;
    onSelect?: (data: OnSelectData) => void;
    onFilterDropdownVisibleChange?: OnFilterDropdownVisibleChange;
    renderFilterDropdown?: (props: RenderFilterDropdownProps) => React.ReactNode;
    renderFilterDropdownItem?: RenderFilterDropdownItem;
    filterConfirmMode?: FilterConfirmMode;
}

export interface FilterDropdownProps extends Omit<DropdownProps, 'render' | 'onVisibleChange'> {}

export interface OnSelectData {
    filteredValue: any[];
}

export interface RenderFilterDropdownProps {
    /** temporary filteredValue  */
    tempFilteredValue: any[];
    /** set temporary filteredValue  */
    setTempFilteredValue: (tempFilteredValue: any[]) => void;
    /** set tempFilteredValue to filteredValue. You can also pass filteredValue to directly set the filteredValue  */
    confirm: (props?: { closeDropdown?: boolean; filteredValue?: any[] }) => void;
    /** clear tempFilteredValue and filteredValue  */
    clear: (props?: { closeDropdown?: boolean }) => void;
    /** close dropdown  */
    close: () => void;
    /** reset tempFilteredValue to the applied filteredValue  */
    reset: () => void;
    /** column filters  */
    filters?: RenderDropdownProps['filters'];
}
