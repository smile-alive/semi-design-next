<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const formatInteger = (value: number | string) => `${value}`.replace(/\D/g, '');
    const log = (number: number) => console.log(number);
</script>

<InputNumber aria-label="Integer" formatter={formatInteger} max={Number.MAX_SAFE_INTEGER} min={0} onNumberChange={log} />
