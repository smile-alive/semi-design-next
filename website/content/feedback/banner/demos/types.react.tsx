import { Banner } from '@fibrae/semi-ui-react';

export default function BannerDemo() {
    return (
        <>
            <Banner type="info" description="一套组件，四个框架原生可用，随时查阅对应的前端代码" />
            <br />
            <Banner type="warning" description="当前使用的 UI Kit 为旧版，可能无法支持完整的组件能力" />
            <br />
            <Banner type="danger" description="当前使用 API 已过期，请尽快升级" />
            <br />
            <Banner type="success" description="Semi Design Next themes through --semi-* variables" />
        </>
    );
}
