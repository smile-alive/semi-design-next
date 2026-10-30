<script lang="ts">
    import { Steps } from '@fibrae/semi-ui-svelte';

    const dataSource = [
        { title: 'Finished', description: 'This is a description' },
        { title: 'In Progress', description: 'This is a description' },
        { title: 'Waiting', description: 'This is a description' },
    ];
    const log = (i: number) => console.log(i);
</script>

<Steps current={1} {dataSource} direction="vertical" onChange={log} type="basic" />
