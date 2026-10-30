<script lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-svelte';

    let hex = $state('');

    const onChange = (value: ColorValue) => {
        hex = value.hex;
    };
</script>

<ColorPicker alpha {onChange} />
<p>当前颜色：{hex}</p>
