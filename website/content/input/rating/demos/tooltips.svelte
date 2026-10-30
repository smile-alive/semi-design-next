<script lang="ts">
    import { Rating } from '@fibrae/semi-ui-svelte';

    let value = $state<number | undefined>(0);
    const desc = ['极差', '较差', '一般', '满意', '非常满意'];
</script>

<div>
    <span>
        你对获得的帮助是否满意：
        {#if value}
            <span>{desc[value - 1]}</span>
        {/if}
    </span>
    <br />
    <Rating bind:value tooltips={desc} />
</div>
