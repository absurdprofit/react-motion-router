
import * as Stack from "@react-motion-router/stack";
import Home from "./Home";
import Player from "./Player";
import Sheet from "./Sheet";
import { useEffect } from "react";
import { HomeAnimation, ModalAnimation } from "./animations";
import './index.css';
import { isIOS, isPWA } from "../../common/utils";
import { STATIC_ANIMATION } from "../../common/constants";

interface OverlaysProps extends Stack.ScreenComponentProps { }
let isFirstLoad = false;
export default function Overlays(props: OverlaysProps) {
    useEffect(() => {
        props.navigation.addEventListener('navigate', (e) => {
            e.detail.signal.addEventListener('abort', () => {
                console.log("Aborted");
            });
        }, { once: true, capture: true });

        props.navigation.finished.then(() => isFirstLoad = true);
        document.body.style.backgroundColor = 'rgba(254, 226, 85)';

        return () => {
            document.body.style.backgroundColor = 'unset';
        }
    }, [props.navigation]);

    const modalConfig = {
        swipeDirection: 'down',
        swipeAreaWidth: window.innerHeight / 1.5,
        disableDiscovery: false,
        hysteresis: 15,
        presentation: "modal"
    } as const;
    return (
        <div className={`overlays ${isFirstLoad ? 'loaded' : 'suspense'}`}>
            <div style={{ position: "absolute", width: "100vw", height: "100vh" }}>
                <Stack.Router config={{
                    disableBrowserRouting: isPWA() && isIOS()
                }}>
                    <Stack.Screen component={Home} path="." config={{animation: HomeAnimation}} />
                    <Stack.Screen component={Player} path="player" config={{
                        ...modalConfig,
                        animation: ModalAnimation
                    }} />
                    <Stack.Screen
                        component={Sheet}
                        path="sheet"
                    />
                </Stack.Router>
            </div>
        </div>
    );
}