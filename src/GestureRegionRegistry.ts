import React, {createContext} from 'react';

enum NodeColourEnum {
    red,
    black
}
type NodeColour = keyof typeof NodeColourEnum;

class RectTreeNode {
    private _rect: DOMRect;
    private _left: RectTreeNode | null = null;
    private _right: RectTreeNode | null = null;
    private _parent: RectTreeNode | null = null;
    private _colour: NodeColour;

    constructor(_rect: DOMRect) {
        this._rect = _rect;
        this._colour = 'red';
    }

    hasRedChild() {
        if (this.left?.colour === 'red' || this.right?._colour === 'red') return true;
        return false;
    }

    isOnLeft() {
        if (this.parent) {
            if (this.parent.left === this) return true;
        }
        return false;
    }

    insert(node: RectTreeNode) {
        if (node.rect.x > this.rect.x && node.rect.y > this.rect.y) {
            if (node.rect.width > this.rect.width && node.rect.height > this.rect.height) {
                if (this.right) this.right.insert(node);
                else {
                    this.right = node;
                    node.parent = this;
                }
            }
        }
        if (this.left) this.left.insert(node);
        else {
            this.left = node;
            node.parent = this;
        }
    }

    gt(node: RectTreeNode): boolean;
    gt(rect: DOMRect): boolean;
    gt(node: RectTreeNode | DOMRect): boolean {
        const rect = node instanceof DOMRect ? node : node.rect;
        if (this.rect.x > rect.x && this.rect.y > rect.y) {
            if (this.rect.width > rect.width && this.rect.height > rect.height) {
                return true;
            }
            return false;
        }
        return false;
    }

    lt(node: RectTreeNode): boolean;
    lt(rect: DOMRect): boolean;
    lt(node: RectTreeNode | DOMRect): boolean {
        const rect = node instanceof DOMRect ? node : node.rect;
        if (this.rect.x < rect.x && this.rect.y < rect.y) {
            if (this.rect.width < rect.width && this.rect.height < rect.height) {
                return true;
            }
            return false;
        }
        return false;
    }

    eq(node: RectTreeNode): boolean;
    eq(rect: DOMRect): boolean;
    eq(node: RectTreeNode | DOMRect): boolean {
        const rect = node instanceof DOMRect ? node : node.rect;
        const a = this.rect.toJSON();
        const b = rect.toJSON();

        for (let key of Object.keys(a)) {
            if (b[key] === a[key]) {
                continue;
            } else {
                return false;
            }
        }

        return true;
    }

    set parent(_parent: RectTreeNode | null) {
        this._parent = _parent;
    }

    set rect(_rect: DOMRect) {
        this._rect = _rect;
    }

    get parent() {
        return this._parent;
    }

    get sibling(): RectTreeNode | null {
        if (this.parent === null) {
            return null;
        }

        if (this === this.parent.left) {
            return this.parent.right;
        } else {
            return this.parent.left;
        }
    }

    get left() {
        return this._left;
    }

    get right() {
        return this._right;
    }

    set left(_left: RectTreeNode | null) {
        this._left = _left;
    }

    set right(_right: RectTreeNode | null) {
        this._right = _right;
    }

    get rect() {
        return this._rect;
    }

    get colour() {
        return this._colour;
    }

    set colour(_colour: NodeColour) {
        this._colour = _colour;
    }
}

// reference https://gist.github.com/VictorGarritano/5f894be162d39e9bdd5c
class RectTree {
    private _root: RectTreeNode | null = null;

    private rotateLeft(node: RectTreeNode) {
        let y = node.right;

        node.right = y?.left || null;

        if (node.right !== null) node.right.parent = node;

        if (y) y.parent = node.parent;

        if (node.parent === null) this._root = y;
        else if (node === node.parent.left) node.parent.left = y;
        else node.parent.right = y;

        if(y) y.left = node;

        node.parent = y;
    }

    private rotateRight(node: RectTreeNode) {
        let x = node.left;
        if (x && node.parent) {
            node.left = x.right;
            if (x.right !== null) x.right.parent = node;

            x.parent = node.parent;
            if (x.parent === null) this._root = x;
            else if (node === node.parent.left) node.parent.left = x;
            else node.parent.right = x;

            x.right = node;
        }
        
        node.parent = x;
    }
    
    private fixViolation(node: RectTreeNode) {
        while (node != this.root && node != this.root!.left && node != this.root!.right && node.parent?.colour === 'red') {
            let y: RectTreeNode | null = null;

            if (node.parent.parent) {
                if (node.parent === node.parent.parent.left) {
                    y = node.parent.parent.right;
                } else {
                    y = node.parent.parent.left;
                }
            }

            if (y?.colour === 'red') {
                y.colour = 'black';
                node.parent.colour = 'black';
                if (node.parent.parent) {
                    node.parent.parent.colour = 'red';
                    node = node.parent.parent;
                }
            } else {
                if (node.parent === node.parent.parent?.left && node === node.parent.left) {
                    const colour = node.parent.colour;
                    node.parent.colour = node.parent.parent.colour;
                    node.parent.parent.colour = colour;
                    this.rotateRight(node.parent.parent);
                }

                if (node.parent === node.parent.parent?.left && node === node.parent.right) {
                    const colour = node.colour;
                    node.colour = node.parent.parent.colour;
                    node.parent.parent.colour = colour;
                    this.rotateLeft(node.parent);
                    this.rotateRight(node.parent.parent);
                }

                if (node.parent === node.parent.parent?.right && node === node.parent.right) {
                    const colour = node.parent.colour;
                    node.parent.colour = node.parent.parent.colour;
                    node.parent.parent.colour = colour;
                    this.rotateLeft(node.parent.parent);
                }

                if (node.parent === node.parent.right && node === node.parent.left) {
                    const colour = node.colour;
                    if (node.parent.parent) {
                        node.colour = node.parent.parent.colour;
                        node.parent.parent.colour = colour;
                    }
                    this.rotateRight(node.parent);
                    if(node.parent.parent) this.rotateLeft(node.parent.parent);
                }
            }
        }

        if (this._root) this._root.colour = 'black';
    }

    insert(rect: DOMRect) {
        const z = new RectTreeNode(rect);
        if (this.root === null) {
            z.colour = 'black';
            this._root = z;
        } else {
            this.root.insert(z);

            z.colour = 'red';

            this.fixViolation(z);
        }
    }
 
    inorder(node?: RectTreeNode | null) {
        if (this.root === null) return;
        if (node === undefined) node = this.root;
        if (node === null) return;

        this.inorder(node.left);
        console.log(node.rect);
        this.inorder(node.right);
    }

    levelOrder(node?: RectTreeNode | null) {
        if (this.root === null) return;
        if (node === undefined) node = this.root;
        if (node === null) return;

        const nodeQueue: RectTreeNode[] = [];
        nodeQueue.push(node);
        while (!nodeQueue.length) {
            let temp = nodeQueue[nodeQueue.length - 1];
            console.log(temp.rect);
            nodeQueue.pop();

            if (temp.left !== null) nodeQueue.push(temp.left);
            if (temp.right !== null) nodeQueue.push(temp.right);
        }
    }

    findIntersection(x: number, y: number, node?: RectTreeNode | null): boolean {
        if (this.root === null) return false;
        if (node === undefined) node = this.root;
        if (node === null) return false;

        if (x > node.rect.x && y > node.rect.y) {
            if (x > node.rect.x + node.rect.width && y > node.rect.y + node.rect.height) {
                return this.findIntersection(x, y, node.right);
            } else {
                return true;
            }
        } else {
            return this.findIntersection(x, y, node.left);
        }
    }

    find(rect: DOMRect) {
        let temp = this.root;
        while (temp !== null) {
            if (temp.gt(rect)) {
                if (temp.left === null) {
                    break;
                } else {
                    temp = temp.left;
                }
            } else if (temp.eq(rect)) break;
            else {
                if (temp.right === null) break;
                else temp = temp.right;
            }

        }
        return temp;
    }

    successor(x: RectTreeNode) {
        let temp = x;
        while (temp.left !== null) {
            temp = temp.left;
        }

        return temp;
    }

    BSTreplace(x: RectTreeNode) {
        if (x.left !== null && x.right !== null) {
            return this.successor(x.right);
        }

        if (x.left === null && x.right === null) {
            return null;
        }

        if (x.left !== null) {
            return x.left
        } else {
            return x.right;
        }
    }

    fixDoubleBlack(x: RectTreeNode) {
        if (x === this.root) return;

        let sibling = x.sibling;
        let parent = x.parent;

        if (sibling === null) {
            if (parent) this.fixDoubleBlack(parent);
        } else {
            if (sibling.colour === 'red') {
                if (parent) {
                    parent.colour = 'red';
                    sibling.colour = 'black';
                    if (sibling.isOnLeft()) {
                        this.rotateRight(parent);
                    } else {
                        this.rotateLeft(parent);
                    }
                    this.fixDoubleBlack(x);
                }
            } else {
                if (parent) {
                    if (sibling.hasRedChild()) {
                        if (sibling.left !== null && sibling.left.colour === 'red') {
                            if (sibling.isOnLeft()) {
                                sibling.left.colour = sibling.colour;
                                sibling.colour = parent.colour;
                                this.rotateRight(parent);
                            } else {
                                sibling.left.colour = parent.colour;
                                this.rotateRight(sibling);
                                this.rotateLeft(parent);
                            }
                        } else {
                            if (sibling.isOnLeft()) {
                                sibling.right!.colour = parent.colour;
                                this.rotateLeft(sibling);
                                this.rotateRight(parent);
                            } else {
                                sibling.right!.colour = sibling.colour;
                                sibling.colour = parent.colour;
                                this.rotateLeft(parent);
                            }
                        }
                        parent.colour = 'black';
                    } else {
                        sibling.colour = 'red';
                        if (parent.colour === 'black') {
                            this.fixDoubleBlack(parent);
                        } else {
                            parent.colour = 'black';
                        }
                    }
                }
            }
        }
        
    }

    deleteNode(v: RectTreeNode) {
        let u = this.BSTreplace(v);

        const uvBlack = ((u === null || u.colour === "black") && (v.colour === 'black'));
        let parent = v.parent;

        if (u === null) {
            if (v === this.root) {
                this._root = null;
            } else {
                if (uvBlack) {
                    this.fixDoubleBlack(v);
                } else {
                    if (v.sibling !== null) {
                        v.sibling.colour = 'red';
                    }
                }
                
                if (v.isOnLeft()) {
                    parent!.left = null;
                } else {
                    parent!.right = null;
                }
            }
            return;
        } else {
            if (v.left === null || v.right === null) {
                if (v === this.root) {
                    v.rect = u.rect;
                    v.left = v.right = null;
                } else {
                    if (v.isOnLeft()) {
                        parent!.left = u;
                    } else {
                        parent!.right = u;
                    }
                    u.parent = parent;
                    if (uvBlack) {
                        this.fixDoubleBlack(u);
                    } else {
                        u.colour = 'black';
                    }
                }
                return;
            }
    
            [u.rect, v.rect] = [v.rect, u.rect]; // swap
            this.deleteNode(u);
        }
    }

    delete(rect: DOMRect) {
        if (this.root == null) return;

        const v = this.find(rect);

        if (v) {
            this.deleteNode(v);
        }
    }

    get root() {
        return this._root;
    }
}

export class GestureRegionRegistry {
    private registry = new RectTree();

    removeRegion(_rect: DOMRect) {
        this.registry.delete(_rect);
    }

    addRegion(_rect: DOMRect) {
        this.registry.insert(_rect);
    }

    isIntersecting(x: number, y: number) {
        return this.registry.findIntersection(x, y);
    }
}

const GestureRegionRegistryContext = createContext(new GestureRegionRegistry());
export default GestureRegionRegistryContext;