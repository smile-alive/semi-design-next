<script lang="ts">
    import { Button, Slider } from '@fibrae/semi-ui-svelte';

    let value = $state<number | number[]>(10);

    const changeValue = () => {
        value = Number(value) + 10;
    };
</script>

<div>
    <Button style="margin-right: 20px" onclick={changeValue}>点击改变value值</Button>
    <br />
    <br />
    <Slider aria-label="受控滑块" bind:value />
</div>
