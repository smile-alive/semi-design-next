<script lang="ts">
    import type { Component } from 'svelte';
    import { IconAbsoluteStroked, IconComponentStroked, IconFixedStroked, IconInnerSectionStroked, IconSectionStroked } from '@fibrae/semi-icons-svelte';
    import { Tree, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    const icons: Record<string, Component<{ style?: string }>> = {
        'fix-btn-0': IconFixedStroked,
        'module-0': IconSectionStroked,
        'free-compo-0': IconAbsoluteStroked,
        'split-col-0': IconInnerSectionStroked,
        'btn-0': IconComponentStroked,
        'btn-1': IconComponentStroked,
        'module-1': IconSectionStroked,
        'cus-0': IconComponentStroked,
    };
    const iconStyle = 'margin-right: 8px; color: var(--semi-color-text-2)';

    let selected = $state.raw(new Set<string | undefined>());
    let selectedThroughParent = $state.raw(new Set<string | undefined>());
    const treeData = [
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
    ];

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

    const onSelect = (key: string, _selected: boolean, node: TreeNodeData) => {
        selected = new Set([key]);
        selectedThroughParent = new Set(findDescendantKeys(node));
    };

    const rowBackground = (key: string | undefined) => {
        if (selected.has(key)) return 'var(--semi-blue-0)';
        if (selectedThroughParent.has(key)) return 'rgb(from var(--semi-blue-0) r g b / .5)';
        return 'transparent';
    };

    const treeStyle = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree defaultExpandAll {onSelect} style={treeStyle} {treeData}>
    {#snippet fullLabel({ class: cls, data, expandIcon, onClick })}
        {@const Icon = icons[data.key ?? '']}
        <!-- the tree handles the keyboard: the row is a pointer shortcut -->
        <div class={cls} role="presentation" style:background-color={rowBackground(data.key)} onclick={onClick}>
            {#if !data.children?.length}
                <span style="width: 24px"></span>
            {:else}
                {@render expandIcon()}
            {/if}
            <Icon style={iconStyle} />
            <span>{data.label}</span>
        </div>
    {/snippet}
</Tree>
