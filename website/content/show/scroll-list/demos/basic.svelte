<script lang="ts">
    import { Button, ScrollItem, ScrollList, type ScrollItemSelectData } from '@fibrae/semi-ui-svelte';

    const ampms = [{ value: '上午' }, { value: '下午' }];
    const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));
    const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 3 === 0 }));

    let selectIndex1 = $state(1);
    let selectIndex2 = $state(1);
    let selectIndex3 = $state(1);

    const onSelectHour = (data: ScrollItemSelectData) => {
        console.log('You have choose the hour for: ', data.value);
    };

    const onSelectMinute = (data: ScrollItemSelectData) => {
        console.log('You have choose the minute for: ', data.value);
    };

    const handleClose = () => {
        console.log('close');
    };
</script>

<ScrollList header="无限滚动列表" style="border: unset; box-shadow: unset">
    <ScrollItem aria-label="上午或下午" bind:selectedIndex={selectIndex1} cycled={false} list={ampms} mode="wheel" type={1} />
    <ScrollItem aria-label="小时" bind:selectedIndex={selectIndex2} cycled list={hours} mode="wheel" onSelect={onSelectHour} type={2} />
    <ScrollItem aria-label="分钟" bind:selectedIndex={selectIndex3} cycled list={minutes} mode="wheel" onSelect={onSelectMinute} type={3} />
    {#snippet footer()}
        <Button size="small" type="primary" onclick={handleClose}>Ok</Button>
    {/snippet}
</ScrollList>
