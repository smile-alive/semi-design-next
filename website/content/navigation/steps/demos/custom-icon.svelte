<script lang="ts">
    import { IconHome, IconLock } from '@fibrae/semi-icons-svelte';
    import { Steps, type StepData } from '@fibrae/semi-ui-svelte';

    // Steps without `icon` keep their built-in status icon
    const dataSource: StepData[] = [
        { status: 'finish', title: '已完成' },
        { status: 'error', title: '错误' },
        { status: 'warning', title: '警告' },
        { status: 'process', title: '正在进行', icon: homeIcon },
        { status: 'wait', title: '等待', icon: lockIcon },
    ];
    const log = (i: number) => console.log(i);
</script>

{#snippet homeIcon()}<IconHome size="extra-large" />{/snippet}
{#snippet lockIcon()}<IconLock size="extra-large" />{/snippet}

<Steps {dataSource} onChange={log} type="basic" />
