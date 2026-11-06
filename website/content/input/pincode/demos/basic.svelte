<script lang="ts">
    import { PinCode } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <PinCode aria-label="Verification code, small" onChange={(value) => console.log(value)} onComplete={(value) => console.log('pincode: ', value)} size="small" value="123456" />
    <br />
    <PinCode aria-label="Verification code, default" onChange={(value) => console.log(value)} onComplete={(value) => console.log('pincode: ', value)} size="default" value="123456" />
    <br />
    <PinCode aria-label="Verification code, large" onChange={(value) => console.log(value)} onComplete={(value) => console.log('pincode: ', value)} size="large" value="123456" />
</div>
