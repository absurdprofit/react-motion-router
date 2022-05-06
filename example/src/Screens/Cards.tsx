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
    static isLoaded = false;
    private ref: HTMLElement | null = null;
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        Cards.isLoaded = true;
        if (this.props.navigation.location.pathname === '/cards') {
            inset = '';
            textInset = '';
            titleInset = '';
        }
        this.forceUpdate();
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
        if (this.ref) {
            this.ref.scrollTo(Cards.scrollPos.x, Cards.scrollPos.y); // scroll restoration
        } 
    }

    shouldComponentUpdate() {
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

    render() {
        return (
            <div className={`cards ${Cards.isLoaded ? 'loaded' : 'suspense'}`}>
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo" backButton />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        let imageRef: HTMLElement | null = null;
                        let paraRef: HTMLElement | null = null;
                        let titleRef: HTMLElement | null = null;
                        let bgRef: HTMLElement | null = null;
                        return (
                            <ButtonBase key={index} disableRipple onClick={() => {
                                if (imageRef && paraRef && titleRef && bgRef) {
                                    const imageRect = imageRef.getBoundingClientRect();
                                    const paraRect = paraRef.getBoundingClientRect();
                                    const titleRect = titleRef.getBoundingClientRect();
                                    titleInset = `inset(${-titleRect.top+64}px ${-titleRect.right}px ${-titleRect.bottom}px ${-titleRect.left}px)`;
                                    titleRef.style.clipPath = titleInset;
                                    inset = `inset(${-imageRect.top+64}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                                    imageRef.style.clipPath = inset;
                                    bgInset = `inset(${-imageRect.top+66}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                                    bgRef.style.clipPath = bgInset;
                                    textInset = `inset(${-paraRect.top+64}px ${-paraRect.right}px ${-paraRect.bottom}px ${-paraRect.left}px)`;
                                    paraRef.style.clipPath = textInset;
                                    heroName = hero.id;
                                }
                                this.props.navigation.navigate('/details', {hero});
                            }}>
                                <SharedElement id={`${hero.id}-card-bg`}>
                                    <div
                                        id={`${hero.id}-bg`}
                                        className="card-bg"
                                        ref={(ref: HTMLElement | null) => bgRef = ref}
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
                                    <CardContent>
                                        <SharedElement id={`title-${hero.id}`}>
                                            <Typography
                                                style={{
                                                    clipPath: (heroName === hero.id ? titleInset : ''),
                                                    fontWeight: 'bold',
                                                    margin: 0,
                                                    fontSize: '28px'
                                                }}
                                                ref={(c: HTMLElement | null) => titleRef = c}
                                                gutterBottom
                                                variant="h4"
                                                component="h4"
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