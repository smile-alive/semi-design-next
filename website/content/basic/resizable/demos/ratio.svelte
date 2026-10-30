<script lang="ts">
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 500px; height: 60%">
    <Resizable defaultSize={{ width: 200, height: 200 }} ratio={2} style="background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">ratio=2</div>
    </Resizable>
</div>
