import { SharedElementNode, SharedElementNodeMap, Vec2 } from "./common/types";

export class SharedElementScene {
	public readonly id: string;
	public readonly nodes: SharedElementNodeMap = new Map<string, SharedElementNode>();
	public scrollPos: Vec2 | null = {
		x: 0,
		y: 0
	};
	public getScreenRect: () => DOMRect = () => new DOMRect();
	public keepAlive: boolean = false;
	public previousScene: SharedElementScene | null = null;
	public canTransition: boolean = true; // should be false if page animation already started

	constructor(id: string) {
		this.id = id;
	}

	addNode(node: SharedElementNode | null) {
		if (!node) return;
		console.assert(!this.nodes.has(node.id), `Duplicate Shared Element ID: ${node.id} in ${this.id}`);
		this.nodes.set(node.id, node);
	}

	removeNode(_id: string) {
		this.nodes.delete(_id);
	}

	get xRatio() {
		const screenRect = this.getScreenRect();
		const xRatio = (screenRect.width / window.innerWidth).toFixed(2);
		return parseFloat(xRatio);
	}

	get yRatio() {
		const screenRect = this.getScreenRect();
		const yRatio = (screenRect.height / window.innerHeight).toFixed(2);
		return parseFloat(yRatio);
	}

	get x() {
		return this.getScreenRect().x;
	}

	get y() {
		return this.getScreenRect().y;
	}

	isEmpty() {
		return !Boolean(this.nodes.size);
	}
}