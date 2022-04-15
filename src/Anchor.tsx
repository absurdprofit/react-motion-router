import React from 'react';
import { ParamsSerialiser } from './common/types';
import { RouterDataContext } from './RouterData';

interface AnchorProps {
    children: any;
    href: string;
    params?: {[key:string]: any};
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface AnchorState {
    url: string;
}

export default class Anchor extends React.Component<AnchorProps, AnchorState> {
    private paramsSerialiser?: ParamsSerialiser;

    state: AnchorState = {
        url: ''
    }

    updateHref() {
        if (!this.props.params) return this.setState({url: this.props.href});
        try {
            const serialiser = this.paramsSerialiser || ((params: {[key:string]: any}) => new URLSearchParams(params).toString());
            const searchParams = serialiser(this.props.params);
            
            this.setState({
                url: `${this.props.href}?${searchParams}`
            });
        } catch (e) {
            console.error(e);
            console.warn("Non JSON serialisable value was passed as route param to Anchor.");
        }
    }

    componentDidMount() {
        this.updateHref();
    }

    componentDidUpdate(prevProps: AnchorProps) {
        if (prevProps.params !== this.props.params) {
            this.updateHref();
        }
    }

    render() {
        return (
            <RouterDataContext.Consumer>
                {({paramsSerialiser}) => {
                    this.paramsSerialiser = paramsSerialiser;
                    return(
                        <a
                            href={this.state.url}
                            onClick={(e)=>{
                                e.preventDefault();
                                if (this.props.onClick) this.props.onClick(e)
                            }}
                            style={{
                                color: 'inherit',
                                cursor: 'inherit',
                                textDecoration: 'none',
                                width: 'max-content',
                                height: 'max-content',
                                display: 'contents'
                            }}
                        >{this.props.children}</a>
                    );
                }}
            </RouterDataContext.Consumer>
        );
    }
}

    // useEffect(() => {
    //     
    // }, [props.href, props.params]);
    
