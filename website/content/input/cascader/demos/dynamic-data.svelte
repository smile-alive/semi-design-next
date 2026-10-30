<script lang="ts">
    import { Button, Cascader, type CascaderData } from '@fibrae/semi-ui-svelte';

    let treeData = $state<CascaderData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 3) + 1;
        treeData = Array.from({ length: itemLength }, (_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_, ci) => ({
                key: `${i}-${ci}`,
                label: `Item-${i}-${ci}`,
                value: `${i}-${ci}`,
            }));
            return {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
        });
    };
</script>

<Cascader placeholder="请选择" style="width: 300px" {treeData} />
<br />
<br />
<Button onclick={add}>动态改变数据</Button>
