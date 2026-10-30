<script lang="ts">
    import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-svelte';

    const keyStyle = 'width: 100px; text-align: right';
    const data: DescriptionsData[] = [
        { key: '用户名', value: '张三', keyStyle },
        { key: '电子邮箱', value: 'zhangsan@example.com', keyStyle },
        { key: '联系电话', value: '138-0000-0000', keyStyle },
        { key: '地址', value: '北京市朝阳区', keyStyle },
    ];
</script>

<Descriptions align="center" {data} />
