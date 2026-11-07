<script lang="ts">
    import { InputGroup } from '../../input';
    import ButtonGroup from '../button-group.svelte';
    import Button from '../button.svelte';
</script>

<InputGroup disabled size="large">
    <Button size="small">own-size</Button>
    <Button disabled={false}>own-enabled</Button>
    <Button>plain</Button>
    <div><Button>deep</Button></div>
    <ButtonGroup>
        <Button>grouped-a</Button>
        <Button>grouped-b</Button>
    </ButtonGroup>
    <ButtonGroup size="small">
        <Button>small-a</Button>
        <Button>small-b</Button>
    </ButtonGroup>
    <ButtonGroup disabled={false}>
        <Button>enabled-a</Button>
        <Button>enabled-b</Button>
    </ButtonGroup>
    <ButtonGroup>
        <ButtonGroup>
            <Button>nested</Button>
        </ButtonGroup>
    </ButtonGroup>
</InputGroup>
