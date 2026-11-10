import { createContext, useContext } from 'solid-js';
import { Button, Toast } from '@fibrae/semi-ui-solid';

const ReachableContext = createContext<string>();

// The holder must be created under the Provider: its toasts read the context around it
function HookDemo() {
    const [toast, contextHolder] = Toast.useToast();
    const config = {
        duration: 0,
        // A function is called where the toast renders, so it reads the context around contextHolder
        content: () => `ReachableContext: ${useContext(ReachableContext)}`,
    };

    return (
        <>
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
        </>
    );
}

export default function ToastDemo() {
    return (
        <ReachableContext.Provider value="Light">
            <HookDemo />
        </ReachableContext.Provider>
    );
}
