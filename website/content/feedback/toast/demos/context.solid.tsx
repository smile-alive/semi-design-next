import { createContext, useContext } from 'solid-js';
import { Button, Toast } from '@fibrae/semi-ui-solid';

const ReachableContext = createContext<string>();

export default function ToastDemo() {
    const [toast, contextHolder] = Toast.useToast();
    const config = {
        duration: 0,
        // A function is called where the toast renders, so it reads the context around contextHolder
        content: () => `ReachableContext: ${useContext(ReachableContext)}`,
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
