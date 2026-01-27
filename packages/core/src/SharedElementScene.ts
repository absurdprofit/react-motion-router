import { SharedElement } from './SharedElement';

export class SharedElementScene {
  public readonly id: string;
  public readonly nodes = new Map<string, SharedElement>();
  public getScreenRect: () => DOMRect = () => new DOMRect();
  public keepAlive: boolean = false;
  public previousScene: SharedElementScene | null = null;
  public canTransition: boolean = true; // should be false if page animation already started

  constructor(id: string) {
    this.id = id;
  }

  public addNode(node: SharedElement | null) {
    if (!node) return;
    console.assert(!this.nodes.has(node.id), `Duplicate Shared Element ID: ${node.id} in ${this.id}`);
    this.nodes.set(node.id, node);
  }

  public removeNode(_id: string) {
    this.nodes.delete(_id);
  }

  public get xRatio() {
    const screenRect = this.getScreenRect();
    const xRatio = (screenRect.width / window.innerWidth).toFixed(2);
    return parseFloat(xRatio);
  }

  public get yRatio() {
    const screenRect = this.getScreenRect();
    const yRatio = (screenRect.height / window.innerHeight).toFixed(2);
    return parseFloat(yRatio);
  }

  public get x() {
    return this.getScreenRect().x;
  }

  public get y() {
    return this.getScreenRect().y;
  }

  public isEmpty() {
    return !this.nodes.size;
  }
}