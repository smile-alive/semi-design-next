import { For, Show } from 'solid-js';
import { Banner, Typography } from '@fibrae/semi-ui-solid';

const { Text } = Typography;

const types = ['info', 'warning', 'danger', 'success'] as const;

const titleStyle = {
    'font-weight': '600',
    'font-size': '14px',
    'line-height': '20px',
};

export default function BannerDemo() {
    return (
        <div style={{ width: '640px' }} class="components-banner-demo">
            <For each={types}>
                {(type, index) => (
                    <>
                        <Show when={index() > 0}>
                            <br />
                        </Show>
                        <Banner
                            fullMode={false}
                            type={type}
                            bordered
                            icon={null}
                            closeIcon={null}
                            title={<div style={titleStyle}>不知道 AppKey？</div>}
                            description={
                                <div>
                                    你可先联系对应的研发同学，确认是否已在 <Text link={{ href: 'https://semi.design/' }}>应用云平台</Text> 申请了应用，并填写对应的信息。
                                </div>
                            }
                        />
                    </>
                )}
            </For>
        </div>
    );
}
