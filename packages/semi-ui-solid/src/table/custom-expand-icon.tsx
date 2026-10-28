import { type JSX, createMemo, createRenderEffect, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import TableFoundation from '@fibrae/semi-foundation/table/foundation';
import { IconChevronRight, IconTreeTriangleRight } from '@fibrae/semi-icons-solid';
import isMarkup from '../_base/is-markup';
import useLocale from '../locale/use-locale';
import { useTableContext } from './context';
import type { ExpandIcon } from './interface';

export interface CustomExpandIconProps {
    expanded?: boolean;
    componentType?: 'tree' | 'expand';
    onClick?: (nextExpand: boolean, e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
    /** Read once, or called again when `expanded` changes */
    expandIcon?: ExpandIcon;
    prefixCls?: string;
}

export default function CustomExpandIcon(props: CustomExpandIconProps) {
    const locale = useLocale('Table');

    // the default icons and a node stay as they are, so the rotation runs as a transition
    const iconSource = createMemo(() => {
        const expandIcon = props.expandIcon;
        if (typeof expandIcon === 'function') {
            return { fn: expandIcon as (expanded?: boolean) => JSX.Element };
        }
        return { node: expandIcon };
    });

    const icon = createMemo(() => {
        const source = iconSource();
        if (source.fn) {
            const expanded = props.expanded;
            return untrack(() => source.fn(expanded));
        }
        const node = source.node;
        if (isMarkup(node) || typeof node === 'string' || typeof node === 'number') {
            return node;
        }
        return untrack(() => (props.componentType === 'tree' ? <IconTreeTriangleRight size="small" /> : <IconChevronRight />));
    });

    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    const handleClick = (e: MouseEvent) => props.onClick?.(!props.expanded, e);

    // React adds the class to the icon element itself; the icon may be the user's own node
    createRenderEffect(() => {
        const node = icon();
        // the server's markup is a string that cannot take the classes
        if (!isServer && node instanceof Element) {
            node.classList.toggle(`${cssClasses.PREFIX}-expandedIcon-show`, Boolean(props.expanded));
            node.classList.toggle(`${cssClasses.PREFIX}-expandedIcon-hide`, !props.expanded);
        }
    });

    return (
        <button type="button" class={`${prefixCls()}-expand-icon`} aria-expanded={Boolean(props.expanded)} aria-label={locale().locale.expandRow} onClick={handleClick} onMouseEnter={(e) => props.onMouseEnter?.(e)} onMouseLeave={(e) => props.onMouseLeave?.(e)}>
            {icon()}
        </button>
    );
}

/** The expand button of a row or, given its key, of a group section, following the table's expansion state */
export function TableExpandIcon(props: { record: Record<string, any>; isNested?: boolean; groupKey?: string | number }) {
    const table = useTableContext('Table.ExpandIcon');

    const key = () => props.groupKey ?? TableFoundation.getRecordKey({ rowKey: table.props.rowKey }, props.record);

    const expanded = () => table.state().expandedRowKeys?.includes(key()) ?? false;

    return <CustomExpandIcon componentType={props.isNested ? 'tree' : 'expand'} expanded={expanded()} expandIcon={table.props.expandIcon} onClick={(nextExpanded, e) => table.handleRowExpanded(nextExpanded, key(), e)} />;
}
