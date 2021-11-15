declare module "brython" {
    global {
        const __BRYTHON__: {
            run_script(script: string, fileName: string, locals: string, loop: boolean): void;
            python_to_js(script: string): string;
            py2js(script: string, name: string, url: string): any;
            promise(pythonObj: unknown): Promise<unknown>;
            $getattr(obj: any, attr: string): any;
            handle_error: (e: any) => void;
            loop(): void;

            isNode: boolean;
            file_cache: Record<string, string>;
            tasks: [string, ...any[]][];

            meta_path: unknown[];
            $meta_path: unknown[];
            use_VFS: boolean;
        }
    }
}