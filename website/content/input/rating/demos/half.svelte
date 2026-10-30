<script lang="ts">
    import { Rating } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Rating allowHalf value={3.5} />
    <br />
    <Rating allowHalf disabled value={3.65} />
</div>
