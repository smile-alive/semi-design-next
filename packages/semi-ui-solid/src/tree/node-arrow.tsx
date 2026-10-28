import { type JSX, Match, Switch, children, createRenderEffect, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import { isTreeNodeLeaf } from '@fibrae/semi-foundation/tree/shared';
import { IconTreeTriangleDown } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import Spin from '../spin';
import { useTreeContext } from './context';
import type { ExpandIcon, ExpandIconProps, TreeRowProps } from './interface';

interface NodeArrowProps {
    row: TreeRowProps;
    showLine?: boolean;
    expandIcon?: ExpandIcon;
    onExpand: (e: MouseEvent) => void;
}

const prefix = cssClasses.PREFIX_OPTION;
const iconClass = `${prefix}-expand-icon`;

// A branch of its own: the custom icon is created only for a row that shows it, as a created icon that is never
// inserted has no server markup for hydration to find
function ExpandArrow(props: NodeArrowProps) {
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
                node.classList.add(iconClass);
                node.addEventListener('click', onClick);
                onCleanup(() => node.removeEventListener('click', onClick));
            }
        }
    });

    return (
        <Switch fallback={<IconTreeTriangleDown class={iconClass} size="small" onClick={(e: MouseEvent) => props.onExpand(e)} />}>
            <Match keyed when={renderCustom()}>
                {(render) =>
                    render({
                        onClick: (e) => props.onExpand(e),
                        class: iconClass,
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

/** The switcher of a row: a spinner while loading, the expand arrow on a branch, a spacer or a line on a leaf */
export default function NodeArrow(props: NodeArrowProps) {
    const context = useTreeContext('Tree.Node');

    const isLeaf = () => isTreeNodeLeaf(props.row, context.view().hasLoadData);

    return (
        <Switch fallback={<span class={`${prefix}-empty-icon`} />}>
            <Match when={props.row.loading}>
                {/* the row carries aria-busy; the spinner's own name would join the row's name */}
                <Spin aria-hidden="true" wrapperClassName={`${prefix}-spin-icon`} />
            </Match>
            <Match when={!isLeaf()}>
                <ExpandArrow row={props.row} expandIcon={props.expandIcon} onExpand={props.onExpand} />
            </Match>
            <Match when={props.showLine}>
                <span class={`${prefix}-switcher`}>
                    <span class={`${prefix}-switcher-leaf-line`} />
                </span>
            </Match>
        </Switch>
    );
}
