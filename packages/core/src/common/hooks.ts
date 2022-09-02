import React, { useEffect, useState } from "react";
import { Motion } from "..";
import { MotionProgressEvent } from "../MotionEvents";
import { RouterDataContext } from "../RouterData";

export function useReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const [prefersReducedMotion, setPreference] = useState(mediaQuery.matches);

    const onPreferenceChange = () => {
        setPreference(mediaQuery.matches);
    };

    mediaQuery.onchange = onPreferenceChange;

    return prefersReducedMotion;
}

export function useMotion() {
    const [motion, setMotion] = useState(React.useContext(Motion));
    
    useEffect(() => {
        const onProgress = ({detail}: MotionProgressEvent) => {
            setMotion(detail.progress);
        }
        window.addEventListener('motion-progress', onProgress);

        return () => window.removeEventListener('motion-progress', onProgress);
    }, []);
    
    return motion;
}

export function useNavigation() {
    const routerData = React.useContext(RouterDataContext);
    return routerData.navigation;
}