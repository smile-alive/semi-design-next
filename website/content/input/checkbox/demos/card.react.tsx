import { CheckboxGroup, Checkbox } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    return (
        <CheckboxGroup type="card" defaultValue={['1', '3']} direction="vertical" aria-label="CheckboxGroup 示例">
            <Checkbox value="1" disabled extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Checkbox>
            <Checkbox value="2" disabled extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Checkbox>
            <Checkbox value="3" extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Checkbox>
            <Checkbox value="4" extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Checkbox>
        </CheckboxGroup>
    );
}
