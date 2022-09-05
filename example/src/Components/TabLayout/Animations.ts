const ANIMATION_DURATION = 350;

const TabAnimation = (current: string, next: string) => {
    const currentIndex = parseInt(current.replace(/\D/g, '')) || 1;
    const nextIndex = parseInt(next.replace(/\D/g, '')) || 1;

    const animationConfig = [
        {
            keyframes: [
                {transform: 'translateX(100%)'},
                {transform: 'translateX(0%)'}
            ],
            options: {
                duration: ANIMATION_DURATION
            }
        },
        {
            keyframes: [
                {transform: 'translateX(0%)'},
                {transform: 'translateX(-100%)'}
            ],
            options: {
                duration: ANIMATION_DURATION
            }
        }
    ];

    if (currentIndex > nextIndex) {
        animationConfig[0].keyframes.reverse();
        animationConfig[1].keyframes.reverse();
        animationConfig.reverse();
    }
    return {
        in: animationConfig[0],
        out: animationConfig[1]
    };
}

export {TabAnimation, ANIMATION_DURATION};