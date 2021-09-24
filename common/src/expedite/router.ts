// router.ts
// Forked from @zensors/expedite
// All changes licensed under MIT License

import { M, marshal, Marshaller } from "@zensors/sheriff";
import {
    IRouterHandler,
    IRouterMatcher,
    NextFunction,
    Request,
    RequestHandler,
    Response,
    Router as ExpressRouter
} from "express";

/**
 * An Express request whose params, query, body, and response type are all unknown.
 */
export type UnknownRequest = Request<unknown, unknown, unknown, unknown>;

/**
 * A type consisting of valid HTTP methods, as strings.
 */
export type Method = "get" | "post" | "put" | "delete";

/**
 * A type function that will take a base path, and a route object, and apply the
 * routes as subpaths of the base path
 */
type Subpath<S extends string, Rt> =
    keyof Rt extends string
        ? {
            [P in `${S}${keyof Rt}`]: P extends `${S}${infer Key}` ?
                Rt extends { [k in Key]: unknown } ? Rt[Key] : never
            : never;
        }
        : never;

/**
 * A type witness that allows exporting a type variable from a function
 */
class Witness<T extends UnknownRequest> {};


/**
 * The type of the allowable arguments to the `use` method of an `ExpressRouter`.
 */
type ExpressUsable =
    | (IRouterHandler<any> & IRouterMatcher<any>)
    | (<T extends UnknownRequest>(request: T, response: Response, next: NextFunction) => void)
    | ExpressRouter
    ;

/**
 * A base class for an object that can be consumed (i.e., used in a specified
 * manner only once).
 */
class Consumable {
    /**
     * Whether or not this instance has been consumed.
     */
    private consumed: boolean;

    public constructor() {
        this.consumed = false;
    }

    /**
     * Throws an error if this instance has been consumed.
     */
    protected checkConsumed() {
        if (this.consumed) {
            throw new Error("This Router has already been consumed.");
        }
    }

    /**
     * Throws an error if this instance has been consumed, and otherwise consumes it.
     */
    protected consume() {
        this.checkConsumed();
        this.consumed = true;
    }
}

/**
 * Creates and returns a new `RouterScope`. Intended as a wrapper to match the API of `express.Router`.
 */
export const Router = <S extends UnknownRequest = UnknownRequest, T extends UnknownRequest = S>(router?: ExpressRouter) => {
    return new RouterScope<S, T>(router);
}

/**
 * A `RouterScope` is the primary way of operating Expedite, and provides methods for adding middlewares, adding endpoints,
 * and delegating to other `RouterScope`s.
 */
export class RouterScope<S extends UnknownRequest = UnknownRequest, T extends UnknownRequest = S, Rt = {}> extends Consumable {
    /**
     * The underlying `ExpressRouter` of this instance.
     */
    private router: ExpressRouter;

    /**
     * Constructs a new `RouterScpoe`, either using the given `ExpressRouter` or by instantiating a new one.
     *
     * @param router - the `ExpressRouter` to use
     */
    public constructor(router?: ExpressRouter) {
        super();
        this.router = router ?? ExpressRouter();
    }


    /**
     * Delegates all requests to the given subpath to the given router.  Consumes this router and returns a new one.
     *
     * @param subpath - the subpath
     * @param usable - the router to which to delegate requests
     * @returns a new `Router`
     */
    public use<R extends UnknownRequest, RPrime, P extends string>(subpath: P, router: RouterScope<T, R, RPrime>): RouterScope<S, T, Subpath<P, RPrime> & Rt>;

    /**
     * Delegates all incoming requests to the given router.  Consumes this router and returns a new one.
     *
     * @param usable - the router to which to delegate requests
     * @returns a new `Router`
     */
    public use<R extends UnknownRequest, RPrime>(router: RouterScope<T, R, RPrime>): RouterScope<S, T, RPrime & Rt>;

    /**
     * Delegates all requests to the given subpath to the given middleware.  Consumes this router and returns a new one.
     *
     * @param subpath - the subpath
     * @param usable - the middleware to which to delegate requests
     * @returns a new `Router`
     */
    public use(subpath: string, usable: ExpressUsable): RouterScope<S, T, Rt>;

    /**
     * Delegates all incoming requests to the given middleware.  Consumes this router and returns a new one.
     *
     * @param usable - the middleware to which to delegate requests
     * @returns a new `Router`
     */
    public use(usable: ExpressUsable): RouterScope<S, T, Rt>;

    public use(first: unknown, second?: unknown): RouterScope<S, T, Rt> {
        this.consume();
        if (first instanceof RouterScope) {
            first = first.toExpress();
        }
        if (second instanceof RouterScope) {
            second = second.toExpress();
        }
        this.router.use(first as any, second as any); // unavoidable cast
        return new RouterScope(this.router);
    }


    /**
     * Adds the given function to the request chain for all incoming requests, additionally narrowing the request type.
     * Consumes this router and returns a new one.
     *
     * @param fn - the function to add to the request chain
     * @returns a new `Router`
     */
    public then<T1 extends UnknownRequest>(fn: (req: T) => T1 | Promise<T1>): RouterScope<S, T1, Rt> {
        this.consume();

        this.router.use(async (req, _res, next) => {
            try {
                await fn(req as T);
                next();
            } catch (e) {
                next(e);
            }
        });

        return new RouterScope(this.router);
    }

    /**
     * Adds a new GET endpoint to this router.  Requests matching this endpoint will be delegated to the yielded
     * `Router`, and all non-matching requests will continue on this one. Consumes the router, and returns a new
     * one with this endpoint added.
     *
     * @param path - the path at which to add a GET endpoint
     * @param cb - a function that is psased the LeafRouter for defining endpoint
     * @returns a new `Router` for further definitions
     */
    public get<Path extends string, W extends UnknownRequest>(
        path: Path,
        cb: (router: LeafRouter<T>) => Witness<W>
    ): RouterScope<S, T, Rt & { [key in Path]: { "get": W } }>  {
        this.consume();
        cb(new LeafRouter(this.router, "get", path));
        return new RouterScope(this.router);
    }

    /**
     * Adds a new POST endpoint to this router.  Requests matching this endpoint will be delegated to the yielded
     * `Router`, and all non-matching requests will continue on this one. Consumes the router, and returns a new
     * one with this endpoint added.
     *
     * @param path - the path at which to add a POST endpoint
     * @param cb - a function that is psased the LeafRouter for defining endpoint
     * @returns a new `Router` for further definitions
     */
    public post<Path extends string, W extends UnknownRequest>(
        path: Path,
        cb: (router: LeafRouter<T>) => Witness<W>
    ): RouterScope<S, T, Rt & { [key in Path]: { "post": W } }>  {
        this.consume();
        cb(new LeafRouter(this.router, "post", path));
        return new RouterScope(this.router);
    }

    /**
     * Adds a new PUT endpoint to this router.  Requests matching this endpoint will be delegated to the yielded
     * `Router`, and all non-matching requests will continue on this one. Consumes the router, and returns a new
     * one with this endpoint added.
     *
     * @param path - the path at which to add a PUT endpoint
     * @param cb - a function that is psased the LeafRouter for defining endpoint
     * @returns a new `Router` for further definitions
     */
    public put<Path extends string, W extends UnknownRequest>(
        path: Path,
        cb: (router: LeafRouter<T>) => Witness<W>
    ): RouterScope<S, T, Rt & { [key in Path]: { "put": W } }>  {
        this.consume();
        cb(new LeafRouter(this.router, "put", path));
        return new RouterScope(this.router);
    }

    /**
     * Adds a new DELETE endpoint to this router.  Requests matching this endpoint will be delegated to the yielded
     * `Router`, and all non-matching requests will continue on this one. Consumes the router, and returns a new
     * one with this endpoint added.
     *
     * @param path - the path at which to add a DELETE endpoint
     * @param cb - a function that is psased the LeafRouter for defining endpoint
     * @returns a new `Router` for further definitions
     */
    public delete<Path extends string, W extends UnknownRequest>(
        path: Path,
        cb: (router: LeafRouter<T>) => Witness<W>
    ): RouterScope<S, T, Rt & { [key in Path]: { "delete": W } }>  {
        this.consume();
        cb(new LeafRouter(this.router, "delete", path));
        return new RouterScope(this.router);
    }

    /**
     * Consumes this `Router` and converts it into an `ExpressRouter`.
     *
     * @returns an `ExpressRouter` built from this `Router`
     */
    public toExpress(): ExpressRouter {
        this.consume();
        return this.router;
    }
}


/**
 * A `LeafRouter` represents a router that corresponds to a single endpoint.
 */
class LeafRouter<T extends UnknownRequest> extends Consumable {
    /**
     * The underlying `ExpressRouter` of this instance.
     */
    private router: ExpressRouter;

    /**
     * The HTTP method for this endpoint.
     */
    private method: Method;

    /**
     * The path for this endpoint.
     */
    private path: string;

    /**
     * The function chain for this endpoint.
     */
    private handlers: RequestHandler[];

    /**
     * Constructs a new `LeafRouter` that handles requests to the given path with the given method, backed by the given
     * `ExpressHandler`.  It will use the provided function chain or an empty function chain if none is given.
     *
     * You will probably never need to call this constructor directly; the `get`, `post`, `put`, and `delete` methods
     * of `Router` will do it for you.
     *
     * @param router - the `ExpressRouter` to use
     * @param method - the method of the endpoint
     * @param path - the path of the endpoint
     * @param handlers - the request chain to use
     */
    public constructor(
        router: ExpressRouter,
        method: Method,
        path: string,
        handlers?: RequestHandler[]
    ) {
        super();
        this.router = router;
        this.method = method;
        this.path = path;
        this.handlers = handlers ?? [];
    }

    /**
     * Adds a function to the request chain for this endpoint.  Consumes this `LeafRouter` and returns a new one.
     *
     * @param fn - the function to add
     */
    public then<S extends UnknownRequest>(fn: (req: T) => S | Promise<S>): LeafRouter<S> {
        this.consume();
        return new LeafRouter<S>(
            this.router,
            this.method,
            this.path,
            this.handlers.concat([
                async (req, _res, next) => {
                    try {
                        await fn(req as T);
                        next();
                    } catch (e) {
                        next(e);
                    }
                }
            ])
        );
    }

    /**
     * Finishes the request chain by sending the result of the function to the client as JSON.  Non-JSON endpoints and
     * endpoints that do anything other than just return JSON data (e.g., setting cookies) should use `finish` instead.
     *
     * @param fn - the function whose result will be returned to the client
     */
    public return<S>(fn: (req: T) => S | Promise<S>) {
        this.consume();
        this.router[this.method](
            this.path,
            ...this.handlers,
            async (req, res: Response<S>, next) => {
                try {
                    let reply = await fn(req as T); // unavoidable cast
                    res.json(reply);
                } catch (e) {
                    next(e);
                }
            }
        );
        return new Witness<T & Request<unknown, S, unknown, unknown>>();
    }

    /**
     * Finishes the request chain with a custom finishing function.  The provided function is responsible for returning
     * a response to the client.  If you just want to return JSON without any other operations (e.g. setting cookies),
     * `return` is preferred.
     *
     * @param fn - the function that will finish the request and send the response to the client
     */
    public finish<S>(fn: (req: T, res: Response<S>) => void | Promise<void>) {
        this.consume();
        this.router[this.method](
            this.path,
            ...this.handlers,
            async (req, res, next) => {
                try {
                    return await fn(req as T, res)
                } catch (e) {
                    next(e);
                }
            }
        );
        return new Witness<T & Request<unknown, S, unknown, unknown>>();
    }
}

/**
 * Checks that the request parameters (`req.params`) match the specified marshaller and narrows the request type
 * accordingly.
 *
 * @param description - the marshaller to use with the request parameters
 * @throws if the request parameters do not match the marshaller
 */
export const marshalParams =
    <T>(description: Marshaller<T>) =>
    <R extends UnknownRequest>(req: R) => {
        marshal(req.params, description);
        return req as R & Request<T, unknown, unknown, unknown>;
    };

/**
 * Checks that the request query parameters (`req.query`) match the specified marshaller and narrows the request type
 * accordingly.
 *
 * @param description - the marshaller to use with the request query parameters
 * @throws if the request query parameters do not match the marshaller
 */
export const marshalQuery =
    <T>(description: Marshaller<T>) =>
    <R extends UnknownRequest>(req: R) => {
        marshal(req.query, description);
        return req as R & Request<unknown, unknown, unknown, T>;
    };

/**
 * Checks that the request body (`req.body`) matches the specified marshaller and narrows the request type accordingly.
 *
 * @param description - the marshaller to use with the request body
 * @throws if the request body does not match the marshaller
 */
export const marshalBody =
    <T>(description: Marshaller<T>) =>
    <R extends UnknownRequest>(req: R) => {
        marshal(req.body, description);
        return req as R & Request<unknown, unknown, T, unknown>;
    };