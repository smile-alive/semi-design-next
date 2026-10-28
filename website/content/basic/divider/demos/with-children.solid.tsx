import { IconSemiLogo } from '@fibrae/semi-icons-solid';
import { Divider } from '@fibrae/semi-ui-solid';

export default function DividerDemo() {
    return (
        <div>
            <Divider margin="12px" align="left">
                这是居左文字
            </Divider>

            <Divider margin="12px" align="center">
                这是居中文字
            </Divider>

            <Divider margin="12px" align="right">
                这是居右文字
            </Divider>

            <Divider margin="12px">
                <IconSemiLogo />
            </Divider>
        </div>
    );
}
