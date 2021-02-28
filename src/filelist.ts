import { translate as t } from '@nextcloud/l10n';
import { loadState } from '@nextcloud/initial-state';
import './imports/bootstrap';
import './filelist.scss';

function bootstrapFileShare() {
	if (!OCA?.Sharing?.PublicApp) {
		return;
	}

	const state = loadState<{ permissions: number, nodeType: string }>('files_bpm', 'share');

	if ($('#mimetype').val() === 'application/x-bpmn' && state?.nodeType === 'file') {
		const filename = $('#filename').val();
		const file = {
			name: filename,
			path: '/',
			permissions: state.permissions,
		};

		const fileList = {
			setViewerMode: () => undefined,
			showMask: () => undefined,
			hideMask: () => undefined,
			reload: () => Promise.resolve(),
			getDirectoryPermissions: () => 0,
			findFile: () => file,
		};

		startEditor(file, fileList);
	}
}

function fixFileIconForFileShare() {
	if (!$('#dir').val() && $('#mimetype').val() === 'application/x-bpmn') {
		$('#mimetypeIcon').val(OC.imagePath('files_bpm', 'icon-filetypes_bpmn.svg'));
	}
}

function registerFileIcon() {
	if (OC?.MimeType?._mimeTypeIcons) {
		OC.MimeType._mimeTypeIcons['application/x-bpmn'] = OC.imagePath('files_bpm', 'icon-filetypes_bpmn.svg');
	}
}

function startEditor(file, fileList) {
	import(/* webpackChunkName: "editor" */ './imports/Editor').then(({ default: Editor }) => {
		const editor = new Editor(file, fileList);
		editor.start();
	});
}

const BpmnFileMenuPlugin = {
	attach: function (menu) {
		menu.addMenuEntry({
			id: 'bpmn',
			displayName: t('files_bpm', 'BPMN diagram'),
			templateName: 'diagram.bpmn',
			iconClass: 'icon-filetype-bpmn',
			fileType: 'file',
			actionHandler(fileName: string) {
				const fileList = menu.fileList;
				const file = {
					name: fileName,
					path: fileList.getCurrentDirectory(),
					permissions: OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE,
				};

				startEditor(file, fileList);
			},
		});
	},
};

OC.Plugins.register('OCA.Files.NewFileMenu', BpmnFileMenuPlugin);

const BpmnFileListPlugin = {
	ignoreLists: [
		'trashbin',
	],

	attach(fileList) {
		registerFileIcon();

		if (this.ignoreLists.includes(fileList.id)) {
			return;
		}

		fileList.fileActions.registerAction({
			name: 'bpmn',
			displayName: t('files_bpm', 'BPMN diagram'),
			mime: 'application/x-bpmn',
			icon: OC.imagePath('files_bpm', 'app-dark.svg'),
			permissions: OC.PERMISSION_READ,
			actionHandler(fileName: string, context) {
				const file = context.fileList.elementToFile(context.$file);

				startEditor(file, context.fileList);
			},
		});

		fileList.fileActions.setDefault('application/x-bpmn', 'bpmn');
	},
};

OC.Plugins.register('OCA.Files.FileList', BpmnFileListPlugin);

fixFileIconForFileShare();
bootstrapFileShare();
