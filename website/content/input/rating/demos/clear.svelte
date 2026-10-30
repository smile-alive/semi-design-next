<script lang="ts">
    import { Rating } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <span>允许再次点击清除</span>
    <br />
    <Rating allowClear value={3} />
    <br />
    <br />
    <span>禁止再次点击清除</span>
    <br />
    <Rating allowClear={false} value={3} />
</div>
