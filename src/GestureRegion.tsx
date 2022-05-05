import React, { startTransition } from 'react';
import GestureRegionRegistryContext from './GestureRegionRegistry';

interface GestureRegionProps {
    children: React.ReactChild;
}

export default class GestureRegion extends React.Component<GestureRegionProps> {
    private _ref: HTMLElement | null = null;
    private _rect: DOMRect = new DOMRect();
    private observer = new ResizeObserver(this.update.bind(this));
    static contextType = GestureRegionRegistryContext;
    context!: React.ContextType<typeof GestureRegionRegistryContext>;

    constructor(props: GestureRegionProps) {
        super(props);
        this.onRef = this.onRef.bind(this);
    }


    componentDidMount() {
        window.addEventListener('page-animation-end', () => {
            this.update();
        }, {once: true});
    }

    update() {
        startTransition(() => {
            this.context.removeRegion(this._rect);
            if (this._ref) {
                this._rect = this._ref.getBoundingClientRect();
                this.context.addRegion(this._rect);
            }
        });
    }

    onRef(ref: HTMLElement | null) {
        if (this._ref) {
            this.observer.unobserve(this._ref);
        }
        this._ref = ref;
        if (ref) {
            this.observer.observe(ref);
        }
    }

    componentWillUnmount() {
        this.context.removeRegion(this._rect);
    }

    render() {
        return (
            <div ref={this.onRef} className="gesture-region">{this.props.children}</div>
        );
    }
}