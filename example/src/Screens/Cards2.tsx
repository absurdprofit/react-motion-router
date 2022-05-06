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
    static isLoaded = false;
    private ref: HTMLElement | null = null;
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        if (!Cards2.isLoaded) {
            Cards2.isLoaded = true;
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
    render() {
        return (
            <div className={`cards cards-2 ${Cards2.isLoaded ? 'loaded' : 'suspense'}`}>
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo 2" backButton />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        let imageRef: HTMLImageElement | null = null;
                        let paraRef: HTMLElement | null = null;
                        let titleRef: HTMLElement | null = null;
                        let gradientRef: HTMLElement | null = null;
                        return (
                            <ButtonBase key={index} disableRipple onClick={() => {
                                let imageAspect;
                                if (imageRef && paraRef && titleRef && gradientRef) {
                                    const imageRect = imageRef.getBoundingClientRect();
                                    const paraRect = paraRef.getBoundingClientRect();
                                    const titleRect = titleRef.getBoundingClientRect();
                                    imageAspect = imageRef.naturalWidth / imageRef.naturalHeight;
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
                                    hero,
                                    noBg: true,
                                    photoAspect: imageAspect
                                });
                            }}>
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
                                            src={hero.photo.url}
                                            alt={hero.name}
                                            id={`${hero.id}`}
                                            ref={(ref: HTMLImageElement | null) => {
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