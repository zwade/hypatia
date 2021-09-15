import React = require("react");
import { classes } from "react-pwn";
import { minmax } from "../../utils/utils";

import "./index.scss";

export interface Props {
    vertical?: boolean;

    firstChild: React.ReactNode;
    secondChild: React.ReactNode;
}

const minCap = 0.33;
const deadZone = 50;
const fullBarWidth = 16;


export const Divider = (props: Props) => {
    const [firstProportion, setFirstProportion] = React.useState(0.5);
    const [temporaryFirstProportion, setTemporaryFirstProportion] = React.useState(firstProportion);
    const lastProportionRef = React.useRef(firstProportion);

    const [div, setDiv] = React.useState<HTMLDivElement | null>(null);
    const [mouseDown, setMouseDown] = React.useState(false)

    React.useEffect(() => {
        setFirstProportion(0.5);
        setTemporaryFirstProportion(0.5);
        lastProportionRef.current = 0.5;
    }, [props.vertical])

    const axisOfLocation = props.vertical ? "y" : "x";
    const axisOfAlignment = props.vertical ? "top" : "left";
    const axisOfSize = props.vertical ? "height" : "width";

    React.useEffect(() => {
        if (mouseDown && div) {
            const divClientRect = div.getClientRects()[0];

            const onMouseMove = (e: MouseEvent) => {
                const axisSize = e[axisOfLocation] - divClientRect[axisOfLocation]
                const axisMaxSize = divClientRect[axisOfSize];

                const proportion =
                    axisSize < deadZone ? 0 :
                    axisSize > axisMaxSize - deadZone ? 1 :
                    minmax(
                        (e[axisOfLocation] - divClientRect[axisOfLocation]) / divClientRect[axisOfSize],
                        minCap,
                        1 - minCap
                    );

                setTemporaryFirstProportion(proportion);
                lastProportionRef.current = proportion;
            }

            const onMouseUp = () => {
                setMouseDown(false);
                setTemporaryFirstProportion(lastProportionRef.current);
                setFirstProportion(lastProportionRef.current);
            }

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);

            return () => {
                window.removeEventListener("mousemove", onMouseMove)
                window.removeEventListener("mouseup", onMouseUp)
            }
        }
    }, [mouseDown, div])

    const clientSize = div?.getClientRects()[0]?.[axisOfSize] ?? 0;

    const firstSize = clientSize * firstProportion;
    const temporaryFirstSize = clientSize * temporaryFirstProportion;
    const secondSize = clientSize - firstSize;

    const tmpAtCap = temporaryFirstProportion <= minCap || temporaryFirstProportion >= 1 - minCap
    const tmpAtStart = temporaryFirstProportion === 0;
    const tmpAtEnd = temporaryFirstProportion === 1;
    const tmpCollapsed = tmpAtStart || tmpAtEnd;

    const atStart = firstProportion === 0;
    const atEnd = firstProportion === 1;

    return (
        <div
            className={classes("divider-container", props.vertical ? "vertical" : "horizontal")}
            ref={setDiv}
            style={{ "--full-bar-width": `${fullBarWidth}px` } as any}
        >
            <div
                className={classes("child", "first-child", atStart ? "hidden" : undefined)}
                style={{ [axisOfSize]: firstSize  - (atEnd ? fullBarWidth : 0) + (atStart ? fullBarWidth : 0)  }}
            >
                { props.firstChild }
            </div>
            <div
                className={classes(
                    "divider",
                    tmpAtCap && mouseDown ? "limit" : undefined,
                    tmpCollapsed ? "collapsed" : undefined
                )}
                onMouseDown={(e) => { setMouseDown(true); e.preventDefault() }}
                style={{ [axisOfAlignment]: temporaryFirstSize - 8 - (tmpAtEnd ? fullBarWidth : 0) }}
            />
            <div
                className={classes("child", "second-child", atEnd ? "hidden" : undefined)}
                style={{ [axisOfSize]: secondSize - (atStart ? fullBarWidth : 0) + (atEnd ? fullBarWidth : 0) }}
            >
                { props.secondChild }
            </div>
        </div>
    )
}