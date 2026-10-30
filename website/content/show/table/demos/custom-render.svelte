<script lang="ts">
    import { IconClear, IconComment, IconDelete, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { IllustrationNoResult, IllustrationNoResultDark } from '@fibrae/semi-illustrations-svelte';
    import { Avatar, Button, Empty, Table, Tag, TypographyText, type ColumnProps } from '@fibrae/semi-ui-svelte';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        status: 'success' | 'pending' | 'wait';
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue' | 'green';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const raw: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿标题可能有点长这时候应该显示 Tooltip.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'success',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'wait',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '4',
            name: 'Semi D2C 设计文档可能也有点长所以也会显示 Tooltip',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'success',
            owner: '姜琪',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'green',
        },
    ];

    let dataSource = $state.raw(raw);

    const removeRecord = (key: string) => {
        dataSource = dataSource.filter((data) => data.key !== key);
    };
    const resetData = () => {
        dataSource = [...raw];
    };

    const columns: ColumnProps[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
        },
        {
            title: '大小',
            dataIndex: 'size',
            width: 150,
        },
        {
            title: '交付状态',
            dataIndex: 'status',
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            width: 300,
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            width: 200,
        },
        {
            title: '',
            dataIndex: 'operate',
        },
    ];
</script>

{#snippet image()}<IllustrationNoResult style="width: 150px; height: 150px" />{/snippet}
{#snippet darkModeImage()}<IllustrationNoResultDark style="width: 150px; height: 150px" />{/snippet}

<div>
    <Button style="margin-bottom: 10px" onclick={resetData}>重置</Button>
    <Table {columns} {dataSource} pagination={false} style="min-height: 350px">
        {#snippet cell({ column, record, text })}
            {#if column.dataIndex === 'name'}
                <span style="display: flex; align-items: center">
                    <Avatar alt="" shape="square" size="small" src={record.nameIconSrc} style="margin-right: 12px" />
                    <!-- Width = the cell's 400px minus the non-text content -->
                    <TypographyText ellipsis={{ showTooltip: true }} style="width: calc(400px - 76px)">{text}</TypographyText>
                </span>
            {:else if column.dataIndex === 'status'}
                {@const config = tagConfig[text as Row['status']]}
                <Tag color={config.color} shape="circle" style="user-select: text">
                    {#snippet prefixIcon()}
                        <config.icon />
                    {/snippet}
                    {config.text}
                </Tag>
            {:else if column.dataIndex === 'owner'}
                <div>
                    <Avatar color={record.avatarBg} size="small" style="margin-right: 4px">
                        {typeof text === 'string' && text.slice(0, 1)}
                    </Avatar>
                    {text}
                </div>
            {:else if column.dataIndex === 'operate'}
                <Button aria-label="删除" theme="borderless" onclick={() => removeRecord(record.key)}>
                    {#snippet icon()}
                        <IconDelete />
                    {/snippet}
                </Button>
            {:else}
                {text}
            {/if}
        {/snippet}
        {#snippet empty()}
            <Empty {darkModeImage} {image}>
                {#snippet description()}搜索无结果{/snippet}
            </Empty>
        {/snippet}
    </Table>
</div>
