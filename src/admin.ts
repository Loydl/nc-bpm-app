import { translate as t } from '@nextcloud/l10n';
import confirmPassword from '@nextcloud/password-confirmation';
import './admin.scss';
import api from './imports/api';

$(() => {
	function generateWarningElement(message: string) {
		return $(`<div id="bpm-warning"><span class="icon icon-error-color icon-visible"></span> ${message}</div>`);
	}

	function generateSuccessElement(message: string) {
		return $(`<div id="bpm-success"><span class="icon icon-checkmark icon-visible"></span> ${message}</div>`);
	}

	async function checkServer(url: string) {
		const result = await api.checkPreviewServer(url);

		if (result === 'success') {
			return;
		}

		throw result;
	}

	async function saveSettings(url: string) {
		url += url.endsWith('/') ? '' : '/';

		await checkServer(url);
		await confirmPassword();

		OCP.AppConfig.setValue('files_bpm', 'preview.server', url);
	}

	$('#bpm-preview').on('submit', function (ev) {
		ev.preventDefault();

		const resultElement = $(this).find('.bpm-result').empty();

		saveSettings(this['preview.server'].value).then(() => {
			const successElement = generateSuccessElement(t('files_bpm', 'Settings saved'));

			setTimeout(() => {
				resultElement.empty();
			}, 3000);

			resultElement.append(successElement);
		}).catch(err => {
			console.log('err', err);
			let message = t('files_bpm', 'Unexpected error occurred');

			if (err === 'invalid-url') {
				message = t('files_bpm', 'URL is invalid');
			}

			const warningElement = generateWarningElement(message);

			resultElement.append(warningElement);
		});
	});
});
