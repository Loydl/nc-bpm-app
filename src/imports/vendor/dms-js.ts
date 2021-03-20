import Modeler from 'dmn-js/lib/Modeler';
import Viewer from 'dmn-js/lib/Viewer';

abstract class BaseModeler {
	protected modeler;

	public importXML(xml: string): Promise<void> {
		return new Promise(resolve => {
			this.modeler.importXML(xml, (err) => {
				if (err) {
					throw new Error(err);
				}

				this.modeler
					.getActiveViewer()
					.get('canvas')
					.zoom('fit-viewport');

				resolve();
			});
		});
	}

	public saveXML(): Promise<string> {
		return new Promise(resolve => {
			this.modeler.saveXML((err, xml) => {
				if (err) {
					throw new Error(err);
				}

				resolve(xml);
			});
		});
	}

	public saveSVG(): Promise<{svg: string}> {
		return new Promise(resolve => {
			this.modeler.saveSVG((err, svg) => {
				if (err) {
					throw new Error(err);
				}

				resolve({svg});
			});
		});
	}

	public destroy(): void {
		this.modeler.destroy();
	}

	public resized(): void {
		this.modeler.getActiveViewer().get('canvas').resized();
	}

	public on(event: string, callback: any) {
		this.modeler.on(event, callback);
	}

	public getActiveViewer() {
		return this.modeler.getActiveViewer();
	}
}

export class DMSModeler extends BaseModeler {
	constructor(options: {
		container: string | JQuery<HTMLElement>,
		common?: { keyboard?: { bindTo: Window }},
		drd?: {
			propertiesPanel: {
				parent: string | JQuery<HTMLElement>,
			},
			additionalModules: Array<any>
		},
		moddleExtensions?: {
			camunda: any,
		}
	}) {
		super();
		this.modeler = new Modeler(options);
	}
}

export class DMSViewer extends BaseModeler {
	constructor(options: { container: string | JQuery<HTMLElement> }) {
		super();
		this.modeler = new Viewer(options);
	}
}
