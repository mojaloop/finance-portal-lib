const fetch = require('node-fetch');
const util = require('util');

const respErrSym = Symbol('ResponseErrorDataSym');

const DEFAULT_HEADERS = {
    accept: 'application/json',
    'content-type': 'application/json',
};

class HTTPResponseError extends Error {
    constructor(params) {
        super(params.msg);
        this[respErrSym] = params;
    }

    getData() {
        return this[respErrSym];
    }

    toString() {
        return util.inspect(this[respErrSym]);
    }

    toJSON() {
        return JSON.stringify(this[respErrSym]);
    }
}


// Strip all beginning and end forward-slashes from each of the arguments, then join all the
// stripped strings with a forward-slash between them. If the last string ended with a
// forward-slash, append that to the result.
const buildUrl = (...args) => args
    .filter((e) => e !== undefined)
    .map((s) => s.replace(/(^\/*|\/*$)/g, '')) /* This comment works around a problem with editor syntax highglighting */
    .join('/')
    + ((args[args.length - 1].slice(-1) === '/') ? '/' : '');

const throwOrJson = ({ body }) => async (res, msg = `HTTP request ${res.url} returned error response ${res.status}`) => {
    if (res.headers.get('content-length') === '0' || res.status === 204) {
        return null;
    }
    const resp = await res.json();
    if (res.ok) {
        return resp;
    }
    throw new HTTPResponseError({
        request: {
            body, endpoint: res.url,
        },
        msg,
        res,
        resp,
    });
};


// TODO: if we destructure the function parameters like so:
// async function get(url, { endpoint = 'http://localhost:3000' } = {}) {
// we can better communicate to the consumers of this module what options they're supposed to
// provide.
async function get(url, opts) {
    const reqOpts = {
        method: 'GET',
        headers: opts.headers || DEFAULT_HEADERS,
    };

    return fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson(reqOpts));
}


async function put(url, body, opts) {
    const reqOpts = {
        method: 'PUT',
        headers: opts.headers || DEFAULT_HEADERS,
        body: opts.json === false ? body : JSON.stringify(body),
    };

    return fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson(reqOpts));
}


async function post(url, body, opts) {
    const reqOpts = {
        method: 'POST',
        headers: opts.headers || DEFAULT_HEADERS,
        body: opts.json === false ? body : JSON.stringify(body),
    };

    return fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson(reqOpts));
}

async function del(url, opts) {
    const reqOpts = {
        method: 'DELETE',
        headers: opts.headers || DEFAULT_HEADERS,
    };

    return fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson(reqOpts));
}

module.exports = {
    get,
    put,
    post,
    del,
    buildUrl,
    HTTPResponseError,
};
