import { Checkbox } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    return (
        <>
            <Checkbox aria-label="Checkbox 示例" extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用">
                Semi Design
            </Checkbox>
            <br />
            <Checkbox style={{ width: '280px' }} aria-label="Checkbox 示例" extra="Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用">
                Semi Design
            </Checkbox>
        </>
    );
}
