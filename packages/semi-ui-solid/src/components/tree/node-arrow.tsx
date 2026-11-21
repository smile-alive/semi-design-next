import { type JSX, Match, Switch, children, createRenderEffect, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
import { isTreeNodeLeaf } from '@fibrae/semi-foundation/components/tree/shared';
import { IconTreeTriangleDown } from '@fibrae/semi-icons-solid';
import { hasContent } from '../../utils/index';
import Spin from '../spin';
import { useTreeContext } from './context';
import type { ExpandIcon, ExpandIconProps, TreeRowProps } from './interface';

interface NodeArrowProps {
    row: TreeRowProps;
    showLine?: boolean;
    expandIcon?: ExpandIcon;
    onExpand: (e: MouseEvent) => void;
}

interface ExpandArrowProps extends NodeArrowProps {
    iconClass: string;
    iconStyle?: Style;
}

type Style = JSX.CSSProperties | string;

const prefix = cssClasses.PREFIX_OPTION;

// A branch of its own: the custom icon is created only for a row that shows it, as a created icon that is never
// inserted has no server markup for hydration to find
function ExpandArrow(props: ExpandArrowProps) {
    // children() resolves only zero-argument functions, so a render function comes through as itself
    const custom = children(() => props.expandIcon as JSX.Element);

    const renderCustom = () => {
        const icon = custom();
        return typeof icon === 'function' ? (icon as (iconProps: ExpandIconProps) => JSX.Element) : undefined;
    };

    // Solid cannot clone the element, so it gets the class and the click in place; the native listener stops the
    // click before it reaches the row's delegated handler, as React's cloned onClick does
    createRenderEffect(() => {
        if (isServer) {
            return;
        }
        for (const node of custom.toArray()) {
            if (node instanceof Element) {
                const onClick = (e: Event) => props.onExpand(e as MouseEvent);
                node.classList.add(...props.iconClass.split(' ').filter(Boolean));
                node.addEventListener('click', onClick);
                onCleanup(() => node.removeEventListener('click', onClick));
            }
        }
    });

    return (
        <Switch fallback={<IconTreeTriangleDown class={props.iconClass} size="small" style={props.iconStyle} onClick={(e: MouseEvent) => props.onExpand(e)} />}>
            <Match keyed when={renderCustom()}>
                {(render) =>
                    render({
                        onClick: (e) => props.onExpand(e),
                        class: props.iconClass,
                        get expanded() {
                            return Boolean(props.row.expanded);
                        },
                    })
                }
            </Match>
            <Match when={hasContent(custom())}>{custom()}</Match>
        </Switch>
    );
}

export default function NodeArrow(props: NodeArrowProps) {
    const context = useTreeContext('Tree.Node');

    const isLeaf = () => isTreeNodeLeaf(props.row, context.view().hasLoadData);

    const partClass = () => context.view().classNames?.itemSwitcher;

    const partStyle = () => context.view().styles?.itemSwitcher;

    return (
        <Switch fallback={<span class={clsx(`${prefix}-empty-icon`, partClass())} style={partStyle()} />}>
            <Match when={props.row.loading}>
                {/* the row carries aria-busy; the spinner's own name would join the row's name */}
                <Spin aria-hidden="true" class={clsx(`${prefix}-spin-icon`, partClass())} style={partStyle()} />
            </Match>
            <Match when={!isLeaf()}>
                {/* a custom expand icon takes the part class only: its element is the user's own */}
                <ExpandArrow expandIcon={props.expandIcon} iconClass={clsx(`${prefix}-expand-icon`, partClass())} iconStyle={partStyle()} row={props.row} onExpand={props.onExpand} />
            </Match>
            <Match when={props.showLine}>
                <span class={clsx(`${prefix}-switcher`, partClass())} style={partStyle()}>
                    <span class={`${prefix}-switcher-leaf-line`} />
                </span>
            </Match>
        </Switch>
    );
}
