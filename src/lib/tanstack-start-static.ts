type ServerFunction<TArgs extends unknown[] = [options?: unknown], TResult = unknown> = (
  ...args: TArgs
) => Promise<TResult>;

type ServerFunctionBuilder = {
  middleware: (...args: unknown[]) => ServerFunctionBuilder;
  validator: (...args: unknown[]) => ServerFunctionBuilder;
  handler: <TResult>(handler: (...args: unknown[]) => TResult) => ServerFunction<
    [options?: unknown],
    Awaited<TResult>
  >;
};

export function createServerFn(_options?: unknown): ServerFunctionBuilder {
  let handler: ((...args: unknown[]) => unknown) | undefined;

  const builder: ServerFunctionBuilder = {
    middleware: () => builder,
    validator: () => builder,
    handler: (next) => {
      handler = next;
      return (async (...args: unknown[]) => handler?.(...args)) as ServerFunction;
    },
  };

  return builder;
}

export function useServerFn<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function createMiddleware(_options?: unknown) {
  return {
    server: (handler: unknown) => handler,
  };
}

export function getRequest(): Request | undefined {
  return undefined;
}
