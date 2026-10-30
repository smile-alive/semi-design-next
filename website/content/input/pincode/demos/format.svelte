<script lang="ts">
    import { PinCode, TypographyText } from '@fibrae/semi-ui-svelte';

    const onComplete = (value: string) => console.log('pincode: ', value);
    const isLower = (char: string) => /[a-z]/.test(char);
</script>

<div>
    <TypographyText id="pincode-format-number">纯数字</TypographyText>
    <PinCode aria-labelledby="pincode-format-number" format="number" {onComplete} />
    <br />
    <TypographyText id="pincode-format-mixed">字母和数字</TypographyText>
    <PinCode aria-labelledby="pincode-format-mixed" format="mixed" {onComplete} />
    <br />
    <TypographyText id="pincode-format-upper">只大写字母</TypographyText>
    <PinCode aria-labelledby="pincode-format-upper" format={/[A-Z]/} {onComplete} />
    <br />
    <TypographyText id="pincode-format-lower">只小写字母(函数判断)</TypographyText>
    <PinCode aria-labelledby="pincode-format-lower" format={isLower} {onComplete} />
</div>
