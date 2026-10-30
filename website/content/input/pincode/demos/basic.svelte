<script lang="ts">
    import { PinCode } from '@fibrae/semi-ui-svelte';

    const onComplete = (value: string) => console.log('pincode: ', value);
    const onChange = (value: string) => console.log(value);
</script>

<div>
    <PinCode aria-label="Verification code, small" {onChange} {onComplete} size="small" value="123456" />
    <br />
    <PinCode aria-label="Verification code, default" {onChange} {onComplete} size="default" value="123456" />
    <br />
    <PinCode aria-label="Verification code, large" {onChange} {onComplete} size="large" value="123456" />
</div>
