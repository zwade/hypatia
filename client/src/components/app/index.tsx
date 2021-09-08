import { Divider } from "../divider"
import { Lesson } from "../lesson"
import { Terminal } from "../terminal"

export const App = () => {
    return (
        <Divider
            firstChild={<Lesson/>}
            secondChild={<Terminal/>}
        />
    );
}