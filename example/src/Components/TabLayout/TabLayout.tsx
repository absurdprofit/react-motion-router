import { Button } from '@mui/material';
import React from 'react';
import { Navigation, Router, Stack } from 'react-motion-router';
import Tab from './Tab';
import '../../css/Tabs.css';
import { TabAnimation } from './Animations';
import TabNavigation from '../../common/Tab/TabNavigation';
import TabRouter from './TabRouter';
import { BackBehaviour } from '../../common/Tab/TabHistory';
import { lerp } from '../../common/utils';
import { clamp } from 'react-motion-router/common/utils';

type TabChild = React.ReactElement<React.ComponentProps<typeof Tab.Screen>,React.JSXElementConstructor<typeof Tab.Screen>>;


interface TabLayoutProps {
    children: TabChild | TabChild[];
    backBehaviour?: BackBehaviour;
}

interface TabLayoutState {
    navigation?: TabNavigation;
    index: number;
    lastIndex: number;
    progress: number;
    lastUnderlinePos: number;
    currentUnderlinePos: number;
    backNavigation: boolean;
}

export default class TabLayout extends React.Component<TabLayoutProps, TabLayoutState> {
    private headerRef: HTMLDivElement | null = null;
    private headerUnderlineRef: HTMLSpanElement | null = null;
    private underlineKeyframes: Keyframe[] = [];
    private underlineAnimation: Animation | null = null;

    state: TabLayoutState = {
        index: 0,
        lastIndex: 0,
        progress: 0,
        lastUnderlinePos: 0,
        currentUnderlinePos: 0,
        backNavigation: false
    }

    componentDidMount() {
        // this.setUnderlinePosition(this.state.index);
    }

    componentDidUpdate(lastProps: TabLayoutProps, lastState: TabLayoutState) {
        if (lastState.progress !== this.state.progress) {
            if (this.underlineAnimation) {
                const progress = clamp(this.state.progress, 0, 100);
                const duration = this.underlineAnimation.effect?.getComputedTiming().duration || 200;
                const currentTime = (progress / 100) * parseFloat(duration.toString());
                this.underlineAnimation.currentTime = currentTime;
            }
        }
    }

    // setUnderlinePosition = (index: number) => {
    //     if (this.headerRef && this.headerUnderlineRef) {
    //         const {left, width} = this.headerRef.children[index].getBoundingClientRect();
    //         // this.headerUnderlineRef.style.left = `${left}px`;
    //         if (!this.state.backNavigation) {
    //             this.setState({
    //                 lastUnderlinePos: this.state.currentUnderlinePos,
    //                 currentUnderlinePos: left
    //             });
    //         } else {
    //             console.log(left, this.state.currentUnderlinePos);
    //             this.setState({
    //                 lastUnderlinePos: left,
    //                 currentUnderlinePos: this.state.currentUnderlinePos
    //             });
    //         }
    //         this.headerUnderlineRef.style.width = `${width}px`;
    //     }
    // }

    pushTab = (index: number) => {
        const delta = (index + 1) - (this.state.index + 1);
        
        this.state.navigation?.go(delta);
    }

    onChangeIndex = (index: number) => {
        const delta = (index + 1) - (this.state.index + 1);
        let lastIndex = clamp(index - 1, 0);
        // if (backNavigation) [lastIndex, index] = [index, lastIndex];
        this.setState({index, lastIndex}, () => {
            // this.setUnderlinePosition(index);            
        });
    }

    addUnderlineKeyframe(ref: HTMLElement, index: number) {
        if (this.underlineKeyframes.at(index)) return;

        const {x, width} = ref.getBoundingClientRect();
        const parentWidth = ref.parentElement?.getBoundingClientRect().width || window.innerWidth;
        const offset = x / parentWidth;
        this.underlineKeyframes[index] = {
            transform: `translateX(${x}px)`,
            width: `${width}px`,
            // offset
        };
    }

    setUnderlineRef = (ref: HTMLElement | null) => {
        this.headerUnderlineRef = ref;
        if (ref) {
            this.underlineKeyframes = this.underlineKeyframes.sort((a, b) => a < b ? -1 : 1);
            this.underlineAnimation = ref.animate(this.underlineKeyframes, {
                duration: 200,
                easing: 'ease',
                fill: 'forwards'
            });

            this.underlineAnimation.pause();
        }
    }

    render() {
        return (
            <div className="tab-layout">
                <div className="header-layout" ref={(c) => this.headerRef = c}>
                    {React.Children.map(this.props.children, (tab, index) => {
                        const {name} = tab.props;
                        return <Button onClick={() => this.pushTab(index)} ref={c => {
                            if (c) this.addUnderlineKeyframe(c, index);
                        }}>{name}</Button>
                    })}
                    <span
                        className="underline"
                        ref={this.setUnderlineRef}
                    ></span>
                </div>
                <TabRouter
                    onMount={(navigation: TabNavigation) => {
                        this.setState({navigation});
                    }}
                    onMotionProgress={(progress) => {
                        let {index, lastIndex, backNavigation} = this.state;
                        if (backNavigation) [lastIndex, index] = [index, lastIndex];
                        console.log(index, lastIndex);
                        progress = lerp(0, 100, lerp(lastIndex / 2, index / 2, progress / 100));
                        this.setState({progress});
                    }}
                    onBackNavigationChange={(backNavigation) => {
                        console.log(backNavigation);
                        this.setState({backNavigation})
                    }}
                    onChangeIndex={this.onChangeIndex}
                    config={{
                        animation: {type: 'slide', direction: 'right', duration: 200}
                    }}
                    backBehaviour={"none"}
                >
                    {this.props.children}
                </TabRouter>
            </div>
        );
    }
}
