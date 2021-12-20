import * as React from "react";
import * as ReactDOM from "react-dom";
import { classes, PaletteProvider } from "react-pwn";
import { BlueGreen } from "../../utils/palette";

export interface Props {
    segments: {
        name: string;
        onClick: () => void;
    }[];
    children: React.ReactNode;
}

type MenuStatus = { kind: "closed" } | { kind: "open", x: number, y: number };

const portalElement = document.createElement("div");
document.body.appendChild(portalElement);

export const ContextMenu = (props: Props) => {
    const [menuStatus, setMenuStatus] = React.useState<MenuStatus>({ kind: "closed" });

    let menu: React.ReactPortal | undefined = undefined;
    if (menuStatus.kind === "open") {
        const menuElt = (
            <PaletteProvider palette={BlueGreen}>
                <div className={"context-menu"}>
                    <div className="off-click" onClick={() => setMenuStatus({ kind: "closed" })}/>
                    <div className="context-menu-display" style={{ top: menuStatus.y, left: menuStatus.x }}>
                    {
                        props.segments.map(({ name, onClick }) => (
                            <div className="context-menu-segment" onClick={() => { onClick(); setMenuStatus({ kind: "closed" }) }}>
                                { name }
                            </div>
                        ))
                    }
                    </div>
                </div>
            </PaletteProvider>
        );

        menu = ReactDOM.createPortal(menuElt, portalElement);
    }

    return (
        <>
            { menu }
            <div
                onContextMenu={(e) => {
                    setMenuStatus({ kind: "open", x: e.pageX, y: e.pageY });
                    e.preventDefault();
                }}
            >
                { props.children }
            </div>
        </>
    );
}