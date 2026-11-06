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
const imageStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return (
        <div style={{ display: 'flex', 'flex-wrap': 'wrap' }}>
            <Empty image={<IllustrationSuccess style={imageStyle} />} darkModeImage={<IllustrationSuccessDark style={imageStyle} />} description="创建成功" style={emptyStyle} />
            <Empty image={<IllustrationFailure style={imageStyle} />} darkModeImage={<IllustrationFailureDark style={imageStyle} />} description="加载失败" style={emptyStyle} />
            <Empty image={<IllustrationNoAccess style={imageStyle} />} darkModeImage={<IllustrationNoAccessDark style={imageStyle} />} description="没有权限" style={emptyStyle} />
            <Empty image={<IllustrationNoContent style={imageStyle} />} darkModeImage={<IllustrationNoContentDark style={imageStyle} />} description="暂无内容，请添加" style={emptyStyle} />
            <Empty image={<IllustrationNotFound style={imageStyle} />} darkModeImage={<IllustrationNotFoundDark style={imageStyle} />} description="页面404" style={emptyStyle} />
            <Empty image={<IllustrationNoResult style={imageStyle} />} darkModeImage={<IllustrationNoResultDark style={imageStyle} />} description="搜索无结果" style={emptyStyle} />
            <Empty image={<IllustrationConstruction style={imageStyle} />} darkModeImage={<IllustrationConstructionDark style={imageStyle} />} description="建设中" style={emptyStyle} />
            <Empty image={<IllustrationIdle style={imageStyle} />} darkModeImage={<IllustrationIdleDark style={imageStyle} />} description="神游四方" style={emptyStyle} />
        </div>
    );
}
