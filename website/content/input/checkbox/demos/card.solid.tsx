import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    return (
        <CheckboxGroup type="card" defaultValue={['1', '3']} direction="vertical" aria-label="CheckboxGroup 示例">
            <Checkbox value="1" disabled extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用" style={{ width: '280px' }}>
                单选框标题
            </Checkbox>
            <Checkbox value="2" disabled extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用" style={{ width: '280px' }}>
                单选框标题
            </Checkbox>
            <Checkbox value="3" extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用" style={{ width: '280px' }}>
                单选框标题
            </Checkbox>
            <Checkbox value="4" extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用" style={{ width: '280px' }}>
                单选框标题
            </Checkbox>
        </CheckboxGroup>
    );
}
