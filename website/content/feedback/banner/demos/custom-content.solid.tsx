import { Banner } from '@fibrae/semi-ui-solid';

export default function BannerDemo() {
    return (
        <div style={{ width: '500px', padding: '20px', border: '1px solid var(--semi-color-border)' }}>
            <Banner fullMode={false} title="Title" type="warning" bordered description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat">
                <div class="semi-modal-footer">
                    <button class="semi-button semi-button-tertiary semi-button-light" type="button">
                        No, thanks.
                    </button>
                    <button class="semi-button semi-button-warning" type="button">
                        Sounds great!
                    </button>
                </div>
            </Banner>
            <br />
        </div>
    );
}
