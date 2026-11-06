<script lang="ts">
    import { Button, PinCode } from '@fibrae/semi-ui-svelte';

    let value = $state('69af41');
    let pinCode = $state<ReturnType<typeof PinCode>>();
</script>

<div>
    <Button onclick={() => pinCode?.focus(2)}>Focus Third Input</Button>
    <br />
    <br />
    <PinCode aria-label="Verification code" bind:this={pinCode} bind:value format="mixed" onChange={(code) => console.log(code)} onComplete={(code) => console.log('pincode: ', code)} />
</div>
