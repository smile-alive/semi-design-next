import React from 'react';
import { Toast, Button } from '@fibrae/semi-ui-react';

const ReachableContext = React.createContext<string | undefined>(undefined);

export default function ToastDemo() {
    const [toast, contextHolder] = Toast.useToast();
    const config = {
        duration: 0,
        content: <ReachableContext.Consumer>{(name) => `ReachableContext: ${name}`}</ReachableContext.Consumer>,
    };

    return (
        <ReachableContext.Provider value="Light">
            <div>
                <Button
                    onClick={() => {
                        toast.success(config);
                    }}
                >
                    Hook Toast
                </Button>
            </div>
            {contextHolder}
        </ReachableContext.Provider>
    );
}
