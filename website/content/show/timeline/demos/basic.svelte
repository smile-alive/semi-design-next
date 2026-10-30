<script lang="ts">
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-svelte';

    const dataSource: TimelineData[] = [
        { time: '2019-07-14 10:35', content: '第一个节点内容' },
        { time: '2019-06-13 16:17', content: '第二个节点内容' },
        { time: '2019-05-14 18:34', content: '第三个节点内容' },
    ];
</script>

<Timeline {dataSource} />
