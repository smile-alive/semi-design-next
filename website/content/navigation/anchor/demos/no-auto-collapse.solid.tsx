import { Anchor } from '@fibrae/semi-ui-solid';

export default function AnchorDemo() {
    return (
        <div>
            <Anchor autoCollapse={false} targetOffset={60} offsetTop={100}>
                <Anchor.Link href="#动态展示" title="1. 动态展示">
                    <Anchor.Link href="#组件" title="1.1 组件">
                        <Anchor.Link href="#头像" title="1.1.1 Avatar" />
                        <Anchor.Link href="#按钮" title="1.1.2 Button" />
                        <Anchor.Link href="#图标" title="1.1.3 Icon" />
                    </Anchor.Link>
                    <Anchor.Link href="#物料" title="1.2 物料" />
                    <Anchor.Link href="#主题商店" title="1.3 主题商店" />
                </Anchor.Link>
                <Anchor.Link href="#设计语言" title="2. 设计语言" />
            </Anchor>
        </div>
    );
}
