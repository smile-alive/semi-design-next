<script lang="ts">
    import { Badge } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Badge count={5} />
    <br />
    <br />
    <Badge count="NEW" theme="light" />
    <br />
    <br />
    <Badge count={99} overflowCount={10} type="danger" />
    <br />
    <br />
    <span><Badge dot type="primary" /> 进行中 processing</span>
    <br />
    <span><Badge dot type="tertiary" /> 信息 info</span>
    <br />
    <span><Badge dot type="success" /> 成功 success</span>
    <br />
    <span><Badge dot type="warning" /> 提醒 warning</span>
    <br />
    <span><Badge dot type="danger" /> 错误 error</span>
</div>
