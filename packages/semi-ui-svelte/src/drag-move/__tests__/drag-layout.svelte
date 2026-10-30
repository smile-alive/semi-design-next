<script lang="ts">
    import dragMove from '../drag-move';
    import type { DragMoveOptions } from '../interface';

    let { options, onInnerClick }: { options: DragMoveOptions; onInnerClick?: () => void } = $props();
</script>

<div data-testid="box" style="position: relative; width: 200px; height: 100px; margin: 20px">
    <div {@attach dragMove(options)} data-testid="drag" style="width: 80px; height: 40px">
        <button type="button" onclick={onInnerClick}>inner</button>
    </div>
</div>
