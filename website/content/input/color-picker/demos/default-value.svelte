<script lang="ts">
    import { ColorPicker, colorStringToValue } from '@fibrae/semi-ui-svelte';

    const defaultValue = colorStringToValue('rgb(57,197,187)');
</script>

<div>
    <ColorPicker alpha onChange={(value) => console.log(value)} value={defaultValue} />
</div>
