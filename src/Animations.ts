// animation keyframes for slide left, slide right, slide up, slide down, zoom in, zoom out and fade
const Presets = {
    "slide-right-in": [
        {
            transform: 'translateX(100vw)',
            
        },
        {
            transform: 'translateX(0vw)'
        }
    ],
    "slide-back-right-in": [
        {
            transform: 'translateX(50vw)',
            
        },
        {
            transform: 'translateX(0vw)'
        }
    ],
    "slide-right-out": [
        {
            transform: 'translateX(0vw)'
        },
        {
            transform: 'translateX(-50vw)'
        }
    ],
    "slide-back-right-out": [
        {
            transform: 'translateX(0vw)'
        },
        {
            transform: 'translateX(-100vw)'
        }
    ],
    "slide-left-in": [
        {
            transform: 'translateX(-100vw)'
        },
        {
            transform: 'translateX(0vw)'
        }
    ],
    "slide-back-left-in": [
        {
            transform: 'translateX(-50vw)'
        },
        {
            transform: 'translateX(0vw)'
        }
    ],
    "slide-left-out": [
        {
            transform: 'translateX(0vw)'
        },
        {
            transform: 'translateX(50vw)'
        }
    ],
    "slide-back-left-out": [
        {
            transform: 'translateX(0vw)'
        },
        {
            transform: 'translateX(100vw)'
        }
    ],
    "slide-up-in": [
        {
            transform: 'translateY(100vh)'
        },
        {
            transform: 'translateY(0vh)'
        }
    ],
    "slide-back-up-in": [
        {
            transform: 'translateY(50vh)'
        },
        {
            transform: 'translateY(0vh)'
        }
    ],
    "slide-up-out": [
        {
            transform: 'translateY(0vh)'
        },
        {
            transform: 'translateY(-50vh)'
        }
    ],
    "slide-back-up-out": [
        {
            transform: 'translateY(0vh)'
        },
        {
            transform: 'translateY(-100vh)'
        }
    ],
    "slide-down-in": [
        {
            transform: 'translateY(-100vh)'
        },
        {
            transform: 'translateY(0vh)'
        }
    ],
    "slide-back-down-in": [
        {
            transform: 'translateY(-50vh)'
        },
        {
            transform: 'translateY(0vh)'
        }
    ],
    "slide-down-out": [
        {
            transform: 'translateY(0vh)'
        },
        {
            transform: 'translateY(50vh)'
        }
    ],
    "slide-back-down-out": [
        {
            transform: 'translateY(0vh)'
        },
        {
            transform: 'translateY(100vh)'
        }
    ],
    "zoom-in-in": [
        {
            transform: 'scale(0.85)',
            opacity: 1
        },
        {
            transform: 'scale(1)',
            opacity: 1
        }
    ],
    "zoom-in-out": [
        {
            transform: 'scale(1)',
            opacity: 1
        },
        {
            transform: 'scale(1.15)',
            opacity: 0
        }
    ],
    "zoom-out-in": [
        {
            transform: 'scale(1.15)',
            opacity: 0
        },
        {
            transform: 'scale(1)',
            opacity: 1
        }
    ],
    "zoom-out-out": [
        {
            transform: 'scale(1)',
            opacity: 1
        },
        {
            transform: 'scale(0.85)',
            opacity: 0
        }
    ],
    "fade-in": [
        {
            opacity: 0
        },
        {
            opacity: 1
        }
    ],
    "fade-out": [
        {
            opacity: 1
        },
        {
            opacity: 0
        }
    ],
    "none": []
}

const AnimationKeyframePresets: {[Property in keyof typeof Presets]: Keyframe[]} = Presets;

export default AnimationKeyframePresets;