<script lang="ts">
    import Icon from '../../src';
</script>

<Icon fill="red">
    {#snippet children({ fill })}
        <svg fill={typeof fill === 'string' ? fill : undefined}></svg>
    {/snippet}
</Icon>
