<script lang="ts">
    import { Input, TextArea } from '@fibrae/semi-ui-svelte';

    let inputValue = $state('');
    let textAreaValue = $state('');
    let inputChanges = $state(0);
    let textAreaChanges = $state(0);
    const style = 'width: 300px';
    const counterStyle = 'margin-top: 8px; color: var(--semi-color-text-2); font-size: 12px';
</script>

<div>
    <h4>Input with composition</h4>
    <Input bind:value={inputValue} composition onChange={() => inputChanges++} placeholder="开启 composition，拼音输入时不会触发 onChange" {style} />
    <div style={counterStyle}>onChange 触发次数: {inputChanges}</div>
    <br />
    <br />
    <h4>TextArea with composition</h4>
    <TextArea bind:value={textAreaValue} composition onChange={() => textAreaChanges++} placeholder="开启 composition，拼音输入时不会触发 onChange" {style} />
    <div style={counterStyle}>onChange 触发次数: {textAreaChanges}</div>
</div>
