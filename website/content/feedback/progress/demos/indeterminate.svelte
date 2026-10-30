<script lang="ts">
    import { Progress } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 240px">
    <Progress aria-label="正在加载" indeterminate />
    <br />
    <Progress aria-label="正在加载" indeterminate size="large" />
    <div style="display: flex; align-items: center; gap: 16px; margin-top: 20px">
        <Progress aria-label="正在加载" indeterminate type="circle" />
        <Progress aria-label="正在加载" indeterminate size="small" type="circle" />
    </div>
</div>
