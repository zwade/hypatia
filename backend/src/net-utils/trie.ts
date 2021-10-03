
const emptySymbol = Symbol("empty");
type TrieNode<T> = { data: T | typeof emptySymbol, subpath: Map<string, TrieNode<T>> };
export class Trie<T> {
    private root: TrieNode<T>;

    public constructor(defaultData: T) {
        this.root = { data: defaultData, subpath: new Map() };
    }

    public add(path: string[], data: T) {
        let node = this.root;
        for (const segment of path) {
            if (!node.subpath.has(segment)) {
                node.subpath.set(segment, { data: emptySymbol, subpath: new Map() });
            }
            node = node.subpath.get(segment)!;
        }
        node.data = data;
    }

    public delete(path: string[]) {
        const deleteRec = (node: TrieNode<T> | undefined, path: string[]) => {
            if (!node) return false;

            if (path.length === 0) {
                node.data = emptySymbol;
                return node.subpath.size === 0;
            }

            const shouldRemove = deleteRec(node.subpath.get(path[0]), path.slice(1));
            if (shouldRemove) {
                node.subpath.delete(path[0]);
            }

            return node.subpath.size === 0 && node.data === emptySymbol;
        }

        deleteRec(this.root, path);
    }

    public find(path: string[], exact?: false): T;
    public find(path: string[], exact: true): T | undefined;
    public find(path: string[], exact = false) {
        let node = this.root;
        let lastSeen = this.root.data as T;
        for (const segment of path) {
            if (node.subpath.has(segment)) {
                node = node.subpath.get(segment)!;
                if (node.data !== emptySymbol) {
                    lastSeen = node.data;
                }
            } else {
                if (exact) {
                    return undefined;
                } else {
                    return lastSeen
                }
            }
        }

        if (exact) {
            return lastSeen === node.data ? lastSeen : undefined;
        } else {
            return lastSeen;
        }
    }
}
