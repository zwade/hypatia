import React = require("react");
import { minmax } from "../../utils/utils";

import "./index.scss";

export interface Props {
    firstChild: React.ReactNode;
    secondChild: React.ReactNode;
}

const minCap = 0.33;


export const Divider = (props: Props) => {
    const [firstProportion, setFirstProportion] = React.useState(0.5);
    const [div, setDiv] = React.useState<HTMLDivElement | null>(null);
    const [mouseDown, setMouseDown] = React.useState(false)

    React.useEffect(() => {
        if (mouseDown && div) {
            const divClientRect = div.getClientRects()[0];

            const onMouseMove = (e: MouseEvent) => {
                console.log(e);
                const proportion = minmax((e.x - divClientRect.x) / divClientRect.width, minCap, 1 - minCap);
                setFirstProportion(proportion);
            }

            const onMouseUp = () => {
                setMouseDown(false);
            }

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);

            return () => {
                window.removeEventListener("mousemove", onMouseMove)
                window.removeEventListener("mouseup", onMouseUp)
            }
        }
    }, [mouseDown, div])

    const clientWidth = div?.getClientRects()[0]?.width ?? 0;

    const firstWidth = clientWidth * firstProportion;
    const secondWidth = clientWidth - firstWidth;

    return (
        <div className="divider-container" ref={setDiv}>
            <div
                className="child first-child"
                style={{ width: firstWidth - 3 }}
            >
                { props.firstChild }
            </div>
            <div
                className="divider"
                onMouseDown={() => setMouseDown(true)}
                style={{ left: firstWidth - 11 }}
            />
            <div
                className="child second-child"
                style={{ width: secondWidth }}
            >
                { props.secondChild }
            </div>
        </div>
    )
}