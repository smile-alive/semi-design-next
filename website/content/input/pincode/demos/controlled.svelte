<script lang="ts">
    import { Button, PinCode } from '@fibrae/semi-ui-svelte';

    let value = $state('69af41');

    const setRandomValue = () => {
        value = String(Math.floor(Math.random() * 100000000)).slice(0, 6);
    };
    const onComplete = (code: string) => console.log('pincode: ', code);
    const onChange = (code: string) => console.log(code);
</script>

<div>
    <Button onclick={setRandomValue}>Set Random Value</Button>
    <br />
    <br />
    <PinCode aria-label="Verification code" bind:value format="mixed" {onChange} {onComplete} />
</div>
