<script lang="ts">
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const contentList = ['文档', '快速起步', '帮助'];
    const tabList: PlainTab[] = [
        { tab: '文档', itemKey: '1' },
        { tab: '快速起步', itemKey: '2' },
        { tab: '帮助', itemKey: '3' },
    ];
    let key = $state<string | null | undefined>('1');
</script>

<Tabs bind:activeKey={key} {tabList} type="slash">
    <div>{contentList[Number(key) - 1]}</div>
</Tabs>
