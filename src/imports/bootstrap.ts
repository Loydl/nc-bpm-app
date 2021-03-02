import { generateFilePath } from '@nextcloud/router';
import { getRequestToken } from '@nextcloud/auth';

// eslint-disable-next-line camelcase
__webpack_nonce__ = btoa(getRequestToken() as string);
// eslint-disable-next-line camelcase
__webpack_public_path__ = generateFilePath('files_bpm', '', 'js/');
