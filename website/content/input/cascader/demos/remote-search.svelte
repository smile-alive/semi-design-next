<script lang="ts">
    import { debounce } from 'es-toolkit';
    import { Cascader, Spin, type CascaderData } from '@fibrae/semi-ui-svelte';

    const fetchByKeyword = (keyword: string) =>
        new Promise<CascaderData[]>((resolve) => {
            const delay = 200 + Math.floor(Math.random() * 800);
            setTimeout(() => {
                if (!keyword) {
                    resolve([]);
                    return;
                }
                resolve([
                    { label: `${keyword} - 选项 A`, value: `${keyword}-a` },
                    { label: `${keyword} - 选项 B`, value: `${keyword}-b` },
                    { label: `${keyword} - 选项 C`, value: `${keyword}-c` },
                ]);
            }, delay);
        });

    let treeData = $state<CascaderData[]>([]);
    let loading = $state(false);

    let latestToken = 0;
    const onSearch = debounce((input: string) => {
        if (!input) {
            treeData = [];
            loading = false;
            return;
        }
        latestToken += 1;
        const token = latestToken;
        loading = true;
        void fetchByKeyword(input).then((next) => {
            // Drop stale results that arrive after a newer request
            if (token !== latestToken) {
                return;
            }
            treeData = next;
            loading = false;
        });
    }, 300);
</script>

<Spin spinning={loading}>
    <Cascader filterTreeNode onChange={(v) => console.log('selected:', v)} {onSearch} placeholder="输入关键词远程搜索" remote style="width: 300px" {treeData} />
</Spin>
