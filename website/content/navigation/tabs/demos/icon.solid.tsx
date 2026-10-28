import { IconFile, IconGlobe, IconHelpCircle } from '@fibrae/semi-icons-solid';
import { Tabs, TabPane } from '@fibrae/semi-ui-solid';

export default function TabsDemo() {
    return (
        <Tabs>
            <TabPane
                tab={
                    <span>
                        <IconFile />
                        文档
                    </span>
                }
                itemKey="1"
            >
                文档
            </TabPane>
            <TabPane
                tab={
                    <span>
                        <IconGlobe />
                        快速起步
                    </span>
                }
                itemKey="2"
            >
                快速起步
            </TabPane>
            <TabPane
                tab={
                    <span>
                        <IconHelpCircle />
                        帮助
                    </span>
                }
                itemKey="3"
            >
                帮助
            </TabPane>
        </Tabs>
    );
}
