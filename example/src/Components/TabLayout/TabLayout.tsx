import React from 'react';
import { Button } from '@mui/material';
import Tab from './Tab';
import TabNavigation from '../../common/Tab/TabNavigation';
import TabRouter from './TabRouter';
import { BackBehaviour } from '../../common/Tab/TabHistory';
import { clamp, ScreenChild } from '@react-motion-router/core';
import Theme from '../../common/Tab/Theme';
import '../../css/Tabs.css';
import { ANIMATION_DURATION, TabAnimation } from './Animations';


export type TabChild = ScreenChild<Tab.TabProps, typeof Tab.Screen>;

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
        window.addEventListener('motion-progress-start', this.onGestureStart, true);
        window.addEventListener('motion-progress-end', this.onGestureEnd, true);
    }

    componentDidUpdate(lastProps: TabLayoutProps, lastState: TabLayoutState) {
        if (lastState.progress !== this.state.progress) {
            if (this.underlineAnimation && this.underlineAnimation.playState === 'paused') {
                const progress = clamp(this.state.progress, 0, 100);
                const duration = this.underlineAnimation.effect?.getComputedTiming().duration || ANIMATION_DURATION;
                const currentTime = (progress / 100) * parseFloat(duration.toString());
                this.underlineAnimation.currentTime = currentTime;
            }
            
        }
    }

    componentWillUnmount() {
        window.removeEventListener('motion-progress-start', this.onGestureStart, true);
        window.removeEventListener('motion-progress-end', this.onGestureEnd, true);
        this.state.navigation?.metaData.set('theme-color', '#fee255a1');
        document.body.style.backgroundColor = 'unset';
    }

    onGestureStart = () => {
        const {index} = this.state;
        if (!index) return;

        this.setUnderlineAnimation(index, index - 1);
        this.underlineAnimation?.pause();
    }

    onGestureEnd = () => {
        if (!this.underlineAnimation) return;

        if (this.state.progress < 50) {
            this.underlineAnimation.reverse();
        }
        this.underlineAnimation.play();
    }

    pushTab = (index: number) => {
        const delta = (index + 1) - (this.state.index + 1);
        
        this.state.navigation?.go(delta);
    }

    onChangeIndex = async (index: number) => {
        let lastIndex = clamp(index - 1, 0);

        this.setThemeColour(index);
        
        this.setUnderlineAnimation(index, this.state.index);
        this.setState({index, lastIndex});
    }

    setThemeColour(index: number) {
        if (this.state.navigation) {
            this.state.navigation.metaData.set('theme-color', Theme[index]);
            document.body.style.backgroundColor = Theme[index];
        }
    }

    addUnderlineKeyframe(ref: HTMLElement, index: number) {
        if (this.underlineKeyframes.at(index)) return;

        this.underlineKeyframes[index] = {
            transform: `translateX(${ref.offsetLeft}px)`,
            width: `${ref.offsetWidth}px`,
            // offset
        };
    }

    async setUnderlineAnimation(index: number, lastIndex: number) {
        if (this.headerUnderlineRef && !this.underlineAnimation) {
            this.underlineAnimation = this.headerUnderlineRef.animate([
                this.underlineKeyframes[lastIndex],
                this.underlineKeyframes[index]
            ], {
                duration: ANIMATION_DURATION,
                easing: 'ease',
                fill: 'both'
            });

            await this.underlineAnimation.finished;
            this.underlineAnimation.commitStyles();
            this.underlineAnimation.cancel();
            this.underlineAnimation = null;
        }
    }

    setUnderlineRef = (ref: HTMLElement | null) => {
        this.headerUnderlineRef = ref;
        if (ref) {
            this.underlineKeyframes.sort((a, b) => a < b ? -1 : 1);
        }
    }

    render() {
        return (
            <div className="tab-layout" style={{backgroundColor: Theme[this.state.index]}}>
                <div className="header-layout">
                    {React.Children.map(this.props.children, (tab: TabChild, index: number) => {
                        const {name} = tab.props;
                        const onRef = (c: HTMLElement | null) => {
                            if (c) this.addUnderlineKeyframe(c, index);
                            if (index === this.state.index) {
                                if (!this.headerUnderlineRef || !c) return;

                                this.headerUnderlineRef.style.width = `${c.offsetWidth}px`;
                                this.headerUnderlineRef.style.transform = `translateX(${c.offsetLeft}px)`;
                            }
                        };
                        return (
                            <Button
                                onClick={() => this.pushTab(index)}
                                ref={onRef}
                                
                            >{name}</Button>
                        );
                    })}
                    <span
                        className="underline"
                        ref={this.setUnderlineRef}
                    ></span>
                </div>
                <TabRouter
                    onMount={(navigation: TabNavigation) => {
                        this.setState({navigation}, () => this.setThemeColour(this.state.index));
                    }}
                    onMotionProgress={(progress) => {
                        this.setState({progress});
                    }}
                    onBackNavigationChange={(backNavigation) => {
                        this.setState({backNavigation})
                    }}
                    onChangeIndex={this.onChangeIndex}
                    backBehaviour={"none"}
                >
                    {this.props.children}
                </TabRouter>
            </div>
        );
    }
}
