<script lang="ts">
    import { Button, PinCode } from '@fibrae/semi-ui-svelte';

    let value = $state('69af41');
</script>

<div>
    <Button onclick={() => (value = String(Math.floor(Math.random() * 100000000)).slice(0, 6))}>Set Random Value</Button>
    <br />
    <br />
    <PinCode aria-label="Verification code" bind:value format="mixed" onChange={(code) => console.log(code)} onComplete={(code) => console.log('pincode: ', code)} />
</div>
