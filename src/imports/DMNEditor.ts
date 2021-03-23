import api from './api';
import Editor from './Editor';
import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css';
import 'dmn-js/dist/assets/dmn-js-shared.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn.css';
import 'dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css';
import { DMSModeler, DMSViewer } from './vendor/dms-js';
import propertiesPanelModule from 'dmn-js-properties-panel';
import drdAdapterModule from 'dmn-js-properties-panel/lib/adapter/drd';
import propertiesProviderModule from 'dmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-dmn-moddle/resources/camunda.json';

const PLAIN_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" id="definitions_0xcty6c" name="definitions" namespace="http://camunda.org/schema/1.0/dmn" exporter="dmn-js (https://demo.bpmn.io/dmn)" exporterVersion="10.1.0">
  <decision id="decision_0k1xeln" name="">
    <decisionTable id="decisionTable_0h35w5w">
      <input id="input1" label="">
        <inputExpression id="inputExpression1" typeRef="string">
          <text></text>
        </inputExpression>
      </input>
      <output id="output1" label="" name="" typeRef="string" />
    </decisionTable>
  </decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_0wcate9">
      <dmndi:DMNShape id="DMNShape_0pi5rd3" dmnElementRef="decision_0k1xeln">
        <dc:Bounds height="80" width="180" x="150" y="80" />
      </dmndi:DMNShape>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`;

export default class DMNEditor extends Editor {
	private modeler: DMSModeler;

	protected getContent(): Promise<string> {
		if (this.modeler) {
			return this.modeler.saveXML();
		}

		if (this.file.etag || OCA.Sharing?.PublicApp) {
			return api.getFileContent(this.file.path, this.file.name);
		}

		return Promise.resolve(PLAIN_TEMPLATE);
	}

	protected async getSVG(): Promise<string> {
		if (this.modeler) {
			return (await this.modeler.saveSVG()).svg;
		}

		throw new Error('Modeler not loaded');
	}

	protected async destroy(): Promise<void> {
		this.modeler && this.modeler.destroy();

		this.removeResizeListener(this.onResize);
	}

	protected async runEditor(): Promise<void> {
		const bpmnXML = await this.getContent();
		const modeler = this.getModeler();

		try {
			await modeler.importXML(bpmnXML);

			this.addResizeListener(this.onResize);
			this.attachChangeListener();
		} catch (err) {
			this.showLoadingError(err.toString());
		}
	}

	private onResize = () => {
		this.modeler && this.modeler.resized();
	}

	private getModeler() {
		if (!this.modeler) {
			const containerElement = this.getAppContainerElement();
			const canvasElement = containerElement.find('.bpmn-canvas');
			const propertiesElement = containerElement.find('.bpmn-properties');

			this.modeler = this.isFileUpdatable() ? new DMSModeler({
				container: canvasElement,
				common: {
					keyboard: {
						bindTo: window,
					},
				},
				drd: {
					propertiesPanel: {
						parent: propertiesElement,
					},
					additionalModules: [
						propertiesPanelModule,
						propertiesProviderModule,
						drdAdapterModule,
					],
				},
				moddleExtensions: {
					camunda: camundaModdleDescriptor,
				},
			}) : new DMSViewer({
				container: canvasElement,
			});

			this.modeler.on('views.changed', function(...args) {
				console.log('views.changed', args);
			});

			this.modeler.on('viewer.created', function(...args) {
				console.log('viewer.created', args);
			});
		}

		return this.modeler;
	}

	private attachChangeListener() {
		const viewer = this.modeler.getActiveViewer();

		if (!viewer) {
			return;
		}

		const containerElement = this.getAppContainerElement();

		viewer.on('element.changed', () => {
			if (!this.hasUnsavedChanges) {
				this.hasUnsavedChanges = true;

				containerElement.attr('data-state', 'unsaved');
			}
		});
	}

	protected getAppContainerElement(): JQuery {
		const containerElement = super.getAppContainerElement();
		return containerElement;
	}
}
