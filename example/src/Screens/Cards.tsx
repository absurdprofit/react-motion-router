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
export default class Cards extends React.Component<CardsProps> {
    private ref: HTMLElement | null = null;
    private static scrollPos = {
        x: 0,
        y: 0
    }

    pageAnimationEnd() {
        if (this.props.navigation.location.pathname === '/cards') {
            inset = '';
            textInset = '';
            this.forceUpdate();
        }
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
        if (this.ref) {
            this.ref.scrollTo(Cards.scrollPos.x, Cards.scrollPos.y); // scroll restoration
        } 
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
            <div className="cards">
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo" onBack={() => this.props.navigation.goBack()} />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        let imageRef: HTMLElement | null = null;
                        let paraRef: HTMLElement | null = null;
                        return (
                            <ButtonBase key={index} onClick={() => {
                                if (imageRef && paraRef) {
                                    const imageRect = imageRef.getBoundingClientRect();
                                    const paraRect = paraRef.getBoundingClientRect();
                                    inset = `inset(${-imageRect.top+64}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
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
                                        style={{ width: 345 > window.screen.width ? 300 : 345, clipPath: (heroName === hero.id ? inset : '') }}
                                    ></div>
                                </SharedElement>
                                <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
                                    <SharedElement id={hero.id}>
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={hero.photo}
                                            alt={hero.name}
                                            id={`${hero.id}`}
                                            ref={(c: HTMLElement | null) => imageRef = c}
                                            style={{
                                                clipPath: (heroName === hero.id ? inset : '')
                                            }}
                                        />
                                    </SharedElement>
                                    <CardContent>
                                        <SharedElement id={`title-${hero.id}`}>
                                            <Typography gutterBottom variant="h5" component="h5">{hero.name}</Typography>
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