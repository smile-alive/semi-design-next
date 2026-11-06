<script lang="ts">
    import { PinCode } from '@fibrae/semi-ui-svelte';
</script>

<PinCode aria-label="Verification code" count={4} onChange={(value) => console.log(value)} onComplete={(value) => console.log('pincode: ', value)} size="large" value="6688" />
