import { For } from 'solid-js';
import { Avatar, AvatarGroup, Popover, type AvatarGroupProps } from '@fibrae/semi-ui-solid';

const renderMore: AvatarGroupProps['renderMore'] = (restNumber, restAvatars) => (
    <Popover
        content={
            <div>
                <For each={restAvatars}>
                    {(avatar) => (
                        <div style={{ 'padding-bottom': '12px' }}>
                            {avatar({ size: 'extra-small' })}
                            <span style={{ 'margin-left': '8px', 'font-size': '14px' }}>这是段文字描述</span>
                        </div>
                    )}
                </For>
            </div>
        }
        autoAdjustOverflow={false}
        position="bottomRight"
        style={{ padding: '12px 8px', 'padding-bottom': '0' }}
    >
        {(trigger) => <Avatar {...trigger()}>{`+${restNumber}`}</Avatar>}
    </Popover>
);

export default function AvatarDemo() {
    return (
        <AvatarGroup maxCount={3} renderMore={renderMore}>
            <Avatar color="red" alt="Lisa LeBlanc">
                LL
            </Avatar>
            <Avatar alt="Caroline Xiao">CX</Avatar>
            <Avatar color="amber" alt="Rafal Matin">
                RM
            </Avatar>
            <Avatar style={{ color: '#f56a00', 'background-color': '#fde3cf' }} alt="Zank Lance">
                ZL
            </Avatar>
            <Avatar style={{ 'background-color': '#87d068' }} alt="Youself Zhang">
                YZ
            </Avatar>
        </AvatarGroup>
    );
}
