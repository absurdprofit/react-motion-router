interface GestureRegionProps extends React.HTMLAttributes<HTMLDivElement> {
    disabled?: boolean;
}
export default function GestureRegion({disabled, children, ...props}: GestureRegionProps) {
    return (
        <div
            className="gesture-region"
            data-disabled={disabled}
            style={{display: 'contents'}}
            {...props}
        >
            {children}
        </div>
    );
}