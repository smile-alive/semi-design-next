<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';
</script>

<InputNumber aria-label="Integer" formatter={(value) => `${value}`.replace(/\D/g, '')} max={Number.MAX_SAFE_INTEGER} min={0} onNumberChange={(number) => console.log(number)} />
