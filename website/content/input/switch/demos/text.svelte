<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';
</script>

{#snippet on()}开{/snippet}
{#snippet off()}关{/snippet}
{#snippet bar()}｜{/snippet}
{#snippet ring()}〇{/snippet}

<div>
    <Switch aria-label="带开关文字的开关" checkedText={on} uncheckedText={off} />
    <Switch aria-label="带符号文字的开关" checkedText={bar} style="margin-left: 5px" uncheckedText={ring} />
    <br />
    <br />
    <Switch aria-label="带开关文字的开关，已开启" checked checkedText={on} uncheckedText={off} />
    <Switch aria-label="带符号文字的开关，已开启" checked checkedText={bar} style="margin-left: 5px" uncheckedText={ring} />
    <br />
    <br />
    <Switch aria-label="大号带开关文字的开关" checkedText={on} size="large" uncheckedText={off} />
    <Switch aria-label="大号带符号文字的开关" checkedText={bar} size="large" style="margin-left: 5px" uncheckedText={ring} />
    <br />
    <br />
    <Switch aria-label="大号带开关文字的开关，已开启" checked checkedText={on} size="large" uncheckedText={off} />
    <Switch aria-label="大号带符号文字的开关，已开启" checked checkedText={bar} size="large" style="margin-left: 5px" uncheckedText={ring} />
</div>
