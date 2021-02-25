import { translate as t } from '@nextcloud/l10n';
import Modeler from 'bpmn-js/lib/Modeler';
import Viewer from 'bpmn-js/lib/Viewer';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import api from './api';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css';
import './Editor.scss';

declare type Modeler = {
	destroy(): void,
	on(event: string, callback: (...any) => void): void
	importXML(xml: string): Promise<{ warnings: string[] }>
	saveXML(options?: { format?: boolean, preamble?: boolean }): Promise<{ xml: string }>
	saveSVG(): Promise<{ svg: string }>
	get(serviceName: string, strict?: boolean): any
}

type NextcloudFile = {
	id?: number
	name: string
	path: string
	size?: number
	etag?: string
	permissions: number
}

type NextcloudFileList = {
	setViewerMode: (enabled: boolean) => void
	showMask: () => void
	hideMask: () => void
	reload: () => Promise<void>
	getDirectoryPermissions: () => number
	findFile: (fileName: string) => NextcloudFile | null
	shown?: boolean
}

const PLAIN_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
const STATUS_CREATED = 201;
const STATUS_PRECONDITION_FAILED = 412;
const CONTENT_ID = 'bpmn-app';

export default class Editor {
	private originalUrl: URL;

	private originalEtag: string;

	private modeler: Modeler;

	private containerElement: JQuery;

	private hasUnsavedChanges = false;

	private resizeTimeout: number;

	constructor(private file: NextcloudFile, private fileList: NextcloudFileList) {
		this.originalUrl = new URL(window.location.toString());
		this.originalEtag = file.etag || '';
		this.hasUnsavedChanges = !file.etag;

		window.addEventListener('beforeunload', this.onBeforeUnload);
	}

	public async start(): Promise<void> {
		this.addEditStateToHistory();
		this.cleanFileList();

		const content = this.file.etag ? await api.getFileContent(this.file.path, this.file.name) : PLAIN_TEMPLATE;

		await this.runEditor(content);
	}

	private addEditStateToHistory() {
		const url = new URL(this.originalUrl.toString());
		url.searchParams.set('openfile', this.file.id?.toString() || 'new');
		url.searchParams.delete('fileid');

		OC.Util.History.pushState(url.searchParams.toString());
	}

	private resetHistoryState() {
		const url = new URL(this.originalUrl.toString());

		if (url.searchParams.get('openfile') && this.file.id) {
			url.searchParams.set('fileid', this.file.id.toString());
			url.searchParams.delete('openfile');
		}

		OC.Util.History.pushState(url.searchParams.toString());
	}

	private updateHistoryState() {
		const url = new URL(this.originalUrl.toString());
		url.searchParams.set('openfile', this.file.id?.toString() || 'new');
		url.searchParams.delete('fileid');

		OC.Util.History.replaceState(url.searchParams.toString());
	}

	private cleanFileList() {
		OCA.Files.Sidebar?.close();
		this.fileList.setViewerMode(true);
		this.fileList.showMask();
	}

	private restoreFileList() {
		this.fileList.setViewerMode(false);
		this.fileList.hideMask();
	}

	private getModeler() {
		if (!this.modeler) {
			const containerElement = this.getAppContainerElement();
			const canvasElement = containerElement.find('.bpmn-canvas');
			const propertiesElement = containerElement.find('.bpmn-properties');

			this.modeler = this.isFileUpdatable() ? new Modeler({
				container: canvasElement,
				additionalModules: [
					propertiesPanelModule,
					propertiesProviderModule,
				],
				propertiesPanel: {
					parent: propertiesElement,
				},
			}) : new Viewer({
				container: canvasElement,
			});

			this.modeler.on('element.changed', () => {
				if (!this.hasUnsavedChanges) {
					this.hasUnsavedChanges = true;

					containerElement.attr('data-state', 'unsaved');
				}
			});
		}

		return this.modeler;
	}

	private getAppContainerElement() {
		if (!this.containerElement || this.containerElement.length === 0) {
			this.containerElement = $('<div>');
			this.containerElement.attr('id', CONTENT_ID);
			this.containerElement.addClass('icon-loading');
			this.containerElement.attr('data-state', this.hasUnsavedChanges ? 'unsaved' : 'saved');

			const paletteElement = $('<div>');
			paletteElement.addClass('bpmn-palette bpmn-filename');
			paletteElement.attr('data-filename', this.file.name);
			paletteElement.appendTo(this.containerElement);

			if (this.isFileUpdatable()) {
				$('<div>')
					.addClass('entry icon-download bpmn-save')
					.attr('role', 'button')
					.on('click', this.clickCallbackFactory(this.onSave))
					.appendTo(paletteElement);

			}

			if (this.isRealFileList()) {
				$('<div>')
					.addClass('entry icon-close bpmn-close')
					.attr('role', 'button')
					.on('click', this.clickCallbackFactory(this.onClose))
					.appendTo(paletteElement);
			}

			const canvasElement = $('<div>');
			canvasElement.addClass('bpmn-canvas');
			canvasElement.appendTo(this.containerElement);

			if(this.isFileUpdatable()) {
				const propertiesElement = $('<div>');
				propertiesElement.addClass('bpmn-properties');
				propertiesElement.appendTo(this.containerElement);
			}

			$('#content').append(this.containerElement);
		}


		return this.containerElement;
	}

	private async runEditor(bpmnXML: string) {
		const modeler = this.getModeler();

		if (bpmnXML) {
			try {
				await modeler.importXML(bpmnXML);
			} catch (err) {
				const text = t('files_bpmn', 'Error while loading diagram: ') + err.toString();
				const title = t('files_bpmn', 'Could not load diagram');

				OC.dialogs.alert(text, title, () => undefined);
			}
		}

		$(window).on('resize', () => {
			if (this.resizeTimeout) {
				window.clearTimeout(this.resizeTimeout);
			}

			this.resizeTimeout = window.setTimeout(() => modeler.get('canvas').resized(), 500);
		});

		this.containerElement.removeClass('icon-loading');

		$('body').css('overflow', 'hidden');
	}

	private async onClose() {
		if (this.hasUnsavedChanges && !await this.showConfirmClose()) {
			return;
		}

		if (this.originalEtag !== this.file.etag) {
			await this.fileList.reload();
		}

		if (this.modeler) {
			this.modeler.destroy();
		}

		if (this.containerElement && this.containerElement.length > 0) {
			this.containerElement.remove();
		}

		this.restoreFileList();
		this.resetHistoryState();

		window.removeEventListener('beforeunload', this.onBeforeUnload);

		$('body').css('overflow', '');
	}

	private async onSave() {
		const modeler = this.getModeler();
		const data = await modeler.saveXML();

		const result = await api.uploadFile(this.file.path, this.file.name, data.xml, this.file.etag);

		if (result.statuscode >= 200 && result.statuscode <= 299) {
			if (result.statuscode === STATUS_CREATED) {
				this.updateFile();
			}

			this.file.etag = result.header.etag;

			this.hasUnsavedChanges = false;
			this.getAppContainerElement().attr('data-state', 'saved');

			return;
		}

		if (result.statuscode === STATUS_PRECONDITION_FAILED) {
			await this.onFileHasChanged(result.header.etag);

			return;
		}

		throw new Error(`Unexpected status code (${result.statuscode}) while uploading file`);
	}

	private async onFileHasChanged(serverEtag: string) {
		const title = t('files_bpmn', 'File has changed');
		const description = t('files_bpmn', 'The file was modified while editing. Do you want to overwrite it, or should your changes be saved with a new filename?');
		const buttons = {
			type: OC.dialogs.YES_NO_BUTTONS,
			confirm: t('files_bpmn', 'Overwrite'),
			cancel: t('files_bpmn', 'As new file'),
		};

		return new Promise(resolve => {
			OC.dialogs.confirmDestructive(description, title, buttons, (overwrite) => {
				if (overwrite) {
					this.file.etag = serverEtag;
				} else {
					this.file.name = this.generateNewFileName();
					this.file.etag = '';

					this.getAppContainerElement().find('.bpmn-filename').attr('data-filename', this.file.name);
				}

				resolve(this.onSave());
			}, true);
		});
	}

	private async showConfirmClose(): Promise<boolean> {
		return new Promise(resolve => {
			const title = t('files_bpmn', 'Discard changes?');
			const description = t('files_bpmn', 'You have unsaved changes. Do you really want to close the editor? All your changes will be lost.');
			const buttons = {
				type: OC.dialogs.YES_NO_BUTTONS,
				confirm: t('files_bpmn', 'Close editor'),
				cancel: t('files_bpmn', 'Abort'),
			};

			OC.dialogs.confirmDestructive(description, title, buttons, resolve, true);
		});
	}

	private clickCallbackFactory = (handler: () => Promise<void>, className?: string) => {
		return (ev: JQuery.ClickEvent<HTMLElement>) => {
			ev.preventDefault();

			const targetElement = $(ev.target);

			if (targetElement.hasClass('icon-loading')) {
				return;
			}

			className && targetElement.removeClass(className);
			targetElement.addClass('icon-loading');

			handler.call(this).then(() => {
				targetElement.addClass('icon-checkmark');

				setTimeout(() => {
					targetElement.removeClass('icon-checkmark');

					className && targetElement.removeClass(className);
				}, 3000);
			}).catch((error) => {
				OC.dialogs.alert(
					error.toString(),
					t('files_bpmn', 'Error'),
					() => undefined
				);

				targetElement.addClass('icon-error');

				setTimeout(() => {
					targetElement.removeClass('icon-error');

					className && targetElement.removeClass(className);
				}, 3000);
			}).then(() => {
				targetElement.removeClass('icon-loading');
			});
		};
	}

	private onBeforeUnload = (ev: BeforeUnloadEvent) => {
		if (this.hasUnsavedChanges) {
			const message = t('files_bpmn', 'If you leave this page, all your modifications will be lost.');

			ev.preventDefault();
			ev.returnValue = message;

			return message;
		}

		return null;
	}

	private updateFile(): void {
		this.fileList.reload().then(() => {
			const newFile = this.fileList.findFile(this.file.name);

			if (newFile && newFile.id !== this.file.id) {
				this.file = newFile;
				this.originalEtag = newFile.etag as string;

				this.updateHistoryState();
			}
		});
	}

	private generateNewFileName(): string {
		const nameParts = this.file.name.split('.');
		const tail = nameParts[nameParts.length - 2];

		nameParts[nameParts.length - 2] = tail.replace(/_\d{13}$/, '') + '_' + (new Date()).getTime().toString();

		return nameParts.join('.');
	}

	private isFileUpdatable() {
		return (this.file.permissions & OC.PERMISSION_UPDATE) !== 0;
	}

	private isDirectoryWritable() {
		return (this.fileList.getDirectoryPermissions() & OC.PERMISSION_CREATE) !== 0;
	}

	private isRealFileList() {
		return typeof this.fileList.shown === 'boolean';
	}

}
