<script lang="ts">
    import { Button, Collapsible, InputNumber } from '@fibrae/semi-ui-svelte';

    let isOpen = $state(false);
    let duration = $state(250);
</script>

<div>
    <span id="collapsible-duration-label">设置动画时间：</span>
    <InputNumber aria-labelledby="collapsible-duration-label" min={0} onChange={(value) => (duration = Number(value))} step={10} style="width: 120px" value={250} />
    <br />
    <Button aria-controls="collapsible-duration" aria-expanded={isOpen} onclick={() => (isOpen = !isOpen)}>Toggle</Button>
    <Collapsible {duration} id="collapsible-duration" {isOpen}>
        <ul>
            <li>
                <p>Semi Design 以内容优先进行设计。</p>
            </li>
            <li>
                <p>更容易地自定义主题。</p>
            </li>
            <li>
                <p>适用国际化场景。</p>
            </li>
            <li>
                <p>效率场景加入人性化关怀。</p>
            </li>
        </ul>
    </Collapsible>
</div>
