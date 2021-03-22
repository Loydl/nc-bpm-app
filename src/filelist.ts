import { translate as t } from '@nextcloud/l10n';
import { loadState } from '@nextcloud/initial-state';
import './imports/bootstrap';
import './filelist.scss';

function bootstrapFileShare() {
	if (!OCA?.Sharing?.PublicApp) {
		return;
	}

	const state = loadState<{ permissions: number, nodeType: string, nodeId: number }>('files_bpm', 'share');
	const mimetype = $('#mimetype').val() as string;

	if (['application/x-bpmn', 'application/x-dmn'].includes(mimetype) && state?.nodeType === 'file') {
		const filename = $('#filename').val();
		const file = {
			name: filename,
			path: '/',
			permissions: state.permissions,
			id: state.nodeId,
		};

		const fileList = {
			setViewerMode: () => undefined,
			showMask: () => undefined,
			hideMask: () => undefined,
			reload: () => Promise.resolve(),
			getDirectoryPermissions: () => 0,
			findFile: () => file,
		};

		if (mimetype === 'application/x-bpmn') {
			startBPMNEditor(file, fileList);
		} else {
			startDMNEditor(file, fileList);
		}
	}
}

function fixFileIconForFileShare() {
	if (!$('#dir').val() && $('#mimetype').val() === 'application/x-bpmn') {
		$('#mimetypeIcon').val(OC.imagePath('files_bpm', 'icon-filetypes_bpmn.svg'));
	}

	if (!$('#dir').val() && $('#mimetype').val() === 'application/x-dmn') {
		$('#mimetypeIcon').val(OC.imagePath('files_bpm', 'icon-filetypes_dmn.svg'));
	}
}

function registerFileIcon() {
	if (OC?.MimeType?._mimeTypeIcons) {
		OC.MimeType._mimeTypeIcons['application/x-bpmn'] = OC.imagePath('files_bpm', 'icon-filetypes_bpmn.svg');
		OC.MimeType._mimeTypeIcons['application/x-dmn'] = OC.imagePath('files_bpm', 'icon-filetypes_dmn.svg');
	}
}

function startBPMNEditor(file, fileList) {
	import(/* webpackChunkName: "bpmn-editor" */ './imports/BPMNEditor').then(({ default: Editor }) => {
		const editor = new Editor(file, fileList);
		editor.start();
	});
}

function startDMNEditor(file, fileList) {
	import(/* webpackChunkName: "dmn-editor" */ './imports/DMNEditor').then(({ default: Editor }) => {
		const editor = new Editor(file, fileList);
		editor.start();
	});
}

const BpmFileMenuPlugin = {
	attach: function (menu) {
		menu.addMenuEntry({
			id: 'bpmn',
			displayName: t('files_bpm', 'New BPMN diagram'),
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

				startBPMNEditor(file, fileList);
			},
		});

		menu.addMenuEntry({
			id: 'dmn',
			displayName: t('files_bpm', 'New DMN diagram'),
			templateName: 'diagram.dmn',
			iconClass: 'icon-filetype-dmn',
			fileType: 'file',
			actionHandler(fileName: string) {
				const fileList = menu.fileList;
				const file = {
					name: fileName,
					path: fileList.getCurrentDirectory(),
					permissions: OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE,
				};

				startDMNEditor(file, fileList);
			},
		});
	},
};

OC.Plugins.register('OCA.Files.NewFileMenu', BpmFileMenuPlugin);

const BpmFileListPlugin = {
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
			icon: OC.imagePath('files_bpm', 'icon-filetypes_bpmn.svg'),
			permissions: OC.PERMISSION_READ,
			actionHandler(fileName: string, context) {
				const file = context.fileList.elementToFile(context.$file);

				startBPMNEditor(file, context.fileList);
			},
		});

		fileList.fileActions.setDefault('application/x-bpmn', 'bpmn');

		fileList.fileActions.registerAction({
			name: 'dmn',
			displayName: t('files_bpm', 'DMN diagram'),
			mime: 'application/x-dmn',
			icon: OC.imagePath('files_bpm', 'icon-filetypes_dmn.svg'),
			permissions: OC.PERMISSION_READ,
			actionHandler(fileName: string, context) {
				const file = context.fileList.elementToFile(context.$file);

				startDMNEditor(file, context.fileList);
			},
		});

		fileList.fileActions.setDefault('application/x-dmn', 'dmn');
	},
};

OC.Plugins.register('OCA.Files.FileList', BpmFileListPlugin);

fixFileIconForFileShare();
bootstrapFileShare();
