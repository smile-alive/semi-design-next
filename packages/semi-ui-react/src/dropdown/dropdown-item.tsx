import React from 'react';
import clsx from 'clsx';
import { cssClasses as css } from '@fibrae/semi-foundation/dropdown/constants';
import { getItemRole } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { IconTick } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useMergedRef from '../_base/use-merged-ref';
import { useDropdownContext } from './context';

export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';

export interface DropdownItemProps extends BaseProps, ElementProps<'li'> {
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLLIElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLLIElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLLIElement>;
    onContextMenu?: React.MouseEventHandler<HTMLLIElement>;
    forwardRef?: (ele: HTMLLIElement) => void;
    type?: Type;
    active?: boolean;
    icon?: React.ReactNode;
    showTick?: boolean;
    /** Attached to the li */
    ref?: React.Ref<HTMLLIElement>;
}

const prefixCls = css.PREFIX;

function DropdownItem({ ref, children, disabled = false, className, forwardRef, type, active, icon, onClick, onMouseEnter, onMouseLeave, onContextMenu, onKeyDown, onMouseDown, showTick, ...rest }: DropdownItemProps) {
    const context = useDropdownContext();

    let events: React.DOMAttributes<HTMLLIElement> = { onMouseDown };

    // not built with the Compiler: a new merged ref per render would reattach every render
    const itemRef = useMergedRef(forwardRef, ref);
    const realShowTick = context.showTick ?? showTick;
    const role = getItemRole(context.selectionMode, realShowTick);

    const itemclass = clsx(className, {
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-item-disabled`]: disabled,
        [`${prefixCls}-item-withTick`]: realShowTick,
        [`${prefixCls}-item-${type}`]: type,
        [`${prefixCls}-item-active`]: active,
    });

    if (!disabled) {
        events = { onMouseEnter, onMouseLeave, onContextMenu, onMouseDown };
        // nested items click on mousedown: a click-triggered outer popup closes on it and unmounts the submenu first
        const isTopLevelItem = context.menuDepth === 1;
        if (!isTopLevelItem) {
            events.onMouseDown = (e) => {
                onMouseDown?.(e);
                if (e.button === 0) {
                    onClick?.(e);
                }
            };
            // detail 0 means keyboard activation
            events.onClick = (e) => {
                if (e.detail === 0) {
                    onClick?.(e);
                }
            };
        } else {
            events.onClick = onClick;
        }
    }

    let tick = null;

    if (realShowTick) {
        // the tick is on every item (transparent when inactive); its label would name each item "tick"
        tick = active ? <IconTick /> : <IconTick style={{ color: 'transparent' }} />;
    }

    return (
        <li {...rest} aria-checked={role === 'menuitem' ? undefined : Boolean(active)} aria-disabled={disabled} role={role} tabIndex={-1} {...events} ref={itemRef} className={itemclass} onKeyDown={onKeyDown}>
            {tick}
            {Boolean(icon) && <div className={`${prefixCls}-item-icon`}>{icon}</div>}
            {children}
        </li>
    );
}

export default Object.assign(DropdownItem, { elementType: 'Dropdown.Item' });
