import * as React from 'react';

export interface Props extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {

}

export const Image = (props: Props) => {
    if (!props.src) return <img {...props}/>;

    const currentURL = new URL(window.location.href);
    const defaultURL = new URL(props.src, currentURL);
    if (defaultURL.origin === currentURL.origin) {
        defaultURL.pathname = "modules/" + defaultURL.pathname;
    }

    return <img {...props} src={defaultURL.toString()}/>
}