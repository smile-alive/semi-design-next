<script lang="ts">
    import { Steps } from '@fibrae/semi-ui-svelte';

    const dataSource = [{ title: 'First' }, { title: 'Second' }, { title: 'Last' }];
    let current = $state(1);
</script>

<div>
    <Steps {current} {dataSource} onChange={(next) => (current = next)} type="basic" />
</div>
