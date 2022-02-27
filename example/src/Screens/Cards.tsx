import React from 'react';
import { Navigation, SharedElement } from 'react-motion-router';
import Navbar from '../Components/Navbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Hero, Heroes } from '../assets/Heroes';
import ButtonBase from '@mui/material/ButtonBase';
import '../css/Cards.css';

interface CardsProps {
    navigation: Navigation;
}

let inset = '';
let textInset = '';
let bgInset = '';
let heroName = '';
let titleInset = '';
export default class Cards extends React.Component<CardsProps> {
    private ref: HTMLElement | null = null;
    private observer = new IntersectionObserver(this.observe.bind(this));
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        if (this.props.navigation.location.pathname === '/cards') {
            inset = '';
            textInset = '';
            titleInset = '';
            this.forceUpdate();
        }
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
        if (this.ref) {
            this.ref.scrollTo(Cards.scrollPos.x, Cards.scrollPos.y); // scroll restoration
        } 
    }

    shouldComponentUpdate() {
        if (inset.length) {
            return true;
        }
        return false;
    }

    componentWillUnmount() {
        if (this.ref) {
            Cards.scrollPos = {
                x: this.ref.scrollLeft,
                y: this.ref.scrollTop
            }
        }
    }

    observe(entries: IntersectionObserverEntry[]) {
        entries.map((entry: IntersectionObserverEntry) => {
            const target = entry.target as HTMLImageElement;
            if (entry.isIntersecting) {
                if (target.dataset.src) {
                    target.src = target.dataset.src;
                }
            }

            return undefined;
        });
    }
    render() {
        return (
            <div className="cards">
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo" onBack={() => this.props.navigation.goBack()} />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        let imageRef: HTMLElement | null = null;
                        let paraRef: HTMLElement | null = null;
                        let titleRef: HTMLElement | null = null;
                        return (
                            <ButtonBase key={index} onClick={() => {
                                if (imageRef && paraRef && titleRef) {
                                    const imageRect = imageRef.getBoundingClientRect();
                                    const paraRect = paraRef.getBoundingClientRect();
                                    const titleRect = titleRef.getBoundingClientRect();
                                    titleInset = `inset(${-titleRect.top+64}px ${-titleRect.right}px ${-titleRect.bottom}px ${-titleRect.left}px)`;
                                    inset = `inset(${-imageRect.top+64}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                                    bgInset = `inset(${-imageRect.top+66}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                                    textInset = `inset(${-paraRect.top+64}px ${-paraRect.right}px ${-paraRect.bottom}px ${-paraRect.left}px)`;
                                    heroName = hero.id;
                                }
                                this.props.navigation.navigate('/details', {
                                    profile: hero
                                });
                            }}>
                                <SharedElement id={`${hero.id}-card-bg`}>
                                    <div
                                        id={`${hero.id}-bg`}
                                        className="card-bg"
                                        style={{ width: 345 > window.screen.width ? 300 : 345, clipPath: (heroName === hero.id ? bgInset : '') }}
                                    ></div>
                                </SharedElement>
                                <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
                                    <SharedElement id={hero.id}>
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            src={heroName === hero.id ? hero.photo : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAGklEQVR42mN8/5+BJMA4qmFUw6iGUQ201QAAzKYuaaLRYAgAAAAASUVORK5CYII="}
                                            data-src={hero.photo}
                                            alt={hero.name}
                                            id={`${hero.id}`}
                                            ref={(ref: HTMLImageElement | null) => {
                                                if (ref) {
                                                    this.observer.observe(ref);
                                                }
                                                imageRef = ref;
                                            }}
                                            style={{
                                                clipPath: (heroName === hero.id ? inset : '')
                                            }}
                                        />
                                    </SharedElement>
                                    <CardContent>
                                        <SharedElement id={`title-${hero.id}`}>
                                            <Typography
                                                style={{
                                                    clipPath: (heroName === hero.id ? titleInset : '')
                                                }}
                                                ref={(c: HTMLElement | null) => titleRef = c}
                                                gutterBottom variant="h5"
                                                component="h5"
                                            >{hero.name}</Typography>
                                        </SharedElement>
                                        <SharedElement id={`description-${hero.id}`}>
                                            <p 
                                                ref={(c: HTMLElement | null) => paraRef = c}
                                                style={{
                                                    fontSize: '16px',
                                                    clipPath: (heroName === hero.id ? textInset : '')
                                                }}
                                            >{hero.description}</p>
                                        </SharedElement>
                                    </CardContent>
                                </Card>
                            </ButtonBase>
                        );
                    })
                }
                </div>
            </div>
        );
    }
}