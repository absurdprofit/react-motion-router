export const SlideInFromRight = [
    {
        transform: 'translateX(100vw)',
    },
    {
        transform: 'translateX(0vw)'
    }
];

export const SlideOutToLeft = [
    {
        transform: 'translateX(0vw)'
    },
    {
        transform: 'translateX(-50vw)'
    }
];

export const SlideInFromLeft = [
    {
        transform: 'translateX(-100vw)'
    },
    {
        transform: 'translateX(0vw)'
    }
];

export const SlideOutToRight = [
    {
        transform: 'translateX(0vw)'
    },
    {
        transform: 'translateX(50vw)'
    }
];

export const SlideInFromBottom = [
    {
        transform: 'translateY(100vh)'
    },
    {
        transform: 'translateY(0vh)'
    }
];

export const SlideOutToTop = [
    {
        transform: 'translateY(0vh)'
    },
    {
        transform: 'translateY(-50vh)'
    }
];

export const SlideInFromTop = [
    {
        transform: 'translateY(-100vh)'
    },
    {
        transform: 'translateY(0vh)'
    }
];

export const SlideOutToBottom = [
    {
        transform: 'translateY(0vh)'
    },
    {
        transform: 'translateY(50vh)'
    }
];

export const ZoomIn = [
    {
        transform: 'scale(0.85)',
        opacity: 0
    },
    {
        transform: 'scale(1)',
        opacity: 1
    }
];

export const ZoomOut = [
    {
        transform: 'scale(1)',
        opacity: 1
    },
    {
        transform: 'scale(1.15)',
        opacity: 0
    }
];

export const FadeIn = [
    {
        opacity: 0
    },
    {
        opacity: 1
    }
];

export const FadeOut = [
    {
        opacity: 1
    },
    {
        opacity: 0
    }
];