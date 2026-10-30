<script lang="ts">
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-svelte';

    const dataSource: TimelineData[] = [
        { time: '2019-07-14 10:35', extra: '节点辅助说明信息', content: '第一个节点内容' },
        { time: '2019-06-13 16:17', extra: '节点辅助说明信息', content: '第二个节点内容' },
        { time: '2019-05-14 18:34', extra: '节点辅助说明信息', content: '第三个节点内容' },
        { time: '2019-05-09 09:12', extra: '节点辅助说明信息', content: '第四个节点内容' },
    ];
</script>

<Timeline {dataSource} mode="center" />
