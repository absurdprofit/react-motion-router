import React from 'react';
import { Anchor, SharedElement } from '@react-motion-router/core';
import { Stack } from '@react-motion-router/stack';
import Navbar from '../Components/Navbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Hero, Heroes } from '../assets/Heroes';
import ButtonBase from '@mui/material/ButtonBase';
import '../css/Cards.css';
import { getInset } from '../common/utils';

interface CardsProps extends Stack.ScreenComponentProps {}

interface CardListProps extends CardsProps {
    observer: IntersectionObserver;
}

interface CardProps extends CardsProps {
    observer: IntersectionObserver;
    hero: Hero;
}

let imageInset = '';
let textInset = '';
let heroName = '';
let titleInset = '';
let bgInset = '';
const CardComponent = ({observer, navigation, hero}: CardProps) => {
    const bgRef = React.useRef<HTMLDivElement | null>(null);
    const titleRef = React.useRef<HTMLHeadingElement | null>(null);
    const paraRef = React.useRef<HTMLParagraphElement | null>(null);
    const imageRef = React.useRef<HTMLImageElement | null>(null);
    const gradientRef = React.useRef<HTMLDivElement | null>(null);
    const params = {
        ...hero,
        photoAspect: 0
    };
    const onClick = () => {
        const image = imageRef.current;
        const paragraph = paraRef.current;
        const title = titleRef.current;
        const bg = bgRef.current;
        const gradient = gradientRef.current;
        if (image && paragraph && title && gradient && bg) {
            const imageRect = image.getBoundingClientRect();
            const paraRect = paragraph.getBoundingClientRect();
            const titleRect = title.getBoundingClientRect();
            params.photoAspect = image.naturalWidth / image.naturalHeight;
            titleInset = getInset(-titleRect.top, -titleRect.right, -titleRect.bottom, -titleRect.left);
            title.style.clipPath = titleInset;
            imageInset = getInset(-imageRect.top, -imageRect.right, -imageRect.bottom, -imageRect.left);
            image.style.clipPath = imageInset;
            gradient.style.clipPath = imageInset;
            bgInset = getInset(-imageRect.top, -imageRect.right, -imageRect.bottom, -imageRect.left);
            bg.style.clipPath = bgInset;
            textInset = getInset(-paraRect.top, -paraRect.right, -paraRect.bottom, -paraRect.left);
            paragraph.style.clipPath = textInset;
            heroName = hero.id;
        }
    };
    return (
        <li role="menuitem">
            <Anchor href='/details' params={params} onClick={onClick}>
                <ButtonBase aria-label={`Character profile: ${hero.name}`} disableRipple>
                    <SharedElement id={`${hero.id}-card-bg`}>
                        <div
                            id={`${hero.id}-bg`}
                            className="card-bg"
                            ref={bgRef}
                            style={{ width: 345 > window.screen.width ? 300 : 345, clipPath: (heroName === hero.id ? bgInset : '') }}
                        ></div>
                    </SharedElement>
                    <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
                        <SharedElement id={`${hero.id}-gradient-overlay`}>
                            <div
                                ref={gradientRef}
                                className="gradient-overlay"
                                style={{
                                    clipPath: (heroName === hero.id ? imageInset : '')
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
                                ref={imageRef}
                                style={{
                                    clipPath: (heroName === hero.id ? imageInset : '')
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
                                    ref={titleRef}
                                    gutterBottom
                                    variant="h4"
                                    component="h4"
                                >{hero.name}</Typography>
                            </SharedElement>
                            <SharedElement id={`description-${hero.id}`} config={{
                                type: 'fade-through'
                            }}>
                                <p 
                                    ref={paraRef}
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
}

const CardList = (props: CardListProps) => {
    const cards = Heroes.map((hero: Hero, index) => {
       return <CardComponent key={index} hero={hero} {...props} /> 
    });

    return <>{cards}</>;
}

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

    componentDidMount() {
        this.props.navigation.prefetchRoute('/details');
        this.props.navigation.finished.then(() => {
            if (!Cards2.isFirstLoad) {
                Cards2.isFirstLoad = true;
                this.forceUpdate();
            }
            if (this.props.navigation.location.pathname === '/cards-2') {
                imageInset = '';
                textInset = '';
                titleInset = '';
                this.forceUpdate();
            }
        });
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
            <div className={`cards cards-2 ${Cards2.isFirstLoad ? 'loaded' : 'suspense'}`}>
                <ul role="group" aria-label='One Punch Man Series Characters' className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                    <CardList {...this.props} observer={this.observer} />
                </ul>
            </div>
        );
    }
}