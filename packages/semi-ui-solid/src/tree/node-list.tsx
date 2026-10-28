import { For, Show, createMemo, createSignal } from 'solid-js';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import { sameKeys } from '@fibrae/semi-foundation/tree/shared';
import VirtualList from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import AutoSizer from './auto-sizer';
import type { FlattenNode, NodeListProps } from './interface';
import NodeCollapsible from './node-collapsible';

interface Layout {
    /** Row keys, and in place of the moving rows the id of their group */
    ids: string[];
    groups: Map<string, string[]>;
}

const NO_KEYS: Set<string> = new Set();
// a tree key starting with NUL is not a realistic key, so group ids never collide with row keys
const GROUP_PREFIX = '\u0000motion-';

const virtualKey = (index: number, nodes: FlattenNode[]) => nodes[index].key;

/**
 * The rows of Tree and TreeSelect. A virtualized list renders the rows in view; otherwise every row renders, with the
 * ones that appear or disappear (motionKeys) grouped into one animated NodeCollapsible. Rows are keyed by node key:
 * every expansion rebuilds the flattened nodes, and keying by node object would remount every row.
 */
export default function NodeList(props: NodeListProps) {
    const config = useConfig();

    const [finished, setFinished] = createSignal<{ keys: Set<string>; nodes: FlattenNode[] } | null>(null);

    const nodesByKey = createMemo(() => new Map([...(props.flattenList ?? []), ...props.flattenNodes].map((node) => [node.key, node])));

    const layout = createMemo((): Layout => {
        const groups = new Map<string, string[]>();
        const keys = props.motion ? props.motionKeys : NO_KEYS;
        const done = finished();
        if (!keys.size || (done && isEqual(done.keys, keys) && sameKeys(done.nodes, props.flattenNodes))) {
            return { ids: props.flattenNodes.map((node) => node.key), groups };
        }
        // collapsing rows are gone from flattenNodes; they come from the list cached before the collapse
        const lookUp = props.motionType === 'hide' && props.flattenList ? props.flattenList : props.flattenNodes;
        const firstKey = keys.values().next().value;
        const ids: string[] = [];
        const moving: string[] = [];
        let start = 0;
        lookUp.forEach((node, index) => {
            if (keys.has(node.key)) {
                moving.push(node.key);
                if (node.key === firstKey) {
                    start = index;
                }
            } else {
                ids.push(node.key);
            }
        });
        if (moving.length) {
            const id = `${GROUP_PREFIX}${moving[0]}`;
            groups.set(id, moving);
            ids.splice(start, 0, id);
        }
        return { ids, groups };
    });

    const virtualize = () => (props.virtualize && Object.keys(props.virtualize).length > 0 ? props.virtualize : undefined);

    const handleMotionEnd = () => setFinished({ keys: props.motionKeys, nodes: props.flattenNodes });

    const renderKey = (key: string) => props.renderRow(createMemo(() => nodesByKey().get(key)));

    return (
        <Show
            when={virtualize()}
            fallback={
                <For each={layout().ids}>
                    {(id) => (
                        <Show when={layout().groups.get(id)} fallback={renderKey(id)}>
                            {(keys) => (
                                <NodeCollapsible duration={200} motion={Boolean(props.motionType)} open={props.motionType === 'hide'} onMotionEnd={handleMotionEnd}>
                                    <For each={keys()}>{(key) => renderKey(key)}</For>
                                </NodeCollapsible>
                            )}
                        </Show>
                    )}
                </For>
            }
        >
            {(options) => (
                <AutoSizer defaultHeight={options().height} defaultWidth={options().width}>
                    {(size) => (
                        <VirtualList ref={props.listRef} class={`${cssClasses.PREFIX}-virtual-list`} height={size.height} itemCount={props.flattenNodes.length} itemData={props.flattenNodes} itemKey={virtualKey} itemSize={options().itemSize} style={{ direction: config().direction }} tabIndex={-1} width={size.width}>
                            {(row) =>
                                props.renderRow(
                                    createMemo(() => row.data[row.index]),
                                    () => row.style
                                )
                            }
                        </VirtualList>
                    )}
                </AutoSizer>
            )}
        </Show>
    );
}
