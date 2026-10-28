import { createContext, useContext } from 'solid-js';
import { Button, Toast } from '@fibrae/semi-ui-solid';

const ReachableContext = createContext<string>();

export default function ToastDemo() {
    const [toast, contextHolder] = Toast.useToast();

    return (
        <ReachableContext.Provider value="Light">
            <div>
                <Button
                    onClick={() => {
                        // A function is called where the toast renders, so it reads the context around contextHolder
                        toast.success({ duration: 0, content: () => `ReachableContext: ${useContext(ReachableContext)}` });
                    }}
                >
                    Hook Toast
                </Button>
            </div>
            {contextHolder}
        </ReachableContext.Provider>
    );
}
