import React from 'react';
import { Anchor, ScrollRestoration, SharedElement } from '@react-motion-router/core';
import { Navigation, Stack } from '@react-motion-router/stack';
import Navbar from '../Components/Navbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Hero, Heroes } from '../assets/Heroes';
import ButtonBase from '@mui/material/ButtonBase';
import '../css/Cards.css';

interface CardsProps extends Stack.ScreenComponentProps {}

interface CardListProps extends CardsProps {
    observer: IntersectionObserver;
}

const CardList = ({navigation, observer}: CardListProps) => {
    const cards = Heroes.map((hero: Hero, index) => {
        let imageRef: HTMLImageElement | null = null;
        let paraRef: HTMLElement | null = null;
        let titleRef: HTMLElement | null = null;
        let gradientRef: HTMLElement | null = null;
        let bgRef: HTMLElement | null = null;
        const params = {
            ...hero,
            photoAspect: 0
        };
        const onClick = () => {
            if (imageRef && paraRef && titleRef && gradientRef && bgRef) {
                const imageRect = imageRef.getBoundingClientRect();
                const paraRect = paraRef.getBoundingClientRect();
                const titleRect = titleRef.getBoundingClientRect();
                params.photoAspect = imageRef.naturalWidth / imageRef.naturalHeight;
                titleInset = `inset(calc(${-titleRect.top}px + var(--navbar-safe-area)) ${-titleRect.right}px ${-titleRect.bottom}px ${-titleRect.left}px)`;
                titleRef.style.clipPath = titleInset;
                inset = `inset(calc(${-imageRect.top}px + var(--navbar-safe-area)) ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                imageRef.style.clipPath = inset;
                gradientRef.style.clipPath = inset;
                bgInset = `inset(calc(${-imageRect.top}px + var(--navbar-safe-area)) ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                bgRef.style.clipPath = bgInset;
                textInset = `inset(calc(${-paraRect.top}px + var(--navbar-safe-area)) ${-paraRect.right}px ${-paraRect.bottom}px ${-paraRect.left}px)`;
                paraRef.style.clipPath = textInset;
                heroName = hero.id;
            }
        };
        return (
            <li role="menuitem" key={index}>
                <Anchor href='/details' params={params} onClick={onClick}>
                    <ButtonBase aria-label={`Character profile: ${hero.name}`} disableRipple>
                        <SharedElement id={`${hero.id}-card-bg`}>
                            <div
                                id={`${hero.id}-bg`}
                                className="card-bg"
                                ref={(ref: HTMLElement | null) => bgRef = ref}
                                style={{ width: 345 > window.screen.width ? 300 : 345, clipPath: (heroName === hero.id ? bgInset : '') }}
                            ></div>
                        </SharedElement>
                        <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
                            <SharedElement id={`${hero.id}-gradient-overlay`}>
                                <div
                                    ref={ref => gradientRef = ref}
                                    className="gradient-overlay"
                                    style={{
                                        clipPath: (heroName === hero.id ? inset : '')
                                    }}
                                ></div>
                            </SharedElement>
                            <SharedElement id={hero.id}>
                                <CardMedia
                                    component="img"
                                    height={345}
                                    loading={heroName === hero.id ? "eager" : "lazy"}
                                    decoding={heroName === hero.id ? "sync" : "async"}
                                    src={hero.photoUrl}
                                    alt={hero.name}
                                    id={`${hero.id}`}
                                    ref={(ref: HTMLImageElement | null) => {
                                        if (imageRef) observer.unobserve(imageRef);
                                        imageRef = ref;
                                        if (ref) {
                                            observer.observe(ref);
                                        }
                                    }}
                                    style={{
                                        clipPath: (heroName === hero.id ? inset : '')
                                    }}
                                />
                            </SharedElement>
                            <CardContent style={{position: 'absolute', bottom: '0', color: 'white'}}>
                                <SharedElement id={`title-${hero.id}`} config={{
                                    type: 'fade-through'
                                }}>
                                    <Typography
                                        style={{
                                            clipPath: (heroName === hero.id ? titleInset : ''),
                                            fontWeight: 'bold',
                                            zIndex: 10,
                                            margin: 0,
                                            position: 'relative',
                                            fontSize: '28px'
                                        }}
                                        ref={(c: HTMLElement | null) => titleRef = c}
                                        gutterBottom
                                        variant="h4"
                                        component="h4"
                                    >{hero.name}</Typography>
                                </SharedElement>
                                <SharedElement id={`description-${hero.id}`} config={{
                                    type: 'fade-through'
                                }}>
                                    <p 
                                        ref={(c: HTMLElement | null) => paraRef = c}
                                        style={{
                                            fontSize: '16px',
                                            zIndex: 10,
                                            position: 'relative',
                                            clipPath: (heroName === hero.id ? textInset : '')
                                        }}
                                    >{hero.description}</p>
                                </SharedElement>
                            </CardContent>
                        </Card>
                    </ButtonBase>
                </Anchor>
            </li>
        );
    });

    return <>{cards}</>;
}

let inset = '';
let textInset = '';
let heroName = '';
let titleInset = '';
let bgInset = '';

export default class Cards2 extends React.Component<CardsProps> {
    static isFirstLoad = false;
    private ref: HTMLElement | null = null;
    private observer = new IntersectionObserver(this.observe.bind(this), {
        root: document.querySelector('.card-list')
    });
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        if (!Cards2.isFirstLoad) {
            Cards2.isFirstLoad = true;
            this.forceUpdate();
        }
        if (this.props.navigation.location.pathname === '/cards-2') {
            inset = '';
            textInset = '';
            titleInset = '';
            this.forceUpdate();
        }
    }

    componentDidMount() {
        this.props.navigation.prefetchRoute('/details');
        this.props.navigation.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
        if (this.ref) {
            this.ref.scrollTo(Cards2.scrollPos.x, Cards2.scrollPos.y); // scroll restoration
        } 
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillUnmount() {
        this.observer.disconnect();
        if (this.ref) {
            Cards2.scrollPos = {
                x: this.ref.scrollLeft,
                y: this.ref.scrollTop
            }
        }
    }

    observe(entries: IntersectionObserverEntry[]) {
        for (let entry of entries) {
            const target = entry.target as HTMLImageElement;
            if (entry.isIntersecting) {
                target.loading = 'eager';
                target.decoding = 'sync';
            } else {
                target.loading = 'lazy';
                target.decoding = 'async';
            }
        }
    }
    render() {
        return (
            <ScrollRestoration id="cards-2-scroll-area" hashScrollConfig={{
                behavior: 'smooth'
            }}>
                <div className={`cards cards-2 ${Cards2.isFirstLoad ? 'loaded' : 'suspense'}`}>
                    <SharedElement id="navbar">
                        <Navbar title="Cards Demo 2" backButton />
                    </SharedElement>
                    <ul role="group" aria-label='One Punch Man Series Characters' className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                        <CardList {...this.props} observer={this.observer} />
                    </ul>
                </div>
            </ScrollRestoration>
        );
    }
}