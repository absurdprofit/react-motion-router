import React, { useEffect } from 'react';
import { SharedElement } from '@react-motion-router/core';
import { Anchor, ScreenComponentProps, GestureRegion } from '@react-motion-router/stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import { Hero } from '../../assets/Heroes';
import './index.css';

type DetailsParams = Hero & {
    noBg?: boolean;
};

interface DetailsProps extends ScreenComponentProps<DetailsParams> { }

let isFirstLoad = false;
let originalDesc: string | undefined;
let lastHero = '';
export default function Details(props: DetailsProps) {
    const [gestureDisabled, setGestureDisabled] = React.useState(false);
    const { noBg, ...hero } = props.route.params;

    useEffect(() => {
        if (!hero.name) {
            props.navigation.goBack();
            return;
        }
        lastHero = hero.name;
        if (hero.description) {
            if (!originalDesc)
                originalDesc = props.navigation.metaData.get('description') as string | undefined;

            const description = hero.description;
            props.navigation.metaData.set('description', `${description.slice(0, 102)}...`);
        }


        props.navigation.addEventListener('back', () => {
            props.navigation.metaData.set('description', originalDesc);
            originalDesc = undefined;
        }, { once: true, capture: true });

        props.navigation.transition?.finished.then(() => {
            isFirstLoad = true;
        });
    }, []);

    if (!hero.name) return <></>;

    const photoAspect = (hero.photoWidth / hero.photoHeight);

    const onScroll = (e: Event) => {
        if (!(e.target instanceof HTMLElement)) return;
        const scrollPos = e.target.scrollTop;
        const maxScroll = e.target.scrollHeight - e.target.clientHeight;
        const scrollPercent = scrollPos / maxScroll;
        if (scrollPercent !== 0) {
            setGestureDisabled(true);
        } else {
            setGestureDisabled(false);
        }
    };

    return (
        <GestureRegion disabled={gestureDisabled}>
            <article
                aria-label={`Character profile: ${hero.name}`}
                className={`details ${isFirstLoad ? 'loaded' : 'suspense'}`}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: noBg ? 'white' : undefined
                }}
            >
                <SharedElement id={`${hero.id}-card-bg`} config={{ willChange: ['backgroundColor', 'borderRadius'], deepClone: false }} disabled={noBg}>
                    <div className="card-bg" aria-hidden="true">
                        
                            <Anchor aria-label='Go Back' goBack tabIndex={-1}>
                                <IconButton style={{
                                    position: "absolute",
                                    color: 'grey',
                                    zIndex: 10000
                                }} disableRipple>
                                    <SharedElement id="back" config={{
                                        type: 'fade-through'
                                    }}>
                                        <ClearIcon style={{
                                            zIndex: 100
                                        }} />
                                    </SharedElement>
                                </IconButton>
                            </Anchor>
                            <div className="profile-info">
                                <SharedElement id={`${hero.id}-gradient-overlay`} config={{willChange: ['background', 'opacity', 'clipPath']}}>
                                    <div
                                        className="gradient-overlay"
                                        style={{
                                            height: window.innerWidth / photoAspect,
                                            width: window.innerWidth
                                        }}
                                        aria-hidden="true"
                                    ></div>
                                </SharedElement>
                                <SharedElement id={hero.id} config={{willChange: ['objectFit', 'borderRadius']}}>
                                    <img src={hero.photoUrl} alt="Character" width={hero.photoWidth} height={hero.photoHeight} />
                                </SharedElement>
                                <div className="text-content" tabIndex={0}>
                                    <SharedElement id={`title-${hero.id}`}>
                                        <Typography
                                            id="title"
                                            style={{ fontWeight: 'bold', fontSize: '28px', zIndex: 10 }}
                                            gutterBottom
                                            variant="h4"
                                            component="h4"
                                        >
                                            {hero.name}
                                        </Typography>
                                    </SharedElement>
                                    <div className="description">
                                        <SharedElement id={`description-${hero.id}`} config={{willChange: ['clipPath', 'textAlign', 'overflow', 'lineHeight']}}>
                                            <p style={{ zIndex: 10 }}>{hero.description}</p>
                                        </SharedElement>
                                    </div>
                                </div>
                            </div>
                    </div>
                </SharedElement>
            </article>
        </GestureRegion>
    );
}