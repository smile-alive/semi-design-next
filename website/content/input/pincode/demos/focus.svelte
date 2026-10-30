<script lang="ts">
    import { Button, PinCode } from '@fibrae/semi-ui-svelte';

    let value = $state('69af41');
    let pinCode = $state<ReturnType<typeof PinCode>>();

    const onComplete = (code: string) => console.log('pincode: ', code);
    const onChange = (code: string) => console.log(code);
</script>

<div>
    <Button onclick={() => pinCode?.focus(2)}>Focus Third Input</Button>
    <br />
    <br />
    <PinCode aria-label="Verification code" bind:this={pinCode} bind:value format="mixed" {onChange} {onComplete} />
</div>
