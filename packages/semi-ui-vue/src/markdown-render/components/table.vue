<script setup lang="ts">
    import { type VNode, Text, useAttrs } from 'vue';
    import { childSlots, toVNodes } from '../../_base/read-vnode';
    import slotNodes, { type KeyedNode } from '../../_base/slot-nodes';
    import Table, { type ColumnAlign, type ColumnProps } from '../../table';

    defineOptions({ inheritAttrs: false });

    // `$attrs` in the template makes the component's type refer to itself (TS7022)
    const attrs = useAttrs();

    const nodesOf = (children: unknown): KeyedNode[] => slotNodes(toVNodes(children as VNode[]));

    // a component vnode keeps children in a slot object, which toVNodes cannot read
    const childrenOf = (node: VNode): unknown => (typeof node.type === 'string' ? node.children : childSlots(node).default?.());

    // by position, not tag, so a `components` override of tr, th or td still counts
    const elementsOf = (node?: VNode): VNode[] =>
        nodesOf(node && childrenOf(node))
            .map(([child]) => child)
            .filter((child) => child.type !== Text);

    const textOf = (nodes: KeyedNode[]): string => nodes.map(([node]) => (node.type === Text ? String(node.children) : textOf(nodesOf(childrenOf(node))))).join('');

    const parse = (
        slot?: () => VNode[]
    ): {
        columns: ColumnProps[];
        dataSource: { key: string }[];
        head: KeyedNode[][];
        body: KeyedNode[][][];
    } => {
        const sections = nodesOf(slot?.() ?? []).map(([node]) => node);
        const thead = sections.find((node) => node.type === 'thead');
        // a custom rehype plugin can put a tr directly under the table
        const tbodyRows = sections.flatMap((node) => (node.type === 'tbody' ? elementsOf(node) : node.type === 'tr' ? [node] : []));
        // rehype-raw puts every row of a thead-less table in the tbody, so the first row is the header
        const [headRow, ...bodyRows] = thead ? [elementsOf(thead)[0], ...tbodyRows] : tbodyRows;
        const head = elementsOf(headRow);
        const body = bodyRows.map((row) => elementsOf(row).map((cell) => nodesOf(childrenOf(cell))));
        const columns: ColumnProps[] = head.map((cell, i) => ({
            dataIndex: String(i),
            title: textOf(nodesOf(childrenOf(cell))),
            align: (cell.props?.style as { textAlign?: ColumnAlign } | undefined)?.textAlign,
        }));
        return {
            columns,
            dataSource: body.map((_, i) => ({ key: String(i) })),
            head: head.map((cell) => nodesOf(childrenOf(cell))),
            body,
        };
    };
</script>

<template>
    <Table v-for="(t, index) in [parse($slots.default)]" :key="index" :columns="t.columns" :dataSource="t.dataSource" :pagination="false" v-bind="attrs">
        <template #headerCell="{ column }">
            <component :is="node" v-for="[node, key] in t.head[Number(column.dataIndex)]" :key="key" />
        </template>
        <template #cell="{ column, record }">
            <component :is="node" v-for="[node, key] in t.body[Number(record.key)]?.[Number(column.dataIndex)] ?? []" :key="key" />
        </template>
    </Table>
</template>
