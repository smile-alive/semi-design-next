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

    const latest = { token: 0 };
    const handleSearch = debounce((input: string) => {
        if (!input) {
            treeData = [];
            loading = false;
            return;
        }
        latest.token += 1;
        const token = latest.token;
        loading = true;
        void fetchByKeyword(input).then((next) => {
            // Drop stale results that arrive after a newer request
            if (token !== latest.token) {
                return;
            }
            treeData = next;
            loading = false;
        });
    }, 300);
</script>

<Spin spinning={loading}>
    <Cascader filterTreeNode onChange={(v) => console.log('selected:', v)} onSearch={handleSearch} placeholder="输入关键词远程搜索" remote style="width: 300px" {treeData} />
</Spin>
