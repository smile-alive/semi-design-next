<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <div>
        <div>默认</div>
        <Slider aria-label="默认滑动输入条" showBoundary />
    </div>
    <br />
    <br />
    <div>
        <div>范围</div>
        <Slider aria-label="范围滑动输入条" range value={[20, 60]} />
    </div>
    <br />
    <br />
    <div>
        <div>禁用</div>
        <Slider aria-label="禁用滑动输入条" disabled value={40} />
    </div>
</div>
