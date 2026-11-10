<script lang="ts">
    import type { Component } from 'svelte';
    import { IconAbsoluteStroked, IconComponentStroked, IconFixedStroked, IconSectionStroked } from '@fibrae/semi-icons-svelte';
    import { Tree, type TreeNodeData, type TreeOnDragProps } from '@fibrae/semi-ui-svelte';

    type LoopCallback = (item: TreeNodeData, ind: number, arr: TreeNodeData[]) => void;

    const icons: Record<string, Component<{ style?: string }>> = {
        'fix-btn-0': IconFixedStroked,
        'module-0': IconSectionStroked,
        'free-compo-0': IconAbsoluteStroked,
        'split-col-0': IconSectionStroked,
        'btn-0': IconComponentStroked,
        'btn-1': IconComponentStroked,
        'module-1': IconSectionStroked,
        'cus-0': IconComponentStroked,
    };
    const iconStyle = 'margin-right: 8px; color: var(--semi-color-text-2)';

    let selected = $state.raw(new Set<string | undefined>());
    let selectedThroughParent = $state.raw(new Set<string | undefined>());
    let treeData = $state.raw<TreeNodeData[]>([
        {
            label: '黑色固定按钮',
            key: 'fix-btn-0',
        },
        {
            label: '模块',
            key: 'module-0',
            children: [
                {
                    label: '可自由摆放的组件',
                    key: 'free-compo-0',
                },
                {
                    label: '分栏容器',
                    key: 'split-col-0',
                    children: [
                        {
                            label: '按钮组件',
                            key: 'btn-0',
                        },
                        {
                            label: '按钮组件',
                            key: 'btn-1',
                        },
                    ],
                },
            ],
        },
        {
            label: '模块',
            key: 'module-1',
            children: [
                {
                    label: '自定义组件',
                    key: 'cus-0',
                },
            ],
        },
    ]);

    const onDrop = (info: TreeOnDragProps) => {
        const { dropToGap, node, dragNode } = info;
        const dropKey = node.key;
        const dragKey = dragNode.key;
        const dropPos = node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

        const data = [...treeData];
        const loop = (data: TreeNodeData[], key: string | undefined, callback: LoopCallback) => {
            data.forEach((item, ind, arr) => {
                if (item.key === key) return callback(item, ind, arr);
                if (item.children) return loop(item.children, key, callback);
            });
        };

        let dragObj: TreeNodeData = {};
        loop(data, dragKey, (item, ind, arr) => {
            arr.splice(ind, 1);
            dragObj = item;
        });

        if (!dropToGap) {
            loop(data, dropKey, (item) => {
                item.children ||= [];
                item.children.push(dragObj);
            });
        } else if (dropPosition === 1 && node.children && node.expanded) {
            loop(data, dropKey, (item) => {
                item.children ||= [];
                item.children.unshift(dragObj);
            });
        } else {
            let dropNodeInd = 0;
            let dropNodePosArr: TreeNodeData[] = [];
            loop(data, dropKey, (_item, ind, arr) => {
                dropNodePosArr = arr;
                dropNodeInd = ind;
            });
            if (dropPosition === -1) {
                dropNodePosArr.splice(dropNodeInd, 0, dragObj);
            } else {
                dropNodePosArr.splice(dropNodeInd + 1, 0, dragObj);
            }
        }
        treeData = data;
    };

    const findDescendantKeys = (node: TreeNodeData) => {
        const res = [node.key];
        const findChild = (item?: TreeNodeData) => {
            if (!item) return;
            const { children } = item;

            if (children && children.length) {
                children.forEach((child) => {
                    res.push(child.key);
                    findChild(child);
                });
            }
        };
        findChild(node);
        return res;
    };

    const handleSelect = (key: string, _bool: boolean, node: TreeNodeData) => {
        selected = new Set([key]);
        selectedThroughParent = new Set(findDescendantKeys(node));
    };

    const rowBackground = (key?: string) => {
        if (selected.has(key)) return 'var(--semi-blue-0)';
        if (selectedThroughParent.has(key)) return 'color-mix(in srgb, var(--semi-blue-0) 50%, transparent)';
        return 'transparent';
    };

    const treeStyle = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree defaultExpandAll draggable {onDrop} onSelect={handleSelect} style={treeStyle} {treeData}>
    {#snippet fullLabel(row)}
        {@const Icon = icons[row.data.key ?? '']}
        <!-- the tree handles the keyboard: the row is a pointer shortcut -->
        <div class={row.class} role="presentation" style:background-color={rowBackground(row.data.key)} onclick={row.onClick}>
            {#if !row.data.children?.length}
                <span style="width: 24px"></span>
            {:else}
                {@render row.expandIcon()}
            {/if}
            <Icon style={iconStyle} />
            <span>{row.data.label}</span>
        </div>
    {/snippet}
</Tree>
