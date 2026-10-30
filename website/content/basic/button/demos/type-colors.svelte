<script lang="ts">
    const types = [
        ['primary', '主要'],
        ['secondary', '次要'],
        ['tertiary', '第三'],
        ['warning', '警告'],
        ['danger', '危险'],
    ];
</script>

<article>
    {#each types as [type, label] (type)}
        <strong style={`color: var(--semi-color-${type}); margin-right: 10px`}>
            {label}
        </strong>
    {/each}
</article>
