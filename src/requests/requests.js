/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const fetch = require('node-fetch');
const util = require('util');


const respErrSym = Symbol('ResponseErrorDataSym');

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
    .filter(e => e !== undefined)
    .map(s => s.replace(/(^\/*|\/*$)/g, '')) /* This comment works around a problem with editor syntax highglighting */
    .join('/')
    + ((args[args.length - 1].slice(-1) === '/') ? '/' : '');

const optLog = (opts, ...args) => {
    if (opts && opts.logger) {
        opts.logger(...args);
    }
};

const throwOrJson = async (res, msg = `HTTP request ${res.url} returned error response ${res.status}`) => {
    if (res.headers.get('content-length') === '0' || res.status === 204) {
        return null;
    }
    const resp = await res.json();
    if (res.ok) {
        return resp;
    }
    throw new HTTPResponseError({ msg, res, resp });
};


// TODO: if we destructure the function parameters like so:
// async function get(url, { endpoint = 'http://localhost:3000', logger = () => {} } = {}) {
// we can get rid of the optLog function, and better communicate to the consumers of this module
// what options they're supposed to provide.
async function get(url, opts) {
    try {
        const reqOpts = {
            method: 'GET',
            headers: { 'content-type': 'application/json', 'accept': 'application/json' }
        };

        return await fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson);
    } catch (e) {
        optLog(opts, util.format('Error attempting GET. URL:', url, 'Opts:', opts, 'Error:', e));
        throw e;
    }
}


async function put(url, body, opts) {
    try {
        const reqOpts = {
            method: 'PUT',
            headers: { 'content-type': 'application/json', 'accept': 'application/json' },
            body: JSON.stringify(body)
        };

        return await fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson);
    } catch (e) {
        optLog(opts, util.format('Error attempting PUT. URL:', url, 'Opts:', opts, 'Body:', body, 'Error:', e));
        throw e;
    }
}


async function post(url, body, opts) {
    try {
        const reqOpts = {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'accept': 'application/json' },
            body: JSON.stringify(body)
        };

        return await fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson);
    } catch (e) {
        optLog(opts, util.format('Error attempting POST. URL:', url, 'Opts:', opts, 'Body:', body, 'Error:', e));
        throw e;
    }
}

async function del(url, opts) {
    try {
        const reqOpts = {
            method: 'DELETE',
            headers: { 'content-type': 'application/json', 'accept': 'application/json' }
        };

        return await fetch(buildUrl(opts.endpoint, url), reqOpts).then(throwOrJson);
    } catch (e) {
        optLog(opts, util.format('Error attempting DELETE. URL:', url, 'Opts:', opts, 'Error:', e));
        throw e;
    }
}

module.exports = {
    get,
    put,
    post,
    del,
    buildUrl,
    HTTPResponseError
};
