import React from 'react';
import { IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh } from '@fibrae/semi-icons-react';

export default function IconDemo() {
    const types = [<IconSearch key="search" />, <IconHelpCircle key="help-circle" />, <IconAlertCircle key="alert-circle" />, <IconMinusCircle key="minus-circle" />, <IconPlusCircle key="plus-circle" />, <IconPlus key="plus" />, <IconRefresh key="refresh" />];
    const sizes = ['extra-small', 'small', 'default', 'large', 'extra-large'];
    let icons = types.map((type, i) => {
        return (
            <div key={i} style={{ marginBottom: 4 }}>
                {sizes.map((size) => React.cloneElement(type, { size, key: size }))}
            </div>
        );
    });
    return <>{icons}</>;
}
