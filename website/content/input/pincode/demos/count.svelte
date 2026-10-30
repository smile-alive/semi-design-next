<script lang="ts">
    import { PinCode } from '@fibrae/semi-ui-svelte';

    const onComplete = (value: string) => console.log('pincode: ', value);
    const onChange = (value: string) => console.log(value);
</script>

<PinCode aria-label="Verification code" count={4} {onChange} {onComplete} size="large" value="6688" />
