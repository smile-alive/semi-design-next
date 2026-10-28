import { Anchor } from '@fibrae/semi-ui-react';

export default function AnchorDemo() {
    return (
        <div>
            <Anchor showTooltip position="right" targetOffset={60} offsetTop={100}>
                <Anchor.Link href="#工具提示位置" title="工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。" />
                <Anchor.Link href="#组件" title="组件" />
                <Anchor.Link href="#设计语言" title="设计语言" />
                <Anchor.Link href="#物料平台" title="物料平台" />
                <Anchor.Link href="#主题商店" title="主题商店" />
            </Anchor>
        </div>
    );
}
