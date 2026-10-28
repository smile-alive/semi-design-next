import { Banner } from '@fibrae/semi-ui-react';

export default function BannerDemo() {
    return (
        <>
            <Banner type="info" description="Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码" />
            <br />
            <Banner type="warning" description="当前使用 Figma UI Kit 为旧版，可能无法支持完整的 Design to code 能力" />
            <br />
            <Banner type="danger" description="当前使用 API 已过期，请尽快升级" />
            <br />
            <Banner type="success" description="Semi DSM, Make Semi Design to Any Design" />
        </>
    );
}
