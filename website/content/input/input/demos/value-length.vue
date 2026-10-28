<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Form, FormInput, Input, TextArea, TypographyText } from '@fibrae/semi-ui-vue';

    const value = ref('');

    // Counts grapheme clusters, so an emoji sequence counts as one character
    const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

    const getTextAreaStrLength = (str: string) => str.replace(/\s/g, '').length;
</script>

<template>
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
        <Input v-model="value" aria-labelledby="input-value-length-max-length" :getValueLength="getValueLength" :maxlength="10" style="width: 200px; margin-block: 12px" />
        <div v-if="value">
            <div>
                <TypographyText type="tertiary">{{ `getValueLength=${getValueLength(value)}` }}</TypographyText>
            </div>
            <div>
                <TypographyText type="tertiary">{{ `length=${value.length}` }}</TypographyText>
            </div>
        </div>
        <br />
        <br />
        <h4 id="input-value-length-min-length">Form.Input + minLength=4</h4>
        <Form layout="horizontal">
            <FormInput aria-labelledby="input-value-length-min-length" field="username" :getValueLength="getValueLength" :minlength="4" noLabel style="width: 200px" />
            <Button htmlType="submit" type="primary">提交</Button>
        </Form>
        <h4 id="input-value-length-max-count">maxCount=10</h4>
        <TextArea aria-labelledby="input-value-length-max-count" defaultValue="semi design" :getValueLength="getTextAreaStrLength" :maxCount="10" :rows="2" style="width: 200px" />
    </div>
</template>
