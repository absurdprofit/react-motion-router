import { MetaKey, MetaType, MetaTypeKey } from "./common/types";

export default class MetaData {
    private _map = new Map<MetaKey, string | undefined>();
    private mutationObserver: MutationObserver;

    constructor() {
        this.mutationObserver = new MutationObserver(this.observeMutations.bind(this));
        const {head} = document;
        this.mutationObserver.observe(head, {
            childList: true
        });

        Array.from(head.querySelectorAll('meta')).forEach(node => {
            this.mutationObserver.observe(node, {
                attributes: true
            });
        });

        Array.from(head.querySelectorAll('meta')).forEach(this.metaDataFromNode.bind(this));
    }

    get(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        return this._map.get(metaKey);
    }

    set(key: string | MetaType, content?: string) {
        const metaKey = this.getMetaKey(key);

        this._map.set(metaKey, content);
        this.updateMetaElement(metaKey, content);
    }

    has(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        return this._map.has(metaKey);
    }

    delete(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        this._map.delete(metaKey);
        document.head.querySelector(`meta[${metaKey}]`)?.remove();
    }

    clear() {
        document.head.querySelectorAll('meta').forEach(node => node.remove());
    }

    entries() {
        return this._map.entries();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    get size() {
        return this._map.size;
    }
    
    private observeMutations(mutations: MutationRecord[]) {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const node = mutation.target;

                this.metaDataFromNode(node as HTMLMetaElement);
            }

            if (mutation.type !== 'childList') return;

            mutation.removedNodes.forEach((node) => {
                if (node.nodeName === 'META') {
                    const [type] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName !== "content");
                    const metaType: MetaType = [type.nodeName as MetaTypeKey, type.value];

                    const key = metaType.join('=') as MetaKey;
                    if (this._map.has(key)) {
                        this._map.delete(key);
                    }
                }
            });
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'META') {
                    this.metaDataFromNode(node as HTMLMetaElement);
                }
            });
        }
    }

    private metaDataFromNode(node: HTMLMetaElement) {
        const [type] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName !== "content");
        const [content] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName === "content");
        const metaType: MetaType = [type.nodeName as MetaTypeKey, type.value];

        const key = metaType.join('=') as MetaKey;
        this._map.set(key, content?.value);
    }

    private getMetaKey(key: string | MetaType) {
        let metaKey: MetaKey;
        if (typeof key === "string") {
            metaKey = `name=${key}` as MetaKey;
        } else {
            metaKey = key.join('=') as MetaKey;
        }

        return metaKey;
    }

    private updateMetaElement(key: MetaKey, content?: string) {
        const meta = document.querySelector(`meta[${key}]`) || document.createElement('meta');
        const metaType = key.split('=') as MetaType;

        meta.setAttribute(...metaType);
        if (content) meta.setAttribute('content', content);
        else meta.removeAttribute('content');

        if (!meta.parentElement) {
            document.head.appendChild(meta);
        }
    }
}