<script lang="ts">
    import { ColorPicker, colorStringToValue } from '@fibrae/semi-ui-svelte';

    let value = $state.raw(colorStringToValue('#39c5bb'));
</script>

<div>
    <ColorPicker alpha bind:value />
</div>
