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
let heroName = '';
let titleInset = '';
export default class Cards2 extends React.Component<CardsProps> {
    private ref: HTMLElement | null = null;
    private observer = new IntersectionObserver(this.observe.bind(this), {
        threshold: 0.1
    });
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        if (this.props.navigation.location.pathname === '/cards-2') {
            inset = '';
            textInset = '';
            titleInset = '';
            this.forceUpdate();
        }
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
        if (this.ref) {
            this.ref.scrollTo(Cards2.scrollPos.x, Cards2.scrollPos.y); // scroll restoration
        } 
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillUnmount() {
        if (this.ref) {
            Cards2.scrollPos = {
                x: this.ref.scrollLeft,
                y: this.ref.scrollTop
            }
        }
    }

    observe(entries: IntersectionObserverEntry[]) {
        entries.map((entry: IntersectionObserverEntry) => {
            const target = entry.target as HTMLImageElement;
            if (entry.isIntersecting) {
                if (target.dataset.src && target.src.substring(0, 4) === "data") {
                    target.style.transition = 'opacity 0.3s ease';
                    target.style.opacity = '0';
                    target.src = target.dataset.src;
                    target.onload = () => {
                        target.decoding = "sync";
                        target.loading = "eager";
                        target.style.opacity = '1';
                    }
                } else {
                    target.decoding = "sync";
                    target.loading = "eager";
                }
            }

            return undefined;
        });
    }
    render() {
        return (
            <div className="cards cards-2">
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo 2" onBack={() => this.props.navigation.goBack()} />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        let imageRef: HTMLElement | null = null;
                        let paraRef: HTMLElement | null = null;
                        let titleRef: HTMLElement | null = null;
                        let gradientRef: HTMLElement | null = null;
                        return (
                            <ButtonBase key={index} onClick={() => {
                                if (imageRef && paraRef && titleRef && gradientRef) {
                                    const imageRect = imageRef.getBoundingClientRect();
                                    const paraRect = paraRef.getBoundingClientRect();
                                    const titleRect = titleRef.getBoundingClientRect();
                                    titleInset = `inset(${-titleRect.top+64}px ${-titleRect.right}px ${-titleRect.bottom}px ${-titleRect.left}px)`;
                                    titleRef.style.clipPath = titleInset;
                                    inset = `inset(${-imageRect.top+64}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                                    imageRef.style.clipPath = inset;
                                    gradientRef.style.clipPath = inset;
                                    textInset = `inset(${-paraRect.top+64}px ${-paraRect.right}px ${-paraRect.bottom}px ${-paraRect.left}px)`;
                                    paraRef.style.clipPath = textInset;
                                    heroName = hero.id;
                                }
                                this.props.navigation.navigate('/details', {
                                    profile: hero,
                                    noBg: true
                                });
                            }}>
                                <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
                                    <SharedElement id={`${hero.id}-gradient-overlay`} config={{
                                        easingFunction: 'linear'
                                    }}>
                                        <div
                                            ref={ref => gradientRef = ref}
                                            className="gradient-overlay"
                                            style={{
                                                clipPath: (heroName === hero.id ? inset : '')
                                            }}
                                        ></div>
                                    </SharedElement>
                                    <SharedElement id={hero.id} config={{
                                        easingFunction: 'linear'
                                    }}>
                                        <CardMedia
                                            component="img"
                                            height={345}
                                            loading={heroName === hero.id ? "eager" : "lazy"}
                                            decoding={heroName === hero.id ? "sync" : "async"}
                                            src={heroName === hero.id ? hero.photo : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAGklEQVR42mN8/5+BJMA4qmFUw6iGUQ201QAAzKYuaaLRYAgAAAAASUVORK5CYII="}
                                            data-src={hero.photo}
                                            alt={hero.name}
                                            id={`${hero.id}`}
                                            ref={(ref: HTMLImageElement | null) => {
                                                if (imageRef) {
                                                    this.observer.unobserve(imageRef);
                                                }
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
                        );
                    })
                }
                </div>
            </div>
        );
    }
}