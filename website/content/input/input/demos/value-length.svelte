<script lang="ts">
    import { Button, Form, FormInput, Input, TextArea, TypographyText } from '@fibrae/semi-ui-svelte';

    let value = $state('');

    // Counts grapheme clusters, so an emoji sequence counts as one character
    const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

    const getTextAreaStrLength = (str: string) => str.replace(/\s/g, '').length;
</script>

<div>
    <h4 id="input-value-length-max-length">maxLength=10</h4>
    <div>
        <TypographyText>尝试输入以下字符</TypographyText>
        <div>
            <TypographyText copyable>💖</TypographyText>
        </div>
        <div>
            <TypographyText copyable>👨‍👩‍👧‍👦</TypographyText>
        </div>
    </div>
    <Input aria-labelledby="input-value-length-max-length" bind:value {getValueLength} maxlength={10} style="width: 200px; margin-block: 12px" />
    {#if value}
        <div>
            <div>
                <TypographyText type="tertiary">{`getValueLength=${getValueLength(value)}`}</TypographyText>
            </div>
            <div>
                <TypographyText type="tertiary">{`length=${value.length}`}</TypographyText>
            </div>
        </div>
    {/if}
    <br />
    <br />
    <h4 id="input-value-length-min-length">Form.Input + minLength=4</h4>
    <Form layout="horizontal">
        <FormInput aria-labelledby="input-value-length-min-length" field="username" {getValueLength} minlength={4} noLabel style="width: 200px" />
        <Button htmlType="submit" type="primary">提交</Button>
    </Form>
    <h4 id="input-value-length-max-count">maxCount=10</h4>
    <TextArea aria-labelledby="input-value-length-max-count" getValueLength={getTextAreaStrLength} maxCount={10} rows={2} style="width: 200px" value="semi design" />
</div>
