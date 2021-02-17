import './imports/bootstrap';
import './filelist.scss';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { Editor } from './imports/Editor';

const BpmnFileMenuPlugin = {
	attach: function (menu) {
		menu.addMenuEntry({
			id: 'bpmn',
			displayName: t('files_bpmn', 'BPMN diagram'),
			templateName: 'diagram.bpmn',
			iconClass: 'icon-filetype-bpmn',
			fileType: 'file',
			actionHandler(fileName: string) {
				const fileList = menu.fileList;
				const editor = new Editor({
					name: fileName,
					path: fileList.getCurrentDirectory(),
					permissions: OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE,
				}, fileList);

				editor.start();
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
		if (this.ignoreLists.includes(fileList.id)) {
			return;
		}

		fileList.fileActions.registerAction({
			name: 'bpmn',
			displayName: t('files_bpmn', 'BPMN diagram'),
			mime: 'application/x-bpmn',
			icon: OC.imagePath('files_bpmn', 'app-dark.svg'),
			permissions: OC.PERMISSION_READ,
			actionHandler(fileName: string, context) {
				const file = context.fileList.elementToFile(context.$file);

				const editor = new Editor(file, fileList);
				editor.start();
			},
		});

		fileList.fileActions.setDefault('application/x-bpmn', 'bpmn');
	},
};

OC.Plugins.register('OCA.Files.FileList', BpmnFileListPlugin);
