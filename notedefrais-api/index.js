var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// node_modules/jose/dist/browser/runtime/webcrypto.js
var webcrypto_default = crypto;
var isCryptoKey = /* @__PURE__ */ __name((key) => key instanceof CryptoKey, "isCryptoKey");

// node_modules/jose/dist/browser/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");

// node_modules/jose/dist/browser/runtime/base64url.js
var encodeBase64 = /* @__PURE__ */ __name((input) => {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < unencoded.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, unencoded.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}, "encodeBase64");
var encode = /* @__PURE__ */ __name((input) => {
  return encodeBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}, "encode");
var decodeBase64 = /* @__PURE__ */ __name((encoded) => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}, "decodeBase64");
var decode = /* @__PURE__ */ __name((input) => {
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}, "decode");

// node_modules/jose/dist/browser/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  constructor(message2, options) {
    super(message2, options);
    this.code = "ERR_JOSE_GENERIC";
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
JOSEError.code = "ERR_JOSE_GENERIC";
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTClaimValidationFailed.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_EXPIRED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTExpired.code = "ERR_JWT_EXPIRED";
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
  }
};
JOSEAlgNotAllowed.code = "ERR_JOSE_ALG_NOT_ALLOWED";
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_NOT_SUPPORTED";
  }
};
JOSENotSupported.code = "ERR_JOSE_NOT_SUPPORTED";
var JWEDecryptionFailed = class extends JOSEError {
  static {
    __name(this, "JWEDecryptionFailed");
  }
  constructor(message2 = "decryption operation failed", options) {
    super(message2, options);
    this.code = "ERR_JWE_DECRYPTION_FAILED";
  }
};
JWEDecryptionFailed.code = "ERR_JWE_DECRYPTION_FAILED";
var JWEInvalid = class extends JOSEError {
  static {
    __name(this, "JWEInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWE_INVALID";
  }
};
JWEInvalid.code = "ERR_JWE_INVALID";
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWS_INVALID";
  }
};
JWSInvalid.code = "ERR_JWS_INVALID";
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWT_INVALID";
  }
};
JWTInvalid.code = "ERR_JWT_INVALID";
var JWKInvalid = class extends JOSEError {
  static {
    __name(this, "JWKInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWK_INVALID";
  }
};
JWKInvalid.code = "ERR_JWK_INVALID";
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWKS_INVALID";
  }
};
JWKSInvalid.code = "ERR_JWKS_INVALID";
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_NO_MATCHING_KEY";
  }
};
JWKSNoMatchingKey.code = "ERR_JWKS_NO_MATCHING_KEY";
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  }
};
JWKSMultipleMatchingKeys.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  constructor(message2 = "request timed out", options) {
    super(message2, options);
    this.code = "ERR_JWKS_TIMEOUT";
  }
};
JWKSTimeout.code = "ERR_JWKS_TIMEOUT";
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
    this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  }
};
JWSSignatureVerificationFailed.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";

// node_modules/jose/dist/browser/lib/crypto_key.js
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
__name(unusable, "unusable");
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
__name(isAlgorithm, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, ...usages) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "EdDSA": {
      if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
        throw unusable("Ed25519 or Ed448");
      }
      break;
    }
    case "Ed25519": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usages);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/jose/dist/browser/lib/invalid_key_input.js
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalid_key_input_default = /* @__PURE__ */ __name((actual, ...types2) => {
  return message("Key must be ", actual, ...types2);
}, "default");
function withAlg(alg, actual, ...types2) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types2);
}
__name(withAlg, "withAlg");

// node_modules/jose/dist/browser/runtime/is_key_like.js
var is_key_like_default = /* @__PURE__ */ __name((key) => {
  if (isCryptoKey(key)) {
    return true;
  }
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "default");
var types = ["CryptoKey"];

// node_modules/jose/dist/browser/lib/is_disjoint.js
var isDisjoint = /* @__PURE__ */ __name((...headers) => {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}, "isDisjoint");
var is_disjoint_default = isDisjoint;

// node_modules/jose/dist/browser/lib/is_object.js
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
__name(isObjectLike, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");

// node_modules/jose/dist/browser/runtime/check_key_length.js
var check_key_length_default = /* @__PURE__ */ __name((alg, key) => {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}, "default");

// node_modules/jose/dist/browser/lib/is_jwk.js
function isJWK(key) {
  return isObject(key) && typeof key.kty === "string";
}
__name(isJWK, "isJWK");
function isPrivateJWK(key) {
  return key.kty !== "oct" && typeof key.d === "string";
}
__name(isPrivateJWK, "isPrivateJWK");
function isPublicJWK(key) {
  return key.kty !== "oct" && typeof key.d === "undefined";
}
__name(isPublicJWK, "isPublicJWK");
function isSecretJWK(key) {
  return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
}
__name(isSecretJWK, "isSecretJWK");

// node_modules/jose/dist/browser/runtime/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "EdDSA":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
var parse = /* @__PURE__ */ __name(async (jwk) => {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const rest = [
    algorithm,
    jwk.ext ?? false,
    jwk.key_ops ?? keyUsages
  ];
  const keyData = { ...jwk };
  delete keyData.alg;
  delete keyData.use;
  return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
}, "parse");
var jwk_to_key_default = parse;

// node_modules/jose/dist/browser/runtime/normalize_key.js
var exportKeyValue = /* @__PURE__ */ __name((k) => decode(k), "exportKeyValue");
var privCache;
var pubCache;
var isKeyObject = /* @__PURE__ */ __name((key) => {
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "isKeyObject");
var importAndCache = /* @__PURE__ */ __name(async (cache, key, jwk, alg, freeze = false) => {
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "importAndCache");
var normalizePublicKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    delete jwk.d;
    delete jwk.dp;
    delete jwk.dq;
    delete jwk.p;
    delete jwk.q;
    delete jwk.qi;
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(pubCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(pubCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePublicKey");
var normalizePrivateKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(privCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(privCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePrivateKey");
var normalize_key_default = { normalizePublicKey, normalizePrivateKey };

// node_modules/jose/dist/browser/key/import.js
async function importJWK(jwk, alg) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg || (alg = jwk.alg);
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// node_modules/jose/dist/browser/lib/check_key_type.js
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0 && key.use !== "sig") {
    throw new TypeError("Invalid key for this operation, when present its use must be sig");
  }
  if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
    throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (key instanceof Uint8Array)
    return;
  if (allowJwk && isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (allowJwk && isJWK(key)) {
    switch (usage) {
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a private JWK`);
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a public JWK`);
    }
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, allowJwk ? "JSON Web Key" : null));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (usage === "sign" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
  }
  if (usage === "decrypt" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
  }
  if (key.algorithm && usage === "verify" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
  }
  if (key.algorithm && usage === "encrypt" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
  }
}, "asymmetricTypeCheck");
function checkKeyType(allowJwk, alg, key, usage) {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg, key, usage, allowJwk);
  }
}
__name(checkKeyType, "checkKeyType");
var check_key_type_default = checkKeyType.bind(void 0, false);
var checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);

// node_modules/jose/dist/browser/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
var validate_crit_default = validateCrit;

// node_modules/jose/dist/browser/lib/validate_algorithms.js
var validateAlgorithms = /* @__PURE__ */ __name((option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}, "validateAlgorithms");
var validate_algorithms_default = validateAlgorithms;

// node_modules/jose/dist/browser/runtime/subtle_dsa.js
function subtleDsa(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: alg.slice(-3) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
      return { name: "Ed25519" };
    case "EdDSA":
      return { name: algorithm.name };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleDsa, "subtleDsa");

// node_modules/jose/dist/browser/runtime/get_sign_verify_key.js
async function getCryptoKey(alg, key, usage) {
  if (usage === "sign") {
    key = await normalize_key_default.normalizePrivateKey(key, alg);
  }
  if (usage === "verify") {
    key = await normalize_key_default.normalizePublicKey(key, alg);
  }
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage);
    return key;
  }
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key, ...types));
    }
    return webcrypto_default.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  throw new TypeError(invalid_key_input_default(key, ...types, "Uint8Array", "JSON Web Key"));
}
__name(getCryptoKey, "getCryptoKey");

// node_modules/jose/dist/browser/runtime/verify.js
var verify = /* @__PURE__ */ __name(async (alg, key, signature, data) => {
  const cryptoKey = await getCryptoKey(alg, key, "verify");
  check_key_length_default(alg, cryptoKey);
  const algorithm = subtleDsa(alg, cryptoKey.algorithm);
  try {
    return await webcrypto_default.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}, "verify");
var verify_default = verify;

// node_modules/jose/dist/browser/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
    checkKeyTypeWithJwk(alg, key, "verify");
    if (isJWK(key)) {
      key = await importJWK(key, alg);
    }
  } else {
    checkKeyTypeWithJwk(alg, key, "verify");
  }
  const data = concat(encoder.encode(jws.protected ?? ""), encoder.encode("."), typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const verified = await verify_default(alg, key, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/jose/dist/browser/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/jose/dist/browser/lib/epoch.js
var epoch_default = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "default");

// node_modules/jose/dist/browser/lib/secs.js
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = /* @__PURE__ */ __name((str) => {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}, "default");

// node_modules/jose/dist/browser/lib/jwt_claims_set.js
var normalizeTyp = /* @__PURE__ */ __name((value) => value.toLowerCase().replace(/^application\//, ""), "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
var jwt_claims_set_default = /* @__PURE__ */ __name((protectedHeader, encodedPayload, options = {}) => {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs_default(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}, "default");

// node_modules/jose/dist/browser/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/jose/dist/browser/runtime/sign.js
var sign = /* @__PURE__ */ __name(async (alg, key, data) => {
  const cryptoKey = await getCryptoKey(alg, key, "sign");
  check_key_length_default(alg, cryptoKey);
  const signature = await webcrypto_default.subtle.sign(subtleDsa(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}, "sign");
var sign_default = sign;

// node_modules/jose/dist/browser/jws/flattened/sign.js
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this._payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    if (this._protectedHeader) {
      throw new TypeError("setProtectedHeader can only be called once");
    }
    this._protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    if (this._unprotectedHeader) {
      throw new TypeError("setUnprotectedHeader can only be called once");
    }
    this._unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this._protectedHeader && !this._unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this._protectedHeader,
      ...this._unprotectedHeader
    };
    const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this._protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this._protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyTypeWithJwk(alg, key, "sign");
    let payload = this._payload;
    if (b64) {
      payload = encoder.encode(encode(payload));
    }
    let protectedHeader;
    if (this._protectedHeader) {
      protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
    } else {
      protectedHeader = encoder.encode("");
    }
    const data = concat(protectedHeader, encoder.encode("."), payload);
    const signature = await sign_default(alg, key, data);
    const jws = {
      signature: encode(signature),
      payload: ""
    };
    if (b64) {
      jws.payload = decoder.decode(payload);
    }
    if (this._unprotectedHeader) {
      jws.header = this._unprotectedHeader;
    }
    if (this._protectedHeader) {
      jws.protected = decoder.decode(protectedHeader);
    }
    return jws;
  }
};

// node_modules/jose/dist/browser/jws/compact/sign.js
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  constructor(payload) {
    this._flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this._flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this._flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};

// node_modules/jose/dist/browser/jwt/produce.js
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
var ProduceJWT = class {
  static {
    __name(this, "ProduceJWT");
  }
  constructor(payload = {}) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this._payload = payload;
  }
  setIssuer(issuer) {
    this._payload = { ...this._payload, iss: issuer };
    return this;
  }
  setSubject(subject) {
    this._payload = { ...this._payload, sub: subject };
    return this;
  }
  setAudience(audience) {
    this._payload = { ...this._payload, aud: audience };
    return this;
  }
  setJti(jwtId) {
    this._payload = { ...this._payload, jti: jwtId };
    return this;
  }
  setNotBefore(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setExpirationTime(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setIssuedAt(input) {
    if (typeof input === "undefined") {
      this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
    } else if (typeof input === "string") {
      this._payload = {
        ...this._payload,
        iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input))
      };
    } else {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
    }
    return this;
  }
};

// node_modules/jose/dist/browser/jwt/sign.js
var SignJWT = class extends ProduceJWT {
  static {
    __name(this, "SignJWT");
  }
  setProtectedHeader(protectedHeader) {
    this._protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(encoder.encode(JSON.stringify(this._payload)));
    sig.setProtectedHeader(this._protectedHeader);
    if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};

// src/worker/auth.ts
async function hashPassword(password) {
  const encoder2 = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder2.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  const encoder2 = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const storedHashBytes = combined.slice(16);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder2.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  if (hashArray.length !== storedHashBytes.length) return false;
  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== storedHashBytes[i]) return false;
  }
  return true;
}
__name(verifyPassword, "verifyPassword");
async function generateToken(user, secret) {
  const encoder2 = new TextEncoder();
  const secretKey = encoder2.encode(secret);
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    display_name: user.display_name
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secretKey);
  return token;
}
__name(generateToken, "generateToken");
async function verifyToken(token, secret) {
  try {
    const encoder2 = new TextEncoder();
    const secretKey = encoder2.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
async function getUserFromRequest(c, secret) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token, secret);
}
__name(getUserFromRequest, "getUserFromRequest");
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");

// src/worker/db.ts
async function createUser(db, id, email, passwordHash, displayName) {
  const result = await db.prepare(
    "INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?) RETURNING id, email, display_name, created_at"
  ).bind(id, email.toLowerCase(), passwordHash, displayName).first();
  if (!result) {
    throw new Error("Failed to create user");
  }
  return result;
}
__name(createUser, "createUser");
async function getUserByEmail(db, email) {
  return db.prepare("SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = ?").bind(email.toLowerCase()).first();
}
__name(getUserByEmail, "getUserByEmail");
async function getUserById(db, id) {
  return db.prepare("SELECT id, email, display_name, created_at FROM users WHERE id = ?").bind(id).first();
}
__name(getUserById, "getUserById");
async function getMission(db, userId) {
  return db.prepare("SELECT * FROM missions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").bind(userId).first();
}
__name(getMission, "getMission");
async function upsertMission(db, userId, objet, periode) {
  const existing = await getMission(db, userId);
  if (existing) {
    await db.prepare("UPDATE missions SET objet = ?, periode = ?, updated_at = datetime('now') WHERE id = ?").bind(objet, periode, existing.id).run();
    return { ...existing, objet, periode, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  } else {
    const id = crypto.randomUUID();
    await db.prepare("INSERT INTO missions (id, user_id, objet, periode) VALUES (?, ?, ?, ?)").bind(id, userId, objet, periode).run();
    return {
      id,
      user_id: userId,
      objet,
      periode,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
__name(upsertMission, "upsertMission");
async function getExpenses(db, userId) {
  const result = await db.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date ASC, time ASC").bind(userId).all();
  return result.results || [];
}
__name(getExpenses, "getExpenses");
async function getExpenseById(db, id, userId) {
  return db.prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?").bind(id, userId).first();
}
__name(getExpenseById, "getExpenseById");
async function createExpense(db, expense) {
  await db.prepare(
    "INSERT INTO expenses (id, user_id, mission_id, module, date, time, category, amount, description, photo_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    expense.id,
    expense.user_id,
    expense.mission_id,
    expense.module,
    expense.date,
    expense.time,
    expense.category,
    expense.amount,
    expense.description,
    expense.photo_data
  ).run();
  return {
    ...expense,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(createExpense, "createExpense");
async function deleteExpense(db, id, userId) {
  const expense = await getExpenseById(db, id, userId);
  if (!expense) return false;
  await db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").bind(id, userId).run();
  return true;
}
__name(deleteExpense, "deleteExpense");
async function updateExpense(db, id, userId, updates) {
  const existing = await getExpenseById(db, id, userId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await db.prepare(
    "UPDATE expenses SET module = ?, date = ?, time = ?, category = ?, amount = ?, description = ?, photo_data = ? WHERE id = ? AND user_id = ?"
  ).bind(
    updated.module,
    updated.date,
    updated.time,
    updated.category,
    updated.amount,
    updated.description,
    updated.photo_data,
    id,
    userId
  ).run();
  return updated;
}
__name(updateExpense, "updateExpense");
async function updateUserPassword(db, userId, passwordHash) {
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId).run();
}
__name(updateUserPassword, "updateUserPassword");
async function setSecurityQuestion(db, userId, question, answerHash) {
  await db.prepare("UPDATE users SET security_question = ?, security_answer = ? WHERE id = ?").bind(question, answerHash, userId).run();
}
__name(setSecurityQuestion, "setSecurityQuestion");
async function getSecurityQuestion(db, email) {
  const user = await db.prepare("SELECT id, security_question FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (!user || !user.security_question) return null;
  return { userId: user.id, question: user.security_question };
}
__name(getSecurityQuestion, "getSecurityQuestion");
async function verifySecurityAnswer(db, userId) {
  const user = await db.prepare("SELECT security_answer FROM users WHERE id = ?").bind(userId).first();
  return user?.security_answer || null;
}
__name(verifySecurityAnswer, "verifySecurityAnswer");

// src/worker/index.ts
var app = new Hono2();
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: true
}));
app.use("/api/*", async (c, next) => {
  const publicRoutes = ["/api/auth/register", "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/health"];
  if (publicRoutes.some((route) => c.req.path === route)) {
    return next();
  }
  if (c.req.path === "/api/auth/security-question") {
    const user2 = await getUserFromRequest(c, c.env.JWT_SECRET);
    if (user2) c.set("user", user2);
    return next();
  }
  const user = await getUserFromRequest(c, c.env.JWT_SECRET);
  if (!user) {
    return c.json({ error: "Non authentifi\xE9" }, 401);
  }
  c.set("user", user);
  return next();
});
app.post("/api/auth/register", async (c) => {
  try {
    const { email, password, displayName } = await c.req.json();
    if (!email || !password || !displayName) {
      return c.json({ error: "Email, mot de passe et nom requis" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "Le mot de passe doit faire au moins 6 caract\xE8res" }, 400);
    }
    const existing = await getUserByEmail(c.env.DB, email);
    if (existing) {
      return c.json({ error: "Cet email est d\xE9j\xE0 utilis\xE9" }, 409);
    }
    const id = generateId();
    const passwordHash = await hashPassword(password);
    const user = await createUser(c.env.DB, id, email, passwordHash, displayName);
    const token = await generateToken(user, c.env.JWT_SECRET);
    return c.json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "Erreur lors de l'inscription" }, 500);
  }
});
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email et mot de passe requis" }, 400);
    }
    const user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json({ error: "Email ou mot de passe incorrect" }, 401);
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: "Email ou mot de passe incorrect" }, 401);
    }
    const { password_hash, ...userWithoutPassword } = user;
    const token = await generateToken(userWithoutPassword, c.env.JWT_SECRET);
    return c.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Erreur lors de la connexion" }, 500);
  }
});
app.get("/api/auth/me", async (c) => {
  const payload = c.get("user");
  if (!payload) {
    return c.json({ error: "Non authentifi\xE9" }, 401);
  }
  const user = await getUserById(c.env.DB, payload.sub);
  if (!user) {
    return c.json({ error: "Utilisateur non trouv\xE9" }, 404);
  }
  return c.json({ user });
});
app.post("/api/auth/security-question", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Non authentifi\xE9" }, 401);
    }
    const { question, answer } = await c.req.json();
    if (!question || !answer) {
      return c.json({ error: "Question et r\xE9ponse requises" }, 400);
    }
    const answerHash = await hashPassword(answer.toLowerCase().trim());
    await setSecurityQuestion(c.env.DB, user.sub, question, answerHash);
    return c.json({ success: true });
  } catch (error) {
    console.error("Security question error:", error);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
app.post("/api/auth/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email requis" }, 400);
    }
    const data = await getSecurityQuestion(c.env.DB, email);
    if (!data) {
      return c.json({ error: "Aucune question de s\xE9curit\xE9 configur\xE9e pour ce compte" }, 404);
    }
    return c.json({ userId: data.userId, question: data.question });
  } catch (error) {
    console.error("Forgot password error:", error);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
app.post("/api/auth/reset-password", async (c) => {
  try {
    const { userId, answer, newPassword } = await c.req.json();
    if (!userId || !answer || !newPassword) {
      return c.json({ error: "Tous les champs sont requis" }, 400);
    }
    if (newPassword.length < 6) {
      return c.json({ error: "Le mot de passe doit faire au moins 6 caract\xE8res" }, 400);
    }
    const storedHash = await verifySecurityAnswer(c.env.DB, userId);
    if (!storedHash) {
      return c.json({ error: "Utilisateur non trouv\xE9" }, 404);
    }
    const valid = await verifyPassword(answer.toLowerCase().trim(), storedHash);
    if (!valid) {
      return c.json({ error: "R\xE9ponse incorrecte" }, 401);
    }
    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(c.env.DB, userId, passwordHash);
    return c.json({ success: true, message: "Mot de passe r\xE9initialis\xE9 avec succ\xE8s" });
  } catch (error) {
    console.error("Reset password error:", error);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
app.get("/api/mission", async (c) => {
  const user = c.get("user");
  const mission = await getMission(c.env.DB, user.sub);
  return c.json({ mission: mission || { objet: "", periode: "" } });
});
app.put("/api/mission", async (c) => {
  const user = c.get("user");
  const { objet, periode } = await c.req.json();
  const mission = await upsertMission(c.env.DB, user.sub, objet || null, periode || null);
  return c.json({ mission });
});
app.get("/api/expenses", async (c) => {
  const user = c.get("user");
  const expenses = await getExpenses(c.env.DB, user.sub);
  return c.json({ expenses });
});
app.post("/api/expenses", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    if (!body.date || !body.category || typeof body.amount !== "number") {
      return c.json({ error: "Date, cat\xE9gorie et montant requis" }, 400);
    }
    const id = generateId();
    const mission = await getMission(c.env.DB, user.sub);
    const expense = await createExpense(c.env.DB, {
      id,
      user_id: user.sub,
      mission_id: mission?.id || null,
      module: body.module || null,
      date: body.date,
      time: body.time || null,
      category: body.category,
      amount: body.amount,
      description: body.description || null,
      photo_data: body.photo || null
    });
    return c.json({ expense }, 201);
  } catch (error) {
    console.error("Create expense error:", error);
    return c.json({ error: "Erreur lors de la cr\xE9ation de la d\xE9pense" }, 500);
  }
});
app.put("/api/expenses/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = await updateExpense(c.env.DB, id, user.sub, {
      date: body.date,
      time: body.time,
      category: body.category,
      amount: body.amount,
      description: body.description,
      photo_data: body.photo,
      module: body.module
    });
    if (!updated) {
      return c.json({ error: "D\xE9pense non trouv\xE9e" }, 404);
    }
    return c.json({ expense: updated });
  } catch (error) {
    console.error("Update expense error:", error);
    return c.json({ error: "Erreur lors de la modification" }, 500);
  }
});
app.delete("/api/expenses/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const deleted = await deleteExpense(c.env.DB, id, user.sub);
  if (!deleted) {
    return c.json({ error: "D\xE9pense non trouv\xE9e" }, 404);
  }
  return c.json({ success: true });
});
app.post("/api/ocr", async (c) => {
  try {
    const { image } = await c.req.json();
    if (!image) {
      return c.json({ error: "Image requise" }, 400);
    }
    // Retirer le préfixe data-URI si présent
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    if (!base64Data) {
      return c.json({ error: "Format image invalide" }, 400);
    }

    const MODEL_ID = "ac958a08-2d1b-4b43-8e25-6dc9354c5940";
    const ENQUEUE_URL = "https://api-v2.mindee.net/v2/inferences/enqueue";

    // ── 1. Enqueue ──────────────────────────────────────────────
    const enqueueResponse = await fetch(ENQUEUE_URL, {
      method: "POST",
      headers: {
        "Authorization": c.env.MINDEE_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: MODEL_ID,
        file_base64: base64Data
      })
    });

    const enqueueText = await enqueueResponse.text();
    if (!enqueueResponse.ok) {
      console.error("Mindee enqueue error:", enqueueResponse.status, enqueueText);
      return c.json({ error: `Mindee enqueue (${enqueueResponse.status}): ${enqueueText.slice(0, 300)}` }, 500);
    }

    let enqueueData;
    try {
      enqueueData = JSON.parse(enqueueText);
    } catch {
      return c.json({ error: "Réponse enqueue invalide", debug: enqueueText.slice(0, 500) }, 500);
    }

    const pollingUrl = enqueueData.job?.polling_url;
    if (!pollingUrl) {
      return c.json({ error: "polling_url absente", debug: enqueueData }, 500);
    }

    // ── 2. Poll avec redirect: "manual" ─────────────────────────
    // CRITIQUE : ne pas suivre les redirections pour éviter d'envoyer
    // l'Authorization vers S3/GCS ce qui causerait un 403
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const MAX_RETRIES = 40;
    const POLL_INTERVAL_MS = 1500;
    let resultUrl = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const pollResponse = await fetch(pollingUrl, {
        method: "GET",
        headers: { "Authorization": c.env.MINDEE_API_KEY },
        redirect: "manual"
      });

      // Cas A : Mindee renvoie une 302 → Location contient le result_url
      if (pollResponse.status >= 300 && pollResponse.status < 400) {
        const location = pollResponse.headers.get("Location");
        if (location) {
          resultUrl = location;
          break;
        }
      }

      // Cas B : réponse JSON classique
      if (pollResponse.ok) {
        const pollData = await pollResponse.json().catch(() => null);
        if (!pollData) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          continue;
        }
        const status = pollData.job?.status;
        if (status === "Failed") {
          return c.json({ error: "Extraction échouée", debug: pollData.job }, 500);
        }
        if (status === "Processed" || pollData.job?.result_url) {
          resultUrl = pollData.job.result_url;
          if (resultUrl) break;
        }
        // "Processing" ou "Waiting" → on continue
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (!resultUrl) {
      return c.json({ error: "Timeout - traitement trop long", pollingUrl }, 504);
    }

    // ── 3. Récupérer le résultat ────────────────────────────────
    // N'envoyer Authorization QUE si l'URL reste chez mindee.net
    const resultHeaders = {};
    try {
      const hostname = new URL(resultUrl).hostname;
      if (hostname.endsWith("mindee.net") || hostname.endsWith("mindee.com")) {
        resultHeaders["Authorization"] = c.env.MINDEE_API_KEY;
      }
    } catch {
      resultHeaders["Authorization"] = c.env.MINDEE_API_KEY;
    }

    const resultResponse = await fetch(resultUrl, {
      method: "GET",
      headers: resultHeaders
    });

    if (!resultResponse.ok) {
      const errText = await resultResponse.text();
      return c.json({ error: `Mindee result fetch (${resultResponse.status}): ${errText.slice(0, 300)}` }, 500);
    }

    const result = await resultResponse.json();

    // ── 4. Extraire les champs ──────────────────────────────────
    const fields = result.inference?.result?.fields;
    if (!fields) {
      return c.json({ error: "Structure Mindee inattendue", debug: JSON.stringify(result).slice(0, 500) }, 500);
    }

    const v = (name) => {
      const f = fields[name];
      if (!f) return null;
      if (typeof f === "object" && "value" in f) return f.value;
      if (typeof f === "object" && "content" in f) return f.content;
      return f;
    };

    const ocrResult = {
      supplierName: v("supplier_name"),
      date: v("date"),
      time: v("time"),
      totalAmount: v("total_amount"),
      currency: v("currency"),
      category: v("category")
    };

    return c.json(ocrResult);
  } catch (error) {
    console.error("OCR error:", error);
    return c.json({ error: "Erreur lors de l'analyse OCR", detail: error.message }, 500);
  }
});
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var HTML_PAGE = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1\">\n<title>Notes de frais</title>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js\"></script>\n<script>\n  if (window.pdfjsLib) {\n    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';\n  }\n</script>\n<style>\n:root {\n  --module-1: #6366f1;\n  --module-2: #8b5cf6;\n  --module-3: #ec4899;\n  --module-4: #f97316;\n  --module-5: #10b981;\n  --module-6: #0ea5e9;\n  --module-all: #1e293b;\n}\n* { box-sizing: border-box; }\nbody {\n  margin: 0;\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", system-ui, sans-serif;\n  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);\n  color: #1e293b;\n  min-height: 100vh;\n  -webkit-tap-highlight-color: transparent;\n}\nh1, h2, h3 { font-weight: 700; letter-spacing: -0.02em; }\n\n/* Login Screen */\n.login-screen {\n  min-height: 100vh;\n  display: flex; align-items: center; justify-content: center;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  padding: 20px;\n}\n.login-card {\n  background: #fff; padding: 40px 32px;\n  max-width: 420px; width: 100%;\n  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);\n  border-radius: 16px; text-align: center;\n}\n.login-card h1 { font-size: 26px; margin: 16px 0 8px; color: #1e293b; }\n.login-card .subtitle { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }\n.disclaimer { font-size: 11px; color: #94a3b8; margin-top: 24px; line-height: 1.5; }\n\n.form-group { margin-bottom: 16px; text-align: left; }\n.form-group label { display: block; font-size: 13px; color: #475569; margin-bottom: 6px; font-weight: 600; }\n\n.tabs { display: flex; margin-bottom: 24px; background: #f1f5f9; border-radius: 10px; padding: 4px; }\n.tab {\n  flex: 1; padding: 10px; background: none; border: none; cursor: pointer;\n  font-size: 14px; color: #64748b; border-radius: 8px; transition: all 0.2s; font-weight: 500;\n}\n.tab.active { background: #fff; color: #1e293b; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n\n.forgot-link { display: block; text-align: right; font-size: 13px; color: #6366f1; margin-top: 8px; cursor: pointer; font-weight: 500; }\n.forgot-link:hover { text-decoration: underline; }\n\ninput, select, button { font-family: inherit; font-size: 15px; }\ninput[type=text], input[type=email], input[type=password], input[type=number], input[type=date], input[type=time], select {\n  width: 100%; padding: 12px 14px;\n  border: 2px solid #e2e8f0; border-radius: 10px;\n  background: #fff; font-size: 15px;\n  transition: border-color 0.2s, box-shadow 0.2s;\n}\ninput:focus, select:focus {\n  outline: none; border-color: #6366f1;\n  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);\n}\nlabel {\n  display: flex; align-items: center; gap: 6px;\n  font-size: 13px; color: #475569; margin-bottom: 6px; font-weight: 600;\n}\n\n.btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 8px;\n  padding: 12px 20px; font-size: 14px;\n  border: none; border-radius: 10px; cursor: pointer;\n  font-weight: 600; transition: all 0.2s;\n}\n.btn:hover { transform: translateY(-1px); }\n.btn:active { transform: translateY(0); }\n.btn-primary {\n  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);\n  color: #fff;\n  box-shadow: 0 4px 14px rgba(99,102,241,0.4);\n}\n.btn-primary:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.5); }\n.btn-secondary { background: #fff; color: #1e293b; border: 2px solid #e2e8f0; }\n.btn-secondary:hover { border-color: #6366f1; color: #6366f1; }\n.btn-ghost { background: #f1f5f9; color: #475569; border: none; }\n.btn-ghost:hover { background: #e2e8f0; }\n.btn-small { padding: 8px 14px; font-size: 13px; }\n.btn-full { width: 100%; }\n.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }\n\n/* App Layout */\n.app { display: none; }\nheader.app-header {\n  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);\n  padding: 16px 20px;\n  display: flex; justify-content: space-between; align-items: center;\n  position: sticky; top: 0; z-index: 100;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.15);\n}\n.brand {\n  display: flex; align-items: center; gap: 10px;\n  font-weight: 700; font-size: 18px; color: #fff;\n}\n.user-info { display: flex; align-items: center; gap: 10px; color: #cbd5e1; font-size: 14px; }\n.icon-btn {\n  background: rgba(255,255,255,0.1); border: none; padding: 8px 12px; cursor: pointer;\n  color: #fff; display: inline-flex; align-items: center; font-size: 14px;\n  border-radius: 8px; transition: background 0.2s;\n}\n.icon-btn:hover { background: rgba(255,255,255,0.2); }\n\nmain { max-width: 960px; margin: 0 auto; padding: 24px 16px 80px; }\n\n/* Module Tabs */\n.module-tabs {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 20px;\n  overflow-x: auto;\n  padding: 4px 0 8px;\n  -webkit-overflow-scrolling: touch;\n}\n.module-tab {\n  padding: 10px 18px;\n  background: #fff;\n  border: 2px solid #e2e8f0;\n  border-radius: 25px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: all 0.2s;\n  color: #64748b;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.05);\n}\n.module-tab:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }\n.module-tab[data-module=\"\"] { border-color: var(--module-all); color: var(--module-all); }\n.module-tab[data-module=\"Module 1\"] { border-color: var(--module-1); color: var(--module-1); }\n.module-tab[data-module=\"Module 2\"] { border-color: var(--module-2); color: var(--module-2); }\n.module-tab[data-module=\"Module 3\"] { border-color: var(--module-3); color: var(--module-3); }\n.module-tab[data-module=\"Module 4\"] { border-color: var(--module-4); color: var(--module-4); }\n.module-tab[data-module=\"Module 5\"] { border-color: var(--module-5); color: var(--module-5); }\n.module-tab[data-module=\"Module 6\"] { border-color: var(--module-6); color: var(--module-6); }\n\n.module-tab.active {\n  color: #fff !important;\n  border-color: transparent !important;\n  box-shadow: 0 4px 14px rgba(0,0,0,0.2);\n}\n.module-tab.active[data-module=\"\"] { background: var(--module-all); }\n.module-tab.active[data-module=\"Module 1\"] { background: var(--module-1); }\n.module-tab.active[data-module=\"Module 2\"] { background: var(--module-2); }\n.module-tab.active[data-module=\"Module 3\"] { background: var(--module-3); }\n.module-tab.active[data-module=\"Module 4\"] { background: var(--module-4); }\n.module-tab.active[data-module=\"Module 5\"] { background: var(--module-5); }\n.module-tab.active[data-module=\"Module 6\"] { background: var(--module-6); }\n\n.module-tab .tab-count {\n  display: inline-block;\n  background: rgba(0,0,0,0.1);\n  padding: 2px 8px;\n  border-radius: 12px;\n  font-size: 11px;\n  margin-left: 6px;\n}\n.module-tab.active .tab-count { background: rgba(255,255,255,0.25); }\n\n/* Cards */\n.card {\n  background: #fff; padding: 24px;\n  margin-bottom: 20px;\n  border: none; border-radius: 16px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n}\n.section-title {\n  font-size: 13px; font-weight: 700; text-transform: uppercase;\n  letter-spacing: 0.05em; color: #64748b; margin: 0 0 16px;\n}\n.form-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n  gap: 16px;\n}\n.full-row { grid-column: 1 / -1; }\n\n/* Summary Grid */\n.summary-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));\n  gap: 12px;\n  margin-bottom: 20px;\n}\n.summary-card {\n  background: #fff; padding: 16px;\n  border-radius: 14px;\n  border-left: 4px solid;\n  box-shadow: 0 2px 10px rgba(0,0,0,0.06);\n  transition: transform 0.2s;\n}\n.summary-card:hover { transform: translateY(-2px); }\n.summary-icon { font-size: 22px; }\n.summary-label {\n  font-size: 11px; color: #64748b; text-transform: uppercase;\n  letter-spacing: 0.03em; margin-top: 8px; font-weight: 600;\n}\n.summary-amount {\n  font-size: 22px; font-weight: 800;\n  margin-top: 4px; letter-spacing: -0.02em;\n}\n.summary-count { font-size: 11px; color: #94a3b8; margin-top: 2px; }\n.total-card {\n  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);\n  border-color: #6366f1 !important;\n  color: #fff;\n}\n.total-card .summary-label { color: #94a3b8; }\n.total-card .summary-count { color: #64748b; }\n\n/* Action Buttons */\n.action-row {\n  display: flex; gap: 12px; flex-wrap: wrap;\n  margin-bottom: 20px;\n}\n.action-row .btn { flex: 1; min-width: 150px; }\n\n/* Messages */\n.error, .info, .success-msg {\n  padding: 14px 18px; border-radius: 12px;\n  margin-bottom: 16px; font-size: 14px;\n  display: none; font-weight: 500;\n}\n.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }\n.info { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }\n.success-msg { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }\n.error.show, .info.show, .success-msg.show { display: block; }\n\n/* Photo Preview & OCR */\n.photo-preview { margin-top: 12px; text-align: center; }\n.photo-preview img {\n  max-width: 100%; max-height: 240px;\n  border-radius: 12px; border: 2px solid #e2e8f0;\n}\n\n.ocr-status {\n  margin-top: 12px; padding: 14px;\n  background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%);\n  border: 1px solid #fcd34d;\n  border-radius: 12px; font-size: 14px; color: #92400e;\n  display: none;\n}\n.ocr-status.show { display: block; }\n.ocr-status.success {\n  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);\n  border-color: #34d399; color: #065f46;\n}\n\n.progress-bar {\n  height: 6px; background: #fde68a; border-radius: 3px; margin-top: 8px;\n  overflow: hidden;\n}\n.progress-bar-fill {\n  height: 100%; background: linear-gradient(90deg, #f59e0b, #d97706);\n  width: 0%; transition: width 0.3s;\n  border-radius: 3px;\n}\n\n/* Expense List */\n.expense-list { display: flex; flex-direction: column; gap: 10px; }\n.expense-row {\n  display: flex; align-items: center; gap: 14px;\n  background: #fff; padding: 14px 16px;\n  border-radius: 14px;\n  cursor: pointer;\n  transition: all 0.2s;\n  box-shadow: 0 2px 8px rgba(0,0,0,0.06);\n  border-left: 4px solid #e2e8f0;\n}\n.expense-row:hover {\n  transform: translateX(4px);\n  box-shadow: 0 4px 16px rgba(0,0,0,0.1);\n}\n.expense-row[data-module=\"Module 1\"] { border-left-color: var(--module-1); }\n.expense-row[data-module=\"Module 2\"] { border-left-color: var(--module-2); }\n.expense-row[data-module=\"Module 3\"] { border-left-color: var(--module-3); }\n.expense-row[data-module=\"Module 4\"] { border-left-color: var(--module-4); }\n.expense-row[data-module=\"Module 5\"] { border-left-color: var(--module-5); }\n.expense-row[data-module=\"Module 6\"] { border-left-color: var(--module-6); }\n\n.cat-badge {\n  width: 40px; height: 40px; border-radius: 12px;\n  display: flex; align-items: center; justify-content: center;\n  flex-shrink: 0; color: #fff; font-size: 18px;\n}\n.thumb {\n  width: 50px; height: 50px; object-fit: cover;\n  border-radius: 10px; border: 2px solid #e2e8f0; flex-shrink: 0;\n  background: #f1f5f9;\n}\n.expense-info { flex: 1; min-width: 0; }\n.expense-date { font-size: 14px; font-weight: 700; color: #1e293b; }\n.expense-desc {\n  font-size: 13px; color: #64748b;\n  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n  margin-top: 2px;\n}\n.expense-amount {\n  font-weight: 800; font-size: 18px; flex-shrink: 0;\n  color: #1e293b;\n}\n.expense-actions { display: flex; gap: 4px; }\n.edit-btn, .delete-btn {\n  background: #f1f5f9; border: none; color: #64748b;\n  cursor: pointer; padding: 8px; font-size: 14px;\n  border-radius: 8px; transition: all 0.2s;\n}\n.edit-btn:hover { background: #dbeafe; color: #2563eb; }\n.delete-btn:hover { background: #fee2e2; color: #dc2626; }\n\n.module-badge {\n  display: inline-block;\n  padding: 2px 8px;\n  border-radius: 6px;\n  font-size: 10px;\n  font-weight: 700;\n  margin-left: 8px;\n  color: #fff;\n}\n.module-badge.m1 { background: var(--module-1); }\n.module-badge.m2 { background: var(--module-2); }\n.module-badge.m3 { background: var(--module-3); }\n.module-badge.m4 { background: var(--module-4); }\n.module-badge.m5 { background: var(--module-5); }\n.module-badge.m6 { background: var(--module-6); }\n\n.empty {\n  background: #fff; padding: 48px 24px; text-align: center;\n  color: #64748b; border-radius: 16px;\n  font-size: 15px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n}\n.empty::before {\n  content: '📋';\n  display: block;\n  font-size: 48px;\n  margin-bottom: 16px;\n}\n\nfooter.app-footer {\n  margin-top: 40px; padding: 24px 0;\n  border-top: 2px solid #e2e8f0;\n  font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;\n}\n\n.hidden { display: none !important; }\n\n/* Mobile optimizations */\n@media (max-width: 640px) {\n  .module-tabs { gap: 6px; }\n  .module-tab { padding: 8px 12px; font-size: 12px; }\n  .expense-row { padding: 12px; gap: 10px; }\n  .thumb { width: 40px; height: 40px; }\n  .cat-badge { width: 36px; height: 36px; font-size: 16px; }\n}\n</style>\n</head>\n<body>\n\n<div id=\"login-screen\" class=\"login-screen\">\n  <div class=\"login-card\">\n    <div style=\"font-size: 48px;\">🧾</div>\n    <h1>Notes de frais</h1>\n    <p class=\"subtitle\">\n      Outil de suivi des dépenses professionnelles avec OCR.<br>\n      Vos données sont synchronisées sur le cloud.\n    </p>\n\n    <div class=\"tabs\">\n      <button class=\"tab active\" data-tab=\"login\">Connexion</button>\n      <button class=\"tab\" data-tab=\"register\">Inscription</button>\n    </div>\n\n    <div id=\"login-form\">\n      <div class=\"form-group\">\n        <label>Email</label>\n        <input type=\"email\" id=\"login-email\" placeholder=\"votre@email.com\" autocomplete=\"email\">\n      </div>\n      <div class=\"form-group\">\n        <label>Mot de passe</label>\n        <input type=\"password\" id=\"login-password\" placeholder=\"••••••••\" autocomplete=\"current-password\">\n        <span class=\"forgot-link\" id=\"forgot-link\">Mot de passe oublié ?</span>\n      </div>\n      <div class=\"error\" id=\"login-error\"></div>\n      <button class=\"btn btn-primary btn-full\" id=\"login-btn\">Se connecter</button>\n    </div>\n\n    <div id=\"register-form\" class=\"hidden\">\n      <div class=\"form-group\">\n        <label>Nom complet</label>\n        <input type=\"text\" id=\"register-name\" placeholder=\"Prénom Nom\" autocomplete=\"name\">\n      </div>\n      <div class=\"form-group\">\n        <label>Email</label>\n        <input type=\"email\" id=\"register-email\" placeholder=\"votre@email.com\" autocomplete=\"email\">\n      </div>\n      <div class=\"form-group\">\n        <label>Mot de passe (6 caractères min.)</label>\n        <input type=\"password\" id=\"register-password\" placeholder=\"••••••••\" autocomplete=\"new-password\">\n      </div>\n      <div class=\"form-group\">\n        <label>Question de récupération</label>\n        <select id=\"register-question\">\n          <option value=\"Nom de votre premier animal ?\">Nom de votre premier animal ?</option>\n          <option value=\"Ville de naissance de votre mère ?\">Ville de naissance de votre mère ?</option>\n          <option value=\"Nom de votre école primaire ?\">Nom de votre école primaire ?</option>\n          <option value=\"Prénom de votre meilleur ami d'enfance ?\">Prénom de votre meilleur ami d'enfance ?</option>\n        </select>\n      </div>\n      <div class=\"form-group\">\n        <label>Réponse secrète</label>\n        <input type=\"text\" id=\"register-answer\" placeholder=\"Votre réponse\">\n      </div>\n      <div class=\"error\" id=\"register-error\"></div>\n      <button class=\"btn btn-primary btn-full\" id=\"register-btn\">Créer un compte</button>\n    </div>\n\n    <div id=\"forgot-form\" class=\"hidden\">\n      <div id=\"forgot-step1\">\n        <div class=\"form-group\">\n          <label>Email de votre compte</label>\n          <input type=\"email\" id=\"forgot-email\" placeholder=\"votre@email.com\">\n        </div>\n        <div class=\"error\" id=\"forgot-error\"></div>\n        <button class=\"btn btn-primary btn-full\" id=\"forgot-btn\">Continuer</button>\n        <div style=\"height: 10px;\"></div>\n        <button class=\"btn btn-ghost btn-full\" id=\"forgot-back\">Retour à la connexion</button>\n      </div>\n      <div id=\"forgot-step2\" class=\"hidden\">\n        <input type=\"hidden\" id=\"reset-user-id\">\n        <div class=\"form-group\">\n          <label id=\"reset-question-label\">Question de sécurité</label>\n          <p id=\"reset-question-text\" style=\"font-weight: 600; margin: 4px 0 12px;\"></p>\n        </div>\n        <div class=\"form-group\">\n          <label>Votre réponse</label>\n          <input type=\"text\" id=\"reset-answer\" placeholder=\"Réponse secrète\">\n        </div>\n        <div class=\"form-group\">\n          <label>Nouveau mot de passe</label>\n          <input type=\"password\" id=\"reset-password\" placeholder=\"••••••••\">\n        </div>\n        <div class=\"error\" id=\"reset-error\"></div>\n        <div class=\"success-msg\" id=\"reset-success\"></div>\n        <button class=\"btn btn-primary btn-full\" id=\"reset-btn\">Réinitialiser</button>\n      </div>\n    </div>\n\n    <p class=\"disclaimer\">\n      ⚠️ Cet outil n'a pas de valeur probante légale. Conservez les justificatifs originaux.\n    </p>\n  </div>\n</div>\n\n<div id=\"app\" class=\"app\">\n  <header class=\"app-header\">\n    <div class=\"brand\">🧾 <span>Notes de frais</span></div>\n    <div class=\"user-info\">\n      <span id=\"user-display\"></span>\n      <button class=\"icon-btn\" id=\"logout-btn\" title=\"Se déconnecter\">↩</button>\n    </div>\n  </header>\n\n  <main>\n    <div class=\"card\">\n      <div class=\"section-title\">Informations de la mission</div>\n      <div class=\"form-grid\">\n        <div>\n          <label>Module</label>\n          <select id=\"mission-module\">\n            <option value=\"\">-- Sélectionner --</option>\n            <option value=\"Module 1\">Module 1</option>\n            <option value=\"Module 2\">Module 2</option>\n            <option value=\"Module 3\">Module 3</option>\n            <option value=\"Module 4\">Module 4</option>\n            <option value=\"Module 5\">Module 5</option>\n            <option value=\"Module 6\">Module 6</option>\n          </select>\n        </div>\n        <div>\n          <label>Lieu</label>\n          <select id=\"mission-lieu\">\n            <option value=\"Rennes\">Rennes</option>\n            <option value=\"Télétravail\">Télétravail</option>\n          </select>\n        </div>\n        <div>\n          <label>Période</label>\n          <input type=\"text\" id=\"mission-periode\" placeholder=\"Auto-rempli selon le module\" readonly>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"module-tabs\" id=\"module-tabs\">\n      <button class=\"module-tab active\" data-module=\"\">Tous</button>\n      <button class=\"module-tab\" data-module=\"Module 1\">Module 1</button>\n      <button class=\"module-tab\" data-module=\"Module 2\">Module 2</button>\n      <button class=\"module-tab\" data-module=\"Module 3\">Module 3</button>\n      <button class=\"module-tab\" data-module=\"Module 4\">Module 4</button>\n      <button class=\"module-tab\" data-module=\"Module 5\">Module 5</button>\n      <button class=\"module-tab\" data-module=\"Module 6\">Module 6</button>\n    </div>\n\n    <div class=\"summary-grid\" id=\"summary-grid\"></div>\n\n    <div class=\"error\" id=\"error-box\"></div>\n    <div class=\"info\" id=\"info-box\"></div>\n\n    <div class=\"action-row\">\n      <button class=\"btn btn-primary\" id=\"add-btn\">+ Nouvelle dépense</button>\n      <button class=\"btn btn-secondary\" id=\"export-btn\">⬇ Exporter en PDF</button>\n    </div>\n\n    <div class=\"card hidden\" id=\"form-card\">\n      <div class=\"section-title\" id=\"form-title\">Nouvelle dépense</div>\n      <input type=\"hidden\" id=\"form-expense-id\">\n      <div class=\"form-grid\">\n        <div class=\"full-row\">\n          <label>📷 Photo, image ou PDF du justificatif</label>\n          <input type=\"file\" id=\"form-photo\" accept=\"image/*,application/pdf\" style=\"display: none;\">\n          <div style=\"display: flex; gap: 8px; flex-wrap: wrap;\">\n            <button type=\"button\" class=\"btn btn-ghost\" id=\"camera-btn\" style=\"flex: 1; min-width: 110px;\">📷 Photo</button>\n            <button type=\"button\" class=\"btn btn-ghost\" id=\"gallery-btn\" style=\"flex: 1; min-width: 110px;\">🖼 Galerie</button>\n            <button type=\"button\" class=\"btn btn-ghost\" id=\"pdf-btn\" style=\"flex: 1; min-width: 110px;\">📄 PDF</button>\n          </div>\n          <div class=\"photo-preview hidden\" id=\"photo-preview\">\n            <img id=\"preview-img\" alt=\"Aperçu\">\n          </div>\n          <div class=\"ocr-status\" id=\"ocr-status\">\n            <div id=\"ocr-message\">Lecture du ticket en cours…</div>\n            <div class=\"progress-bar\"><div class=\"progress-bar-fill\" id=\"ocr-progress\"></div></div>\n          </div>\n        </div>\n        <div>\n          <label>📅 Date</label>\n          <input type=\"date\" id=\"form-date\">\n        </div>\n        <div>\n          <label>🕐 Heure</label>\n          <input type=\"time\" id=\"form-time\">\n        </div>\n        <div>\n          <label>Catégorie</label>\n          <select id=\"form-category\">\n            <option value=\"taxi\">🚖 Taxi / VTC</option>\n            <option value=\"bus\">🚌 Bus</option>\n            <option value=\"metro\">🚇 Métro</option>\n            <option value=\"train\">🚆 Train</option>\n            <option value=\"petit_dej\">☕ Petit-déjeuner</option>\n            <option value=\"dejeuner\">🍽 Déjeuner</option>\n            <option value=\"diner\">🌙 Dîner</option>\n            <option value=\"repas\">🍴 Repas (autre)</option>\n            <option value=\"logement\">🏨 Logement</option>\n            <option value=\"autre\">📦 Autre</option>\n          </select>\n        </div>\n        <div>\n          <label>€ Montant TTC</label>\n          <input type=\"number\" step=\"0.01\" min=\"0\" id=\"form-amount\" placeholder=\"0,00\" inputmode=\"decimal\">\n        </div>\n        <div>\n          <label>📁 Module</label>\n          <select id=\"form-module\">\n            <option value=\"\">-- Aucun --</option>\n            <option value=\"Module 1\">Module 1</option>\n            <option value=\"Module 2\">Module 2</option>\n            <option value=\"Module 3\">Module 3</option>\n            <option value=\"Module 4\">Module 4</option>\n            <option value=\"Module 5\">Module 5</option>\n            <option value=\"Module 6\">Module 6</option>\n          </select>\n        </div>\n        <div class=\"full-row\">\n          <label>Description (optionnel)</label>\n          <input type=\"text\" id=\"form-description\" placeholder=\"Ex : Taxi gare → hôtel\">\n        </div>\n      </div>\n      <div style=\"display: flex; gap: 8px; margin-top: 16px;\">\n        <button class=\"btn btn-primary\" id=\"save-btn\">Ajouter</button>\n        <button class=\"btn btn-ghost\" id=\"cancel-btn\">Annuler</button>\n      </div>\n    </div>\n\n    <div class=\"section-title\" style=\"margin-top: 18px;\">📋 Détail des dépenses (<span id=\"expense-count\">0</span>)</div>\n    <div id=\"expense-list-container\"></div>\n\n    <footer class=\"app-footer\">\n      Cet outil n'a pas de valeur probante légale.<br>\n      Conservez les justificatifs originaux pour votre RH.\n    </footer>\n  </main>\n</div>\n\n<script>\n'use strict';\n\n// ============== Configuration ==============\nconst API_BASE = '/api';\n\nconst MODULES = {\n  'Module 1': '9 au 13 mars 2026',\n  'Module 2': '18 au 22 mai 2026',\n  'Module 3': '15 au 19 juin 2026',\n  'Module 4': '7 au 11 septembre 2026',\n  'Module 5': '5 au 9 octobre 2026',\n  'Module 6': '7 au 11 décembre 2026'\n};\n\nconst CATEGORIES = {\n  taxi:      { label: 'Taxi / VTC',       icon: '🚖', color: '#d97706' },\n  bus:       { label: 'Bus',              icon: '🚌', color: '#0891b2' },\n  metro:     { label: 'Métro',            icon: '🚇', color: '#0e7490' },\n  train:     { label: 'Train',            icon: '🚆', color: '#0369a1' },\n  petit_dej: { label: 'Petit-déjeuner',   icon: '☕', color: '#ca8a04' },\n  dejeuner:  { label: 'Déjeuner',         icon: '🍽',  color: '#dc2626' },\n  diner:     { label: 'Dîner',            icon: '🌙', color: '#7c3aed' },\n  repas:     { label: 'Repas',            icon: '🍴', color: '#e11d48' },\n  logement:  { label: 'Logement',         icon: '🏨', color: '#2563eb' },\n  autre:     { label: 'Autre',            icon: '📦', color: '#6b7280' },\n};\n\nconst SUMMARY_ORDER = ['taxi', 'bus', 'metro', 'train', 'petit_dej', 'dejeuner', 'diner', 'repas', 'logement', 'autre'];\n\nlet currentUser = null;\nlet authToken = null;\nlet expenses = [];\nlet missionInfo = { objet: '', periode: '' };\nlet formPhoto = null;\nlet editingExpenseId = null;\nlet selectedModule = ''; // Filtre par module (vide = tous)\n\n// ============== Storage (Token uniquement) ==============\nfunction getToken() {\n  try { return localStorage.getItem('auth_token'); } catch { return null; }\n}\nfunction setToken(token) {\n  try { localStorage.setItem('auth_token', token); } catch {}\n}\nfunction clearToken() {\n  try { localStorage.removeItem('auth_token'); } catch {}\n}\n\n// ============== API Helpers ==============\nasync function api(path, options = {}) {\n  const headers = {\n    'Content-Type': 'application/json',\n    ...options.headers\n  };\n\n  if (authToken) {\n    headers['Authorization'] = `Bearer ${authToken}`;\n  }\n\n  const response = await fetch(API_BASE + path, {\n    ...options,\n    headers\n  });\n\n  const data = await response.json();\n\n  if (!response.ok) {\n    throw new Error(data.error || 'Erreur serveur');\n  }\n\n  return data;\n}\n\n// ============== UI helpers ==============\nfunction showError(msg) {\n  const box = document.getElementById('error-box');\n  box.textContent = '⚠ ' + msg;\n  box.classList.add('show');\n  setTimeout(() => box.classList.remove('show'), 5000);\n}\n\nfunction showInfo(msg) {\n  const box = document.getElementById('info-box');\n  box.textContent = 'ℹ ' + msg;\n  box.classList.add('show');\n  setTimeout(() => box.classList.remove('show'), 4000);\n}\n\nfunction showLoginError(msg) {\n  const box = document.getElementById('login-error');\n  box.textContent = '⚠ ' + msg;\n  box.classList.add('show');\n}\n\nfunction showRegisterError(msg) {\n  const box = document.getElementById('register-error');\n  box.textContent = '⚠ ' + msg;\n  box.classList.add('show');\n}\n\nfunction clearAuthErrors() {\n  document.querySelectorAll('.error, .success-msg').forEach(el => el.classList.remove('show'));\n}\n\n// ============== Auth ==============\nasync function login() {\n  clearAuthErrors();\n  const email = document.getElementById('login-email').value.trim();\n  const password = document.getElementById('login-password').value;\n\n  if (!email || !password) {\n    showLoginError('Email et mot de passe requis');\n    return;\n  }\n\n  const btn = document.getElementById('login-btn');\n  btn.disabled = true;\n  btn.textContent = 'Connexion...';\n\n  try {\n    const data = await api('/auth/login', {\n      method: 'POST',\n      body: JSON.stringify({ email, password })\n    });\n\n    authToken = data.token;\n    currentUser = data.user;\n    setToken(authToken);\n    await loadUserData();\n    showApp();\n  } catch (e) {\n    showLoginError(e.message);\n  } finally {\n    btn.disabled = false;\n    btn.textContent = 'Se connecter';\n  }\n}\n\nasync function register() {\n  clearAuthErrors();\n  const displayName = document.getElementById('register-name').value.trim();\n  const email = document.getElementById('register-email').value.trim();\n  const password = document.getElementById('register-password').value;\n  const question = document.getElementById('register-question').value;\n  const answer = document.getElementById('register-answer').value.trim();\n\n  if (!displayName || !email || !password || !answer) {\n    showRegisterError('Tous les champs sont requis');\n    return;\n  }\n\n  if (password.length < 6) {\n    showRegisterError('Le mot de passe doit faire au moins 6 caractères');\n    return;\n  }\n\n  const btn = document.getElementById('register-btn');\n  btn.disabled = true;\n  btn.textContent = 'Création...';\n\n  try {\n    const data = await api('/auth/register', {\n      method: 'POST',\n      body: JSON.stringify({ email, password, displayName })\n    });\n\n    authToken = data.token;\n    currentUser = data.user;\n    setToken(authToken);\n\n    // Définir la question de sécurité\n    await api('/auth/security-question', {\n      method: 'POST',\n      body: JSON.stringify({ question, answer })\n    });\n\n    await loadUserData();\n    showApp();\n  } catch (e) {\n    showRegisterError(e.message);\n  } finally {\n    btn.disabled = false;\n    btn.textContent = 'Créer un compte';\n  }\n}\n\nfunction logout() {\n  clearToken();\n  authToken = null;\n  currentUser = null;\n  expenses = [];\n  missionInfo = { objet: '', periode: '' };\n  document.getElementById('login-email').value = '';\n  document.getElementById('login-password').value = '';\n  document.getElementById('app').style.display = 'none';\n  document.getElementById('login-screen').style.display = 'flex';\n  showLoginForm();\n}\n\n// ============== Password Reset ==============\nfunction showForgotForm() {\n  document.getElementById('login-form').classList.add('hidden');\n  document.getElementById('register-form').classList.add('hidden');\n  document.getElementById('forgot-form').classList.remove('hidden');\n  document.getElementById('forgot-step1').classList.remove('hidden');\n  document.getElementById('forgot-step2').classList.add('hidden');\n  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));\n  clearAuthErrors();\n}\n\nfunction showLoginForm() {\n  document.getElementById('login-form').classList.remove('hidden');\n  document.getElementById('register-form').classList.add('hidden');\n  document.getElementById('forgot-form').classList.add('hidden');\n  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));\n  document.querySelector('[data-tab=\"login\"]').classList.add('active');\n  clearAuthErrors();\n}\n\nasync function forgotPassword() {\n  clearAuthErrors();\n  const email = document.getElementById('forgot-email').value.trim();\n\n  if (!email) {\n    document.getElementById('forgot-error').textContent = '⚠ Email requis';\n    document.getElementById('forgot-error').classList.add('show');\n    return;\n  }\n\n  const btn = document.getElementById('forgot-btn');\n  btn.disabled = true;\n  btn.textContent = 'Chargement...';\n\n  try {\n    const data = await api('/auth/forgot-password', {\n      method: 'POST',\n      body: JSON.stringify({ email })\n    });\n\n    // Affiche la question de sécurité\n    document.getElementById('reset-user-id').value = data.userId;\n    document.getElementById('reset-question-text').textContent = data.question;\n\n    document.getElementById('forgot-step1').classList.add('hidden');\n    document.getElementById('forgot-step2').classList.remove('hidden');\n  } catch (e) {\n    document.getElementById('forgot-error').textContent = '⚠ ' + e.message;\n    document.getElementById('forgot-error').classList.add('show');\n  } finally {\n    btn.disabled = false;\n    btn.textContent = 'Continuer';\n  }\n}\n\nasync function resetPassword() {\n  clearAuthErrors();\n  const userId = document.getElementById('reset-user-id').value;\n  const answer = document.getElementById('reset-answer').value.trim();\n  const newPassword = document.getElementById('reset-password').value;\n\n  if (!answer || !newPassword) {\n    document.getElementById('reset-error').textContent = '⚠ Réponse et mot de passe requis';\n    document.getElementById('reset-error').classList.add('show');\n    return;\n  }\n\n  const btn = document.getElementById('reset-btn');\n  btn.disabled = true;\n  btn.textContent = 'Réinitialisation...';\n\n  try {\n    await api('/auth/reset-password', {\n      method: 'POST',\n      body: JSON.stringify({ userId, answer, newPassword })\n    });\n\n    document.getElementById('reset-success').textContent = 'Mot de passe réinitialisé ! Vous pouvez vous connecter.';\n    document.getElementById('reset-success').classList.add('show');\n\n    setTimeout(() => showLoginForm(), 2000);\n  } catch (e) {\n    document.getElementById('reset-error').textContent = '⚠ ' + e.message;\n    document.getElementById('reset-error').classList.add('show');\n  } finally {\n    btn.disabled = false;\n    btn.textContent = 'Réinitialiser';\n  }\n}\n\n// ============== Data Loading ==============\nasync function loadUserData() {\n  try {\n    const [expensesData, missionData] = await Promise.all([\n      api('/expenses'),\n      api('/mission')\n    ]);\n\n    expenses = expensesData.expenses || [];\n    missionInfo = missionData.mission || { objet: '', periode: '' };\n  } catch (e) {\n    console.error('Error loading data:', e);\n    expenses = [];\n    missionInfo = { objet: '', periode: '' };\n  }\n}\n\nasync function checkAuth() {\n  const token = getToken();\n  if (!token) return false;\n\n  authToken = token;\n  try {\n    const data = await api('/auth/me');\n    currentUser = data.user;\n    return true;\n  } catch {\n    clearToken();\n    authToken = null;\n    return false;\n  }\n}\n\n// ============== Mission ==============\nlet missionSaveTimeout = null;\n\nfunction updateMissionFromSelects() {\n  const module = document.getElementById('mission-module').value;\n  const lieu = document.getElementById('mission-lieu').value;\n  const periode = MODULES[module] || '';\n\n  document.getElementById('mission-periode').value = periode;\n\n  missionInfo.objet = module ? `${module} — ${lieu}` : '';\n  missionInfo.periode = periode;\n\n  saveMission();\n}\n\nasync function saveMission() {\n  if (missionSaveTimeout) clearTimeout(missionSaveTimeout);\n  missionSaveTimeout = setTimeout(async () => {\n    try {\n      await api('/mission', {\n        method: 'PUT',\n        body: JSON.stringify(missionInfo)\n      });\n    } catch (e) {\n      console.error('Error saving mission:', e);\n    }\n  }, 500);\n}\n\n// ============== UI ==============\nfunction showApp() {\n  document.getElementById('login-screen').style.display = 'none';\n  document.getElementById('app').style.display = 'block';\n  document.getElementById('user-display').textContent = '👤 ' + (currentUser?.display_name || 'Utilisateur');\n\n  // Parse mission objet to extract module and lieu\n  if (missionInfo.objet) {\n    const match = missionInfo.objet.match(/^(Module \\d+)\\s*[—-]\\s*(.+)$/);\n    if (match) {\n      document.getElementById('mission-module').value = match[1];\n      document.getElementById('mission-lieu').value = match[2];\n    }\n  }\n  document.getElementById('mission-periode').value = missionInfo.periode || '';\n\n  document.getElementById('form-date').value = new Date().toISOString().split('T')[0];\n  renderSummary();\n  renderExpenseList();\n}\n\nfunction getFilteredExpenses() {\n  if (!selectedModule) return expenses;\n  return expenses.filter(e => e.module === selectedModule);\n}\n\nfunction renderSummary() {\n  const grid = document.getElementById('summary-grid');\n  grid.innerHTML = '';\n\n  const filtered = getFilteredExpenses();\n  let grandTotal = 0;\n\n  SUMMARY_ORDER.forEach(catId => {\n    const cat = CATEGORIES[catId];\n    const items = filtered.filter(e => e.category === catId);\n    if (items.length === 0 && catId !== 'taxi' && catId !== 'logement') return;\n    const total = items.reduce((s, e) => s + e.amount, 0);\n    grandTotal += total;\n    const card = document.createElement('div');\n    card.className = 'summary-card';\n    card.style.borderLeftColor = cat.color;\n    card.innerHTML = `\n      <div class=\"summary-icon\" style=\"color: ${cat.color}\">${cat.icon}</div>\n      <div class=\"summary-label\">${cat.label}</div>\n      <div class=\"summary-amount\" style=\"color: ${cat.color}\">${total.toFixed(2)} €</div>\n      <div class=\"summary-count\">${items.length} dépense${items.length > 1 ? 's' : ''}</div>\n    `;\n    grid.appendChild(card);\n  });\n\n  grandTotal = filtered.reduce((s, e) => s + e.amount, 0);\n  const totalCard = document.createElement('div');\n  totalCard.className = 'summary-card total-card';\n  totalCard.innerHTML = `\n    <div class=\"summary-icon\">€</div>\n    <div class=\"summary-label\">Total${selectedModule ? ' ' + selectedModule : ' général'}</div>\n    <div class=\"summary-amount\">${grandTotal.toFixed(2)} €</div>\n    <div class=\"summary-count\">${filtered.length} ligne${filtered.length > 1 ? 's' : ''}</div>\n  `;\n  grid.appendChild(totalCard);\n\n  updateModuleTabCounts();\n}\n\nfunction updateModuleTabCounts() {\n  document.querySelectorAll('.module-tab').forEach(tab => {\n    const module = tab.dataset.module;\n    const count = module ? expenses.filter(e => e.module === module).length : expenses.length;\n\n    // Remove existing count badge\n    const existingBadge = tab.querySelector('.tab-count');\n    if (existingBadge) existingBadge.remove();\n\n    // Add count badge if there are expenses\n    if (count > 0) {\n      const badge = document.createElement('span');\n      badge.className = 'tab-count';\n      badge.textContent = count;\n      tab.appendChild(badge);\n    }\n  });\n}\n\nfunction renderExpenseList() {\n  const container = document.getElementById('expense-list-container');\n  const filtered = getFilteredExpenses();\n  document.getElementById('expense-count').textContent = filtered.length;\n\n  if (filtered.length === 0) {\n    const msg = selectedModule\n      ? `Aucune dépense pour ${selectedModule}.<br>Sélectionnez ce module et ajoutez une dépense.`\n      : `Aucune dépense pour l'instant.<br>Cliquez sur « Nouvelle dépense » pour commencer.`;\n    container.innerHTML = `<div class=\"empty\">${msg}</div>`;\n    return;\n  }\n\n  const sorted = [...filtered].sort((a, b) => {\n    const cmp = a.date.localeCompare(b.date);\n    if (cmp !== 0) return cmp;\n    return (a.time || '').localeCompare(b.time || '');\n  });\n\n  const list = document.createElement('div');\n  list.className = 'expense-list';\n\n  for (const exp of sorted) {\n    const cat = CATEGORIES[exp.category] || CATEGORIES.autre;\n    const row = document.createElement('div');\n    row.className = 'expense-row';\n    if (exp.module) row.setAttribute('data-module', exp.module);\n    const timeStr = exp.time ? ' • ' + exp.time : '';\n    const photoSrc = exp.photo_data || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>';\n\n    // Module badge with color\n    let moduleBadge = '';\n    if (exp.module && !selectedModule) {\n      const moduleNum = exp.module.replace('Module ', '');\n      moduleBadge = `<span class=\"module-badge m${moduleNum}\">M${moduleNum}</span>`;\n    }\n\n    row.innerHTML = `\n      <div class=\"cat-badge\" style=\"background: ${cat.color}\">${cat.icon}</div>\n      <img class=\"thumb\" src=\"${photoSrc}\" alt=\"justif\">\n      <div class=\"expense-info\">\n        <div class=\"expense-date\">${formatDate(exp.date)}${timeStr}${moduleBadge}</div>\n        <div class=\"expense-desc\">${escapeHtml(cat.label)}${exp.description ? ' — ' + escapeHtml(exp.description) : ''}</div>\n      </div>\n      <div class=\"expense-amount\">${exp.amount.toFixed(2)} €</div>\n      <div class=\"expense-actions\">\n        <button class=\"edit-btn\" data-id=\"${exp.id}\" title=\"Modifier\">✏️</button>\n        <button class=\"delete-btn\" data-id=\"${exp.id}\" title=\"Supprimer\">🗑</button>\n      </div>\n    `;\n    list.appendChild(row);\n  }\n\n  container.innerHTML = '';\n  container.appendChild(list);\n\n  list.querySelectorAll('.edit-btn').forEach(btn => {\n    btn.addEventListener('click', (e) => {\n      e.stopPropagation();\n      editExpense(btn.dataset.id);\n    });\n  });\n\n  list.querySelectorAll('.delete-btn').forEach(btn => {\n    btn.addEventListener('click', (e) => {\n      e.stopPropagation();\n      deleteExpense(btn.dataset.id);\n    });\n  });\n}\n\nfunction formatDate(iso) {\n  const d = new Date(iso + 'T12:00:00');\n  return d.toLocaleDateString('fr-FR');\n}\n\nfunction escapeHtml(s) {\n  return String(s).replace(/[&<>\"']/g, c => ({\n    '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'\n  }[c]));\n}\n\nasync function deleteExpense(id) {\n  if (!confirm('Supprimer cette dépense ?')) return;\n\n  try {\n    await api(`/expenses/${id}`, { method: 'DELETE' });\n    expenses = expenses.filter(e => e.id !== id);\n    renderSummary();\n    renderExpenseList();\n    showInfo('Dépense supprimée');\n  } catch (e) {\n    showError(e.message);\n  }\n}\n\nfunction editExpense(id) {\n  const exp = expenses.find(e => e.id === id);\n  if (!exp) return;\n\n  editingExpenseId = id;\n  document.getElementById('form-title').textContent = 'Modifier la dépense';\n  document.getElementById('form-expense-id').value = id;\n  document.getElementById('form-date').value = exp.date;\n  document.getElementById('form-time').value = exp.time || '';\n  document.getElementById('form-category').value = exp.category;\n  document.getElementById('form-amount').value = exp.amount;\n  document.getElementById('form-description').value = exp.description || '';\n  document.getElementById('form-module').value = exp.module || '';\n  document.getElementById('save-btn').textContent = 'Enregistrer';\n\n  if (exp.photo_data) {\n    formPhoto = exp.photo_data;\n    document.getElementById('preview-img').src = exp.photo_data;\n    document.getElementById('photo-preview').classList.remove('hidden');\n  } else {\n    formPhoto = null;\n    document.getElementById('photo-preview').classList.add('hidden');\n  }\n\n  document.getElementById('form-card').classList.remove('hidden');\n  document.getElementById('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });\n}\n\nfunction showForm(show) {\n  const card = document.getElementById('form-card');\n  card.classList.toggle('hidden', !show);\n  if (show) {\n    editingExpenseId = null;\n    document.getElementById('form-title').textContent = 'Nouvelle dépense';\n    document.getElementById('form-expense-id').value = '';\n    document.getElementById('form-date').value = new Date().toISOString().split('T')[0];\n    document.getElementById('form-time').value = '';\n    document.getElementById('form-amount').value = '';\n    document.getElementById('form-description').value = '';\n    document.getElementById('form-category').value = 'taxi';\n    document.getElementById('form-module').value = document.getElementById('mission-module').value || '';\n    document.getElementById('form-photo').value = '';\n    document.getElementById('photo-preview').classList.add('hidden');\n    document.getElementById('ocr-status').classList.remove('show', 'success');\n    document.getElementById('save-btn').textContent = 'Ajouter';\n    formPhoto = null;\n    card.scrollIntoView({ behavior: 'smooth', block: 'start' });\n  }\n}\n\n// ============== Photo / PDF + OCR ==============\nfunction handlePhoto(e) {\n  const file = e.target.files && e.target.files[0];\n  if (!file) return;\n\n  if (file.type === 'application/pdf' || /\\.pdf$/i.test(file.name)) {\n    handlePdfFile(file);\n  } else {\n    handleImageFile(file);\n  }\n}\n\nfunction handleImageFile(file) {\n  const reader = new FileReader();\n  reader.onload = (ev) => {\n    const img = new Image();\n    img.onload = () => {\n      const maxDim = 1600;\n      let w = img.width, h = img.height;\n      if (w > maxDim || h > maxDim) {\n        if (w > h) { h = h * maxDim / w; w = maxDim; }\n        else { w = w * maxDim / h; h = maxDim; }\n      }\n      const canvas = document.createElement('canvas');\n      canvas.width = w; canvas.height = h;\n      const ctx = canvas.getContext('2d');\n      ctx.drawImage(img, 0, 0, w, h);\n      formPhoto = canvas.toDataURL('image/jpeg', 0.85);\n      document.getElementById('preview-img').src = formPhoto;\n      document.getElementById('photo-preview').classList.remove('hidden');\n      runOCR(formPhoto); // Pass image data URL to Mindee\n    };\n    img.src = ev.target.result;\n  };\n  reader.readAsDataURL(file);\n}\n\nasync function handlePdfFile(file) {\n  if (!window.pdfjsLib) {\n    showError('Lecteur PDF non disponible.');\n    return;\n  }\n  const status = document.getElementById('ocr-status');\n  const message = document.getElementById('ocr-message');\n  const progress = document.getElementById('ocr-progress');\n  status.classList.remove('success');\n  status.classList.add('show');\n  message.textContent = 'Conversion du PDF…';\n  progress.style.width = '10%';\n\n  try {\n    const arrayBuffer = await file.arrayBuffer();\n    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;\n    const page = await pdf.getPage(1);\n    progress.style.width = '30%';\n\n    // Render PDF page to image\n    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR\n    const canvas = document.createElement('canvas');\n    canvas.width = viewport.width;\n    canvas.height = viewport.height;\n    const ctx = canvas.getContext('2d');\n    await page.render({ canvasContext: ctx, viewport }).promise;\n    formPhoto = canvas.toDataURL('image/jpeg', 0.90);\n    document.getElementById('preview-img').src = formPhoto;\n    document.getElementById('photo-preview').classList.remove('hidden');\n    progress.style.width = '50%';\n\n    // Use Mindee for OCR\n    message.textContent = 'Analyse avec Mindee AI…';\n    runOCR(formPhoto);\n  } catch (err) {\n    message.textContent = '⚠ Erreur PDF : ' + err.message;\n  }\n}\n\nasync function runOCR(imageData) {\n  const status = document.getElementById('ocr-status');\n  const message = document.getElementById('ocr-message');\n  const progress = document.getElementById('ocr-progress');\n  status.classList.remove('success');\n  status.classList.add('show');\n  message.textContent = 'Analyse du ticket (Mindee AI)…';\n  progress.style.width = '30%';\n\n  try {\n    // Call our backend OCR endpoint (Mindee)\n    const response = await fetch(API_BASE + '/ocr', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        'Authorization': authToken ? `Bearer ${authToken}` : ''\n      },\n      body: JSON.stringify({ image: imageData })\n    });\n\n    progress.style.width = '80%';\n\n    const data = await response.json();\n\n    if (!response.ok) {\n      throw new Error(data.error || 'Erreur OCR');\n    }\n    progress.style.width = '100%';\n\n    // Apply the extracted data\n    if (data.totalAmount) {\n      document.getElementById('form-amount').value = data.totalAmount.toFixed(2);\n    }\n    if (data.date) {\n      document.getElementById('form-date').value = data.date;\n    }\n    if (data.time) {\n      // Format time if needed (Mindee returns HH:MM:SS, we want HH:MM)\n      const timeParts = data.time.split(':');\n      document.getElementById('form-time').value = timeParts.slice(0, 2).join(':');\n    }\n    if (data.supplierName) {\n      document.getElementById('form-description').value = data.supplierName;\n    }\n\n    // Auto-detect category based on Mindee's category\n    const catField = document.getElementById('form-category');\n    if (data.category) {\n      const catLower = data.category.toLowerCase();\n      const subCatLower = (data.subcategory || '').toLowerCase();\n\n      if (catLower.includes('transport') || subCatLower.includes('taxi') || subCatLower.includes('uber')) {\n        catField.value = 'taxi';\n      } else if (subCatLower.includes('train') || subCatLower.includes('sncf')) {\n        catField.value = 'train';\n      } else if (subCatLower.includes('bus') || subCatLower.includes('metro')) {\n        catField.value = catLower.includes('metro') ? 'metro' : 'bus';\n      } else if (catLower.includes('accommodation') || catLower.includes('hotel') || catLower.includes('lodging')) {\n        catField.value = 'logement';\n      } else if (catLower.includes('food') || catLower.includes('restaurant') || catLower.includes('meal')) {\n        // Detect meal type by time\n        if (data.time) {\n          const hour = parseInt(data.time.split(':')[0]);\n          if (hour >= 6 && hour < 11) catField.value = 'petit_dej';\n          else if (hour >= 11 && hour < 15) catField.value = 'dejeuner';\n          else if (hour >= 18 && hour < 23) catField.value = 'diner';\n          else catField.value = 'repas';\n        } else {\n          catField.value = 'repas';\n        }\n      }\n    }\n\n    // Build success message\n    const found = [];\n    if (data.supplierName) found.push('\"' + data.supplierName + '\"');\n    if (data.totalAmount) found.push(data.totalAmount.toFixed(2) + ' €');\n    if (data.date) found.push('date');\n    if (data.time) found.push('heure');\n    if (data.category) found.push(data.category);\n\n    if (found.length > 0) {\n      status.classList.add('success');\n      message.textContent = '✓ Mindee : ' + found.join(', ');\n    } else {\n      message.textContent = '⚠ Rien détecté. Saisissez manuellement.';\n    }\n  } catch (err) {\n    console.error('OCR error:', err);\n    message.textContent = '⚠ ' + (err.message || 'Erreur OCR');\n  }\n}\n\nfunction parseReceiptText(text) {\n  const result = { amount: null, date: null, time: null, transportHint: null, businessName: null };\n  if (!text) return result;\n\n  const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(l => l.length > 0);\n  const upperText = text.toUpperCase();\n\n  // Business/Restaurant name detection (usually in first 3 lines)\n  // The business name is typically the FIRST line of the receipt\n\n  // Skip patterns - lines that are NOT business names\n  const skipPatterns = [\n    /^\\d+[,.\\s]?\\d*\\s*€?$/, // Just numbers (prices)\n    /^\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4}/, // Dates\n    /^\\d{2}:\\d{2}/, // Times\n    /^\\+?\\d[\\d\\s\\-\\.]{8,}$/, // Phone numbers\n    /^(tel|fax|tél|siret|siren|tva|n°|numero|adresse|rue|avenue|boulevard|code postal)/i,\n    /^\\d+\\s+(rue|avenue|boulevard|place|allée)/i, // Addresses\n    /^(ticket|caisse|table|serveur|client|facture|reçu|addition|total|sous-total)/i,\n    /^www\\.|^http|\\.com|\\.fr/i, // URLs\n    /^[\\*\\-=_]{3,}$/, // Separators\n    /^(merci|bienvenue|à bientôt|au revoir)/i, // Greetings\n    /\\d+[,\\.]\\d{2}\\s*€?$/, // Lines ending with prices\n    /^(demo|test)\\s/i, // Demo/test lines\n    /\\d+\\s*[xX]\\s*\\d/, // Quantity patterns like \"2 x 5\"\n    /^[A-Z0-9]+\\d$/, // Codes ending with number like \"FRINGUE1\"\n    /^\\d/, // Lines starting with numbers\n  ];\n\n  // Patterns that look like product/item lines (should be skipped)\n  const productPatterns = [\n    /\\d+\\s*€/, // Contains price\n    /\\d+[,\\.]\\d{2}/, // Contains decimal number (price)\n    /^[A-Z\\s]+\\d+$/, // ALLCAPS followed by number (item code)\n    /qte|qty|quantité/i, // Quantity indicators\n  ];\n\n  // Known restaurant/business indicators (high confidence)\n  const businessIndicators = [\n    /restaurant/i, /brasserie/i, /café/i, /cafe/i, /bistro/i, /pizzeria/i,\n    /boulangerie/i, /pâtisserie/i, /patisserie/i, /traiteur/i, /bar\\b/i, /pub\\b/i,\n    /hôtel/i, /hotel/i, /grill/i, /tabac/i, /sarl/i, /sas\\b/i, /eurl/i,\n    /supermarché/i, /carrefour/i, /leclerc/i, /auchan/i, /lidl/i, /aldi/i,\n    /mcdo|mcdonald/i, /burger/i, /kebab/i, /sushi/i, /wok/i\n  ];\n\n  // First pass: look for line with business indicator\n  for (let i = 0; i < Math.min(lines.length, 5); i++) {\n    const line = lines[i];\n    if (businessIndicators.some(p => p.test(line))) {\n      let name = line.replace(/^[\\*\\-\\s]+|[\\*\\-\\s]+$/g, '').replace(/\\s+/g, ' ').trim();\n      if (name.length >= 3 && name.length <= 40) {\n        result.businessName = name;\n        break;\n      }\n    }\n  }\n\n  // Second pass: if no indicator found, take first valid line (usually line 1)\n  if (!result.businessName) {\n    for (let i = 0; i < Math.min(lines.length, 3); i++) {\n      const line = lines[i];\n\n      // Skip if line matches skip patterns\n      if (skipPatterns.some(p => p.test(line))) continue;\n\n      // Skip if line looks like a product\n      if (productPatterns.some(p => p.test(line))) continue;\n\n      // Skip very short or very long lines\n      if (line.length < 3 || line.length > 40) continue;\n\n      // Skip lines that are mostly numbers\n      const digits = (line.match(/\\d/g) || []).length;\n      if (digits > line.length * 0.3) continue;\n\n      // Skip lines that look like item codes (ALLCAPS + number)\n      if (/^[A-Z\\s]{2,}[0-9]+$/.test(line)) continue;\n\n      // Clean up the name\n      let name = line\n        .replace(/^[\\*\\-\\s]+|[\\*\\-\\s]+$/g, '')\n        .replace(/\\s+/g, ' ')\n        .trim();\n\n      if (name.length >= 3) {\n        result.businessName = name;\n        break; // Take the first valid line\n      }\n    }\n  }\n\n  // Transport detection\n  const transportKeywords = [\n    { regex: /\\b(RATP|METRO|MÉTRO)\\b/, type: 'metro' },\n    { regex: /\\b(SNCF|TGV|TER)\\b/, type: 'train' },\n    { regex: /\\b(BUS|KEOLIS|STAR)\\b/, type: 'bus' },\n    { regex: /\\b(UBER|BOLT|TAXI|VTC)\\b/, type: 'taxi' },\n    { regex: /\\b(HOTEL|HÔTEL|IBIS|NOVOTEL|MERCURE|CAMPANILE|PREMIERE CLASSE|B&B)\\b/i, type: 'logement' },\n  ];\n  for (const kw of transportKeywords) {\n    if (kw.regex.test(upperText)) {\n      result.transportHint = kw.type;\n      break;\n    }\n  }\n\n  // Amount\n  const totalKeywords = [\n    { regex: /\\btotal\\s*ttc\\b/i, priority: 5 },\n    { regex: /\\bmontant\\s*ttc\\b/i, priority: 5 },\n    { regex: /\\btotal\\s*à\\s*payer\\b/i, priority: 5 },\n    { regex: /\\btotal\\b/i, priority: 3 },\n    { regex: /\\bà\\s*payer\\b/i, priority: 3 },\n  ];\n  let bestAmount = null;\n  let bestPriority = -1;\n\n  for (const line of lines) {\n    let linePriority = 0;\n    for (const kw of totalKeywords) {\n      if (kw.regex.test(line) && kw.priority > linePriority) {\n        linePriority = kw.priority;\n      }\n    }\n    const matches = [...line.matchAll(/(\\d{1,4})[\\s.,](\\d{2})\\b/g)];\n    for (const m of matches) {\n      const value = parseFloat(m[1] + '.' + m[2]);\n      if (value > 0 && value < 10000) {\n        if (linePriority > bestPriority || (linePriority === bestPriority && value > (bestAmount || 0))) {\n          bestAmount = value;\n          bestPriority = linePriority;\n        }\n      }\n    }\n  }\n  result.amount = bestAmount;\n\n  // Date\n  const dateMatch = text.match(/\\b(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})\\b/);\n  if (dateMatch) {\n    let [_, dd, mm, yy] = dateMatch;\n    dd = dd.padStart(2, '0');\n    mm = mm.padStart(2, '0');\n    if (yy.length === 2) yy = '20' + yy;\n    result.date = `${yy}-${mm}-${dd}`;\n  }\n\n  // Time\n  const timeMatch = text.match(/\\b([01]?\\d|2[0-3])\\s*[:hH]\\s*([0-5]\\d)\\b/);\n  if (timeMatch) {\n    result.time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;\n  }\n\n  return result;\n}\n\nfunction categorizeMealByTime(timeStr) {\n  if (!timeStr) return null;\n  const [h] = timeStr.split(':').map(Number);\n  if (h >= 6 && h < 11) return 'petit_dej';\n  if (h >= 11 && h < 15) return 'dejeuner';\n  if (h >= 18 && h < 23) return 'diner';\n  return 'repas';\n}\n\nfunction applyParsedData(parsed) {\n  if (parsed.amount) document.getElementById('form-amount').value = parsed.amount.toFixed(2);\n  if (parsed.date) document.getElementById('form-date').value = parsed.date;\n  if (parsed.time) document.getElementById('form-time').value = parsed.time;\n\n  // Auto-fill description with business/restaurant name\n  if (parsed.businessName) {\n    const descField = document.getElementById('form-description');\n    if (!descField.value) { // Only if description is empty\n      descField.value = parsed.businessName;\n    }\n  }\n\n  const catField = document.getElementById('form-category');\n  if (catField.value === 'taxi') {\n    if (parsed.transportHint) {\n      catField.value = parsed.transportHint;\n    } else if (parsed.time) {\n      const suggested = categorizeMealByTime(parsed.time);\n      if (suggested) catField.value = suggested;\n    }\n  }\n}\n\n// ============== Save Expense ==============\nasync function saveExpense() {\n  const date = document.getElementById('form-date').value;\n  const time = document.getElementById('form-time').value;\n  const category = document.getElementById('form-category').value;\n  const amount = parseFloat(document.getElementById('form-amount').value);\n  const description = document.getElementById('form-description').value.trim();\n\n  if (!date) { showError('Date requise'); return; }\n  if (isNaN(amount) || amount <= 0) { showError('Montant requis et > 0'); return; }\n  if (!formPhoto && !editingExpenseId) { showError('Photo du justificatif obligatoire'); return; }\n\n  const btn = document.getElementById('save-btn');\n  btn.disabled = true;\n  btn.textContent = 'Envoi...';\n\n  try {\n    // Get module from form selector\n    const currentModule = document.getElementById('form-module').value || undefined;\n\n    const payload = {\n      date,\n      time: time || undefined,\n      category,\n      amount,\n      description: description || undefined,\n      photo: formPhoto || undefined,\n      module: currentModule\n    };\n\n    if (editingExpenseId) {\n      // Update\n      const data = await api(`/expenses/${editingExpenseId}`, {\n        method: 'PUT',\n        body: JSON.stringify(payload)\n      });\n      const idx = expenses.findIndex(e => e.id === editingExpenseId);\n      if (idx >= 0) expenses[idx] = data.expense;\n      showInfo('Dépense modifiée');\n    } else {\n      // Create\n      const data = await api('/expenses', {\n        method: 'POST',\n        body: JSON.stringify(payload)\n      });\n      expenses.push(data.expense);\n      showInfo('Dépense ajoutée');\n    }\n\n    showForm(false);\n    renderSummary();\n    renderExpenseList();\n  } catch (e) {\n    showError(e.message);\n  } finally {\n    btn.disabled = false;\n    btn.textContent = editingExpenseId ? 'Enregistrer' : 'Ajouter';\n  }\n}\n\n// ============== PDF ==============\nasync function generatePDF() {\n  const filtered = getFilteredExpenses();\n\n  if (filtered.length === 0) {\n    showError(selectedModule ? `Aucune dépense pour ${selectedModule}` : 'Aucune dépense à exporter');\n    return;\n  }\n\n  const btn = document.getElementById('export-btn');\n  const originalText = btn.textContent;\n  btn.disabled = true;\n  btn.textContent = 'Génération…';\n\n  try {\n    const sorted = [...filtered].sort((a, b) => {\n      const cmp = a.date.localeCompare(b.date);\n      if (cmp !== 0) return cmp;\n      return (a.time || '').localeCompare(b.time || '');\n    });\n\n    const { jsPDF } = window.jspdf;\n    const doc = new jsPDF({ unit: 'mm', format: 'a4' });\n    const displayName = currentUser?.display_name || 'Utilisateur';\n    const pageW = 210, pageH = 297, margin = 15;\n\n    doc.setFont('helvetica', 'bold');\n    doc.setFontSize(20);\n    const pdfTitle = selectedModule ? `NOTE DE FRAIS — ${selectedModule}` : 'NOTE DE FRAIS';\n    doc.text(pdfTitle, margin, 20);\n    doc.setFont('helvetica', 'normal');\n    doc.setFontSize(10);\n    doc.setTextColor(100);\n    doc.text('Émise le ' + new Date().toLocaleDateString('fr-FR'), pageW - margin, 20, { align: 'right' });\n\n    doc.setTextColor(0);\n    doc.setFontSize(11);\n    let y = 35;\n    doc.setFont('helvetica', 'bold'); doc.text('Bénéficiaire :', margin, y);\n    doc.setFont('helvetica', 'normal'); doc.text(displayName, margin + 35, y);\n    y += 6;\n    if (missionInfo.objet) {\n      doc.setFont('helvetica', 'bold'); doc.text('Mission :', margin, y);\n      doc.setFont('helvetica', 'normal'); doc.text(missionInfo.objet, margin + 35, y);\n      y += 6;\n    }\n    if (missionInfo.periode) {\n      doc.setFont('helvetica', 'bold'); doc.text('Période :', margin, y);\n      doc.setFont('helvetica', 'normal'); doc.text(missionInfo.periode, margin + 35, y);\n      y += 6;\n    }\n    y += 4;\n\n    doc.setFillColor(30, 30, 30);\n    doc.rect(margin, y, pageW - 2 * margin, 8, 'F');\n    doc.setTextColor(255);\n    doc.setFont('helvetica', 'bold');\n    doc.setFontSize(9);\n    doc.text('N°', margin + 2, y + 5.5);\n    doc.text('DATE', margin + 12, y + 5.5);\n    doc.text('HEURE', margin + 32, y + 5.5);\n    doc.text('CATÉGORIE', margin + 47, y + 5.5);\n    doc.text('DESCRIPTION', margin + 85, y + 5.5);\n    doc.text('MONTANT TTC', pageW - margin - 2, y + 5.5, { align: 'right' });\n    y += 8;\n\n    doc.setTextColor(0);\n    doc.setFont('helvetica', 'normal');\n    doc.setFontSize(9);\n\n    const totalsByCategory = {};\n    SUMMARY_ORDER.forEach(c => totalsByCategory[c] = 0);\n\n    sorted.forEach((exp, idx) => {\n      if (y > pageH - 30) { doc.addPage(); y = 20; }\n      if (idx % 2 === 0) {\n        doc.setFillColor(248, 248, 248);\n        doc.rect(margin, y, pageW - 2 * margin, 7, 'F');\n      }\n      const cat = CATEGORIES[exp.category] || CATEGORIES.autre;\n      totalsByCategory[exp.category] = (totalsByCategory[exp.category] || 0) + exp.amount;\n      doc.text(String(idx + 1), margin + 2, y + 5);\n      doc.text(formatDate(exp.date), margin + 12, y + 5);\n      doc.text(exp.time || '-', margin + 32, y + 5);\n      doc.text(cat.label, margin + 47, y + 5);\n      const desc = exp.description || '-';\n      const truncDesc = desc.length > 32 ? desc.slice(0, 30) + '...' : desc;\n      doc.text(truncDesc, margin + 85, y + 5);\n      doc.text(exp.amount.toFixed(2) + ' €', pageW - margin - 2, y + 5, { align: 'right' });\n      y += 7;\n    });\n\n    y += 4;\n    doc.setDrawColor(30, 30, 30);\n    doc.setLineWidth(0.5);\n    doc.line(margin, y, pageW - margin, y);\n    y += 6;\n\n    doc.setFont('helvetica', 'bold');\n    doc.setFontSize(10);\n    doc.text('TOTAUX PAR CATÉGORIE', margin, y);\n    y += 6;\n    doc.setFont('helvetica', 'normal');\n    doc.setFontSize(9);\n    let grandTotal = 0;\n    SUMMARY_ORDER.forEach(catId => {\n      const v = totalsByCategory[catId] || 0;\n      grandTotal += v;\n      if (v > 0) {\n        if (y > pageH - 25) { doc.addPage(); y = 20; }\n        doc.text(CATEGORIES[catId].label, margin + 5, y);\n        doc.text(v.toFixed(2) + ' €', margin + 80, y, { align: 'right' });\n        y += 5;\n      }\n    });\n    y += 2;\n    doc.setLineWidth(0.3);\n    doc.line(margin, y, margin + 85, y);\n    y += 5;\n    doc.setFont('helvetica', 'bold');\n    doc.setFontSize(12);\n    doc.text('TOTAL GÉNÉRAL', margin + 5, y);\n    doc.text(grandTotal.toFixed(2) + ' €', margin + 80, y, { align: 'right' });\n    y += 12;\n\n    if (y > pageH - 40) { doc.addPage(); y = 20; }\n    doc.setFont('helvetica', 'normal');\n    doc.setFontSize(9);\n    doc.setTextColor(80);\n    doc.text(\"Je certifie sur l'honneur l'exactitude des dépenses ci-dessus.\", margin, y);\n    y += 10;\n    doc.text('Signature :', margin, y);\n    doc.text('Date :', pageW - margin - 60, y);\n\n    // Annexe : justificatifs\n    for (let idx = 0; idx < sorted.length; idx++) {\n      const exp = sorted[idx];\n      doc.addPage();\n      doc.setFont('helvetica', 'bold');\n      doc.setFontSize(12);\n      doc.setTextColor(0);\n      const cat = CATEGORIES[exp.category] || CATEGORIES.autre;\n      doc.text('Justificatif n°' + (idx + 1) + ' — ' + cat.label, margin, 20);\n      doc.setFont('helvetica', 'normal');\n      doc.setFontSize(10);\n      doc.setTextColor(80);\n      const meta = formatDate(exp.date) + (exp.time ? ' à ' + exp.time : '') +\n                   '   •   ' + exp.amount.toFixed(2) + ' €' +\n                   (exp.description ? '   •   ' + exp.description : '');\n      doc.text(meta, margin, 27);\n\n      const photo = exp.photo_data || null;\n      if (photo) {\n        try {\n          doc.addImage(photo, 'JPEG', margin, 35, pageW - 2 * margin, pageH - 50, undefined, 'MEDIUM');\n        } catch (err) {\n          doc.setTextColor(200, 0, 0);\n          doc.text(\"Erreur d'insertion de l'image\", margin, 50);\n        }\n      } else {\n        doc.setTextColor(150);\n        doc.text(\"Image non disponible\", margin, 50);\n      }\n    }\n\n    const moduleStr = selectedModule ? '_' + selectedModule.replace(/\\s+/g, '') : '';\n    const filename = 'Note_de_frais_' + displayName.replace(/\\s+/g, '_') + moduleStr + '_' + new Date().toISOString().split('T')[0] + '.pdf';\n    doc.save(filename);\n  } catch (err) {\n    showError('Erreur génération PDF : ' + err.message);\n  } finally {\n    btn.disabled = false;\n    btn.textContent = originalText;\n  }\n}\n\n// ============== Events ==============\n\n// Tabs\ndocument.querySelectorAll('.tab').forEach(tab => {\n  tab.addEventListener('click', () => {\n    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));\n    tab.classList.add('active');\n\n    const isLogin = tab.dataset.tab === 'login';\n    document.getElementById('login-form').classList.toggle('hidden', !isLogin);\n    document.getElementById('register-form').classList.toggle('hidden', isLogin);\n    document.getElementById('forgot-form').classList.add('hidden');\n    clearAuthErrors();\n  });\n});\n\n// Auth\ndocument.getElementById('login-btn').addEventListener('click', login);\ndocument.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });\ndocument.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });\n\ndocument.getElementById('register-btn').addEventListener('click', register);\ndocument.getElementById('register-password').addEventListener('keydown', e => { if (e.key === 'Enter') register(); });\n\ndocument.getElementById('logout-btn').addEventListener('click', logout);\n\n// Password reset\ndocument.getElementById('forgot-link').addEventListener('click', showForgotForm);\ndocument.getElementById('forgot-back').addEventListener('click', showLoginForm);\ndocument.getElementById('forgot-btn').addEventListener('click', forgotPassword);\ndocument.getElementById('reset-btn').addEventListener('click', resetPassword);\n\n// Mission\ndocument.getElementById('mission-module').addEventListener('change', updateMissionFromSelects);\ndocument.getElementById('mission-lieu').addEventListener('change', updateMissionFromSelects);\n\n// Module tabs\ndocument.querySelectorAll('.module-tab').forEach(tab => {\n  tab.addEventListener('click', () => {\n    document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));\n    tab.classList.add('active');\n    selectedModule = tab.dataset.module;\n\n    // Sync the module dropdown with selected tab\n    if (selectedModule && document.getElementById('mission-module').value !== selectedModule) {\n      document.getElementById('mission-module').value = selectedModule;\n      updateMissionFromSelects();\n    }\n\n    renderSummary();\n    renderExpenseList();\n  });\n});\n\n// App\ndocument.getElementById('add-btn').addEventListener('click', () => showForm(true));\ndocument.getElementById('cancel-btn').addEventListener('click', () => showForm(false));\ndocument.getElementById('save-btn').addEventListener('click', saveExpense);\ndocument.getElementById('form-photo').addEventListener('change', handlePhoto);\n\ndocument.getElementById('camera-btn').addEventListener('click', () => {\n  const input = document.getElementById('form-photo');\n  input.setAttribute('capture', 'environment');\n  input.setAttribute('accept', 'image/*');\n  input.click();\n});\ndocument.getElementById('gallery-btn').addEventListener('click', () => {\n  const input = document.getElementById('form-photo');\n  input.removeAttribute('capture');\n  input.setAttribute('accept', 'image/*');\n  input.click();\n});\ndocument.getElementById('pdf-btn').addEventListener('click', () => {\n  const input = document.getElementById('form-photo');\n  input.removeAttribute('capture');\n  input.setAttribute('accept', 'application/pdf');\n  input.click();\n});\n\ndocument.getElementById('export-btn').addEventListener('click', generatePDF);\n\ndocument.getElementById('form-time').addEventListener('change', e => {\n  const time = e.target.value;\n  if (!time) return;\n  const currentCat = document.getElementById('form-category').value;\n  const mealCats = ['repas', 'petit_dej', 'dejeuner', 'diner'];\n  if (mealCats.includes(currentCat)) {\n    const suggested = categorizeMealByTime(time);\n    if (suggested && suggested !== currentCat) {\n      document.getElementById('form-category').value = suggested;\n    }\n  }\n});\n\n// Init\n(async function init() {\n  const isAuth = await checkAuth();\n  if (isAuth) {\n    await loadUserData();\n    showApp();\n  }\n})();\n</script>\n\n</body>\n</html>\n";
app.get("*", (c) => {
  return new Response(HTML_PAGE, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
