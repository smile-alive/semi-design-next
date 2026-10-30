<script lang="ts">
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-svelte';

    const dataSource: TimelineData[] = [
        { time: '2019-07-14 10:35', content: '审核中', type: 'ongoing' },
        { time: '2019-06-13 16:17', content: '发布成功', type: 'success' },
        { time: '2019-05-14 18:34', content: '审核失败', type: 'error' },
    ];
</script>

<Timeline {dataSource} />
