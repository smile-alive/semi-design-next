<script lang="ts">
    import { Button, Tree, type TreeProps } from '@fibrae/semi-ui-svelte';

    const json = {
        Node1: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
        },
        Node2: '0-1',
    };
    const json2 = {
        Node3: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
            'Child Node3': '0-0-3',
            'Child Node4': '0-0-4',
        },
        Node2: '0-1',
    };
    const style = 'margin-right: 20px; width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
    let tree = $state<TreeProps['treeDataSimpleJson']>(json);
</script>

<Button style="margin-bottom: 10px" onclick={() => (tree = json2)}>点击更新 TreeData</Button>
<div style="display: flex">
    <div>
        <span>defaultExpandAll</span>
        <Tree defaultExpandAll {style} treeDataSimpleJson={tree} />
    </div>
    <div>
        <span>expandAll</span>
        <Tree expandAll {style} treeDataSimpleJson={tree} />
    </div>
</div>
