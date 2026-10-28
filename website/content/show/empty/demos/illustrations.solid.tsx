import {
    IllustrationConstruction,
    IllustrationConstructionDark,
    IllustrationFailure,
    IllustrationFailureDark,
    IllustrationIdle,
    IllustrationIdleDark,
    IllustrationNoAccess,
    IllustrationNoAccessDark,
    IllustrationNoContent,
    IllustrationNoContentDark,
    IllustrationNotFound,
    IllustrationNotFoundDark,
    IllustrationNoResult,
    IllustrationNoResultDark,
    IllustrationSuccess,
    IllustrationSuccessDark,
} from '@fibrae/semi-illustrations-solid';
import { Empty } from '@fibrae/semi-ui-solid';

const emptyStyle = { padding: '30px' };
const illustrationStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return (
        <div style={{ display: 'flex', 'flex-wrap': 'wrap' }}>
            <Empty image={<IllustrationSuccess style={illustrationStyle} />} darkModeImage={<IllustrationSuccessDark style={illustrationStyle} />} description="创建成功" style={emptyStyle} />
            <Empty image={<IllustrationFailure style={illustrationStyle} />} darkModeImage={<IllustrationFailureDark style={illustrationStyle} />} description="加载失败" style={emptyStyle} />
            <Empty image={<IllustrationNoAccess style={illustrationStyle} />} darkModeImage={<IllustrationNoAccessDark style={illustrationStyle} />} description="没有权限" style={emptyStyle} />
            <Empty image={<IllustrationNoContent style={illustrationStyle} />} darkModeImage={<IllustrationNoContentDark style={illustrationStyle} />} description="暂无内容，请添加" style={emptyStyle} />
            <Empty image={<IllustrationNotFound style={illustrationStyle} />} darkModeImage={<IllustrationNotFoundDark style={illustrationStyle} />} description="页面404" style={emptyStyle} />
            <Empty image={<IllustrationNoResult style={illustrationStyle} />} darkModeImage={<IllustrationNoResultDark style={illustrationStyle} />} description="搜索无结果" style={emptyStyle} />
            <Empty image={<IllustrationConstruction style={illustrationStyle} />} darkModeImage={<IllustrationConstructionDark style={illustrationStyle} />} description="建设中" style={emptyStyle} />
            <Empty image={<IllustrationIdle style={illustrationStyle} />} darkModeImage={<IllustrationIdleDark style={illustrationStyle} />} description="神游四方" style={emptyStyle} />
        </div>
    );
}
