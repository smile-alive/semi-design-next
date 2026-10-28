import { Checkbox } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    return (
        <>
            <Checkbox aria-label="Checkbox 示例" extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统">
                Semi Design
            </Checkbox>
            <br />
            <Checkbox style={{ width: '280px' }} aria-label="Checkbox 示例" extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统">
                Semi Design
            </Checkbox>
        </>
    );
}
