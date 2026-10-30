<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
</script>

<Form onSubmit={(values) => console.log(values)} style="width: 400px">
    <FormInput field="name" label="姓名" noLabel placeholder="请输入姓名" style="width: 250px" trigger="blur" />
    <FormInput field="purename" placeholder="DOM结构与普通 Input 组件完全一致" pure />
</Form>
