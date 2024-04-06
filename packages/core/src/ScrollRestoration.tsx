import { Component } from "react";
import { Vec2 } from "./common/types";
import { RouterData, RouterDataContext } from "./RouterData";

interface ScrollRestorationProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
    children: JSX.Element;
    hashScrollConfig?: ScrollIntoViewOptions;
    shouldRestore?: boolean;
}

export class ScrollRestoration extends Component<ScrollRestorationProps> {
    private ref: HTMLElement | null = null;
    private scrollPos: Vec2 = { x: 0, y: 0 };
    private routerData: RouterData | null = null;
    private _mounted = false;

    constructor(props: ScrollRestorationProps) {
        super(props);

        this.onHashChange = this.onHashChange.bind(this);
    }
    
    componentDidMount() {
        const scrollPos = this.routerData?.scrollRestorationData.get(this.props.id);
        if (scrollPos) {
            this.scrollPos = scrollPos;
        }
        if (this.ref && this.props.shouldRestore) {
            this.ref.scrollTo({
                left: this.scrollPos.x,
                top: this.scrollPos.y
            });
        }

        this.routerData?.navigation.addEventListener('transition-end', this.onPageAnimationEnd);
        window.addEventListener('hashchange', this.onHashChange);
    }

    componentWillUnmount(): void {
        const scrollPos = {
            x: this.ref?.scrollLeft || 0,
            y: this.ref?.scrollTop || 0
        }
        this.routerData?.scrollRestorationData.set(this.props.id, scrollPos);
    
        this.routerData?.navigation.removeEventListener('transition-end', this.onPageAnimationEnd);
        window.removeEventListener('hashchange', this.onHashChange);
    }

    onPageAnimationEnd = () => {
        if (window.location.hash) requestAnimationFrame(this.onHashChange.bind(this));
    }

    onHashChange = () => {
        if (this.ref) {
            const id = location.hash;
            try {
                // for when hash is invalid css selector
                this.ref.querySelector(id)?.scrollIntoView(this.props.hashScrollConfig);
            } catch {}
        }
    }

    setRef = (ref: HTMLElement | null) => {
        if (ref) {
            this.scrollPos = {
                x: ref.scrollLeft,
                y: ref.scrollTop
            };

            this.ref = ref;

            if (location.hash && !this._mounted) this.onHashChange();

            this._mounted = true;
        }
    }

    get scrollTop () {
        return this.ref?.scrollTop ?? 0;
    }

    get scrollLeft () {
        return this.ref?.scrollLeft ?? 0;
    }

    get scrollWidth () {
        return this.ref?.scrollWidth ?? 0;
    }

    get scrollHeight() {
        return this.ref?.scrollHeight ?? 0;
    }
    render() {
        return (
            <RouterDataContext.Consumer>
                {(routerData) => {
                    this.routerData = routerData;
                    const {style, shouldRestore, hashScrollConfig, ...props} = this.props;
                    return (
                        <div {...props} ref={this.setRef} style={{
                            ...style,
                            overflow: 'scroll',
                        }}>
                            {this.props.children}
                        </div>
                    );
                }}
            </RouterDataContext.Consumer>
        );
    }
}