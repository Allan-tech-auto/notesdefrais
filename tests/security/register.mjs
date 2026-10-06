import { registerHooks, stripTypeScriptTypes } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/worker/') && !/\.[a-z]+$/.test(specifier)) specifier += '.ts';
    return next(specifier, context);
  },
  load(url, context, next) {
    const result = next(url, context);
    if (url.endsWith('.ts')) return { ...result, format: 'module', source: stripTypeScriptTypes(String(result.source)) };
    return result;
  }
});
