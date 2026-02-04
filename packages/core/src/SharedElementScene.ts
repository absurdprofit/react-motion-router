export class SharedElementScene {
  public readonly id: string;
  public readonly nodes = new Map<string, Element>();
  public getScreenRect: () => DOMRect = () => new DOMRect();
  public keepAlive: boolean = false;
  public previousScene: SharedElementScene | null = null;
  public canTransition: boolean = true; // should be false if page animation already started

  constructor(id: string) {
    this.id = id;
  }

  public addElement(node: Element | null) {
    if (!node) return;
    console.assert(
      !this.nodes.has(node.id),
      `Duplicate Shared Element ID: ${node.id} in ${this.id}`
    );
    this.nodes.set(node.id, node);
  }

  public removeElement(id: string) {
    this.nodes.delete(id);
  }

  public isEmpty() {
    return !this.nodes.size;
  }
}