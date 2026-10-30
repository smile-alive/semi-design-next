<script lang="ts">
    import { Avatar, Select, Tag, type SelectOptionProps, type SelectValue } from '@fibrae/semi-ui-svelte';

    const optionStyle = 'display: flex; padding-left: 24px; padding-top: 10px; padding-bottom: 10px';

    const list = [
        {
            name: '夏可漫',
            email: 'xiakeman@example.com',
            avatar: '/assets/placeholder/avatar-a.svg',
        },
        {
            name: '申悦',
            email: 'shenyue@example.com',
            avatar: '/assets/root-web-sites/bag.jpeg',
        },
        {
            name: '曲晨一',
            email: 'quchenyi@example.com',
            avatar: '/assets/placeholder/avatar-c.svg',
        },
        {
            name: '文嘉茂',
            email: 'wenjiamao@example.com',
            avatar: '/assets/root-web-sites/6fbafc2d-e3e6-4cff-a1e2-17709c680624.png',
        },
    ].map((item) => ({ ...item, value: item.name, label: item.name, showTick: true, style: optionStyle }));

    const onChange = (value: SelectValue) => console.log(value);
</script>

{#snippet optionLabel({ option }: { option: SelectOptionProps })}
    <Avatar alt="" size="small" src={option.avatar} />
    <div style="margin-left: 8px">
        <div style="font-size: 14px">{option.name}</div>
        <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">
            {option.email}
        </div>
    </div>
{/snippet}

<Select aria-label="单选" {onChange} {optionLabel} optionList={list} placeholder="请选择" style="width: 280px; height: 40px" value="申悦">
    {#snippet selectedItem({ option })}
        <div style="display: flex; align-items: center">
            <Avatar alt="" size="small" src={option.avatar} />
            <span style="margin-left: 8px">{option.email}</span>
        </div>
    {/snippet}
</Select>
<Select aria-label="多选圆形头像" maxTagCount={2} multiple {onChange} {optionLabel} optionList={list} placeholder="请选择" style="width: 280px; margin-top: 20px" value={['申悦', '曲晨一']}>
    {#snippet tag({ option, onClose })}
        <Tag avatarShape="circle" avatarSrc={option.avatar} closable {onClose} size="large">
            {option.name}
        </Tag>
    {/snippet}
</Select>
<Select aria-label="多选方形头像" maxTagCount={2} multiple {onChange} {optionLabel} optionList={list} placeholder="请选择" style="width: 280px; margin-top: 20px" value={['申悦', '曲晨一']}>
    {#snippet tag({ option, onClose })}
        <Tag avatarShape="square" avatarSrc={option.avatar} closable {onClose} size="large">
            {option.name}
        </Tag>
    {/snippet}
</Select>
