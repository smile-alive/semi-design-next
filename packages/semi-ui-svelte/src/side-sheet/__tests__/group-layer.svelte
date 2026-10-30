<script lang="ts">
    import ButtonGroup from '../../button/button-group.svelte';
    import Button from '../../button/button.svelte';
    import SideSheet from '../side-sheet.svelte';
</script>

<ButtonGroup disabled type="danger">
    <SideSheet motion={false} visible>
        <Button>in sheet</Button>
    </SideSheet>
</ButtonGroup>
