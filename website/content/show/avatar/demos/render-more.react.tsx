import React, { type ReactNode } from 'react';
import { AvatarGroup, Avatar, Popover, type AvatarProps } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    const renderMore = (restNumber?: number, restAvatars: ReactNode[] = []) => {
        const content = restAvatars.map((avatar, index) => {
            return (
                <div style={{ paddingBottom: '12px' }} key={index}>
                    {React.isValidElement<AvatarProps>(avatar) && React.cloneElement(avatar, { size: 'extra-small' })}
                    <span style={{ marginLeft: 8, fontSize: 14 }}>这是段文字描述</span>
                </div>
            );
        });
        return (
            <Popover content={content} autoAdjustOverflow={false} position="bottomRight" style={{ padding: '12px 8px', paddingBottom: 0 }}>
                <Avatar>{`+${restNumber}`}</Avatar>
            </Popover>
        );
    };

    return (
        <AvatarGroup maxCount={3} renderMore={renderMore}>
            <Avatar color="red" alt="Lisa LeBlanc">
                LL
            </Avatar>
            <Avatar alt="Caroline Xiao">CX</Avatar>
            <Avatar color="amber" alt="Rafal Matin">
                RM
            </Avatar>
            <Avatar style={{ color: '#f56a00', backgroundColor: '#fde3cf' }} alt="Zank Lance">
                ZL
            </Avatar>
            <Avatar style={{ backgroundColor: '#87d068' }} alt="Youself Zhang">
                YZ
            </Avatar>
        </AvatarGroup>
    );
}
