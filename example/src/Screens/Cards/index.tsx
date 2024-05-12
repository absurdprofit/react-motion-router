import React from 'react';
import { SharedElement } from '@react-motion-router/core';
import { Anchor, ScreenComponentProps } from '@react-motion-router/stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Hero, Heroes } from '../../assets/Heroes';
import ButtonBase from '@mui/material/ButtonBase';
import './index.css';
import { getInset } from '../../common/utils';

interface CardsProps extends ScreenComponentProps { }

interface CardListProps extends CardsProps {
    observer: IntersectionObserver;
}

interface CardProps extends CardsProps {
    observer: IntersectionObserver;
    hero: Hero;
}

let imageInset = '';
let textInset = '';
let bgInset = '';
let heroName = '';
let titleInset = '';
const CardComponent = ({ observer, navigation, hero }: CardProps) => {
    const bgRef = React.useRef<HTMLDivElement | null>(null);
    const titleRef = React.useRef<HTMLHeadingElement | null>(null);
    const paraRef = React.useRef<HTMLParagraphElement | null>(null);
    const imageRef = React.useRef<HTMLImageElement | null>(null);

    React.useEffect(() => {
        if (imageRef.current) observer.observe(imageRef.current);
        return () => {
            if (imageRef.current) observer.unobserve(imageRef.current);
        }
    }, [imageRef, observer]);
    const onClick = () => {
        const image = imageRef.current;
        const paragraph = paraRef.current;
        const title = titleRef.current;
        const bg = bgRef.current;
        if (image && paragraph && title && bg) {
            const imageRect = image.getBoundingClientRect();
            const paraRect = paragraph.getBoundingClientRect();
            const titleRect = title.getBoundingClientRect();
            titleInset = getInset(-titleRect.top, -titleRect.right, -titleRect.bottom, -titleRect.left);
            title.style.clipPath = titleInset;
            imageInset = getInset(-imageRect.top, -imageRect.right, -imageRect.bottom, -imageRect.left);
            image.style.clipPath = imageInset;
            bgInset = getInset(-imageRect.top, -imageRect.right, -imageRect.bottom, -imageRect.left);
            bg.style.clipPath = bgInset;
            textInset = getInset(-paraRect.top, -paraRect.right, -paraRect.bottom, -paraRect.left);
            paragraph.style.clipPath = textInset;
            heroName = hero.id;
        }
    };
    return (
        <li role="menuitem">
            <Anchor href='details' params={{ ...hero }} onClick={onClick}>
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
                        <SharedElement id={hero.id}>
                            <CardMedia
                                component="img"
                                height="140"
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
                        <CardContent>
                            <SharedElement id={`title-${hero.id}`}>
                                <Typography
                                    style={{
                                        clipPath: (heroName === hero.id ? titleInset : ''),
                                        fontWeight: 'bold',
                                        margin: 0,
                                        fontSize: '28px'
                                    }}
                                    ref={titleRef}
                                    gutterBottom
                                    variant="h4"
                                    component="h4"
                                >{hero.name}</Typography>
                            </SharedElement>
                            <SharedElement id={`description-${hero.id}`}>
                                <p
                                    ref={paraRef}
                                    style={{
                                        fontSize: '16px',
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
        return (
            <CardComponent key={index} hero={hero} {...props} />
        );
    });
    return <>{cards}</>;
}


export default class Cards extends React.Component<CardsProps> {
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
        this.props.navigation.transition?.finished.then(() => {
            Cards.isFirstLoad = true;
            if (this.props.navigation.current.url?.pathname === '/cards') {
                imageInset = '';
                textInset = '';
                titleInset = '';
            }
            this.forceUpdate();
        });
        if (this.ref) {
            this.ref.scrollTo(Cards.scrollPos.x, Cards.scrollPos.y); // scroll restoration
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillUnmount() {
        this.observer.disconnect();
        if (this.ref) {
            Cards.scrollPos = {
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
            <div className={`cards ${Cards.isFirstLoad ? 'loaded' : 'suspense'}`}>
                <ul role="group" aria-label='One Punch Man Series Characters' className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                    <CardList {...this.props} observer={this.observer} />
                </ul>
            </div>
        );
    }
}