/* eslint-disable no-underscore-dangle */
const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');

const requests = rewire('../../src/requests/requests.js');

describe('Requests:', () => {
    let mockData;
    let mockResponse;
    let throwOrJsonSpy;

    beforeEach(() => {
        mockData = {
            url: 'http://foo.bar.baz',
            body: {
                name: 'john',
                surname: 'smith',
            },
            opts: {},
        };
        mockResponse = {
            json: () => true,
            headers: {
                get: () => ({
                    'content-length': '100',
                }),
            },
            ok: true,
            status: 200,
        };

        throwOrJsonSpy = sinon.spy();

        requests.__set__('throwOrJson', throwOrJsonSpy);
    });

    describe('Public functions:', () => {
        describe('get:', () => {
            describe('Failures:', () => {
                it('calls only `optLog` and throws an error if `buildUrl` throws an exception.', async () => {
                    const fakeError = new Error('foo');

                    const mockBuildUrl = () => {
                        throw fakeError;
                    };

                    const mockBuildUrlRestore = requests.__set__('buildUrl', mockBuildUrl);

                    await assert.rejects(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);

                    mockBuildUrlRestore();
                });
                it('calls only `optLog` and throws an error if `fetch` fails.', async () => {
                    const fakeError = new Error('foo');

                    const mockFetch = async () => Promise.reject(fakeError);

                    requests.__set__('fetch', mockFetch);

                    await assert.rejects(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);
                });
                it('calls `throwOrJson` if `fetch` succeeds but the response is erroneous.', async () => {
                    mockResponse.ok = false;

                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
            describe('Success:', async () => {
                it('calls `throwOrJson` if `fetch` succeeds.', async () => {
                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the incoming `opts.headers` if defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };

                    await assert.doesNotReject(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'GET');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the default headers if `opts.headers` is not defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.get(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'GET');
                    assert.equal(mockFetch.getCall(0).args[1].headers,
                        requests.__get__('DEFAULT_HEADERS'));
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
        });
        describe('post:', () => {
            describe('Failures:', () => {
                it('calls only `optLog` and throws an error if `buildUrl` throws an exception.', async () => {
                    const fakeError = new Error('foo');

                    const mockBuildUrl = () => {
                        throw fakeError;
                    };

                    const mockBuildUrlRestore = requests.__set__('buildUrl', mockBuildUrl);

                    await assert.rejects(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);

                    mockBuildUrlRestore();
                });
                it('calls only `optLog` and throws an error if `fetch` fails.', async () => {
                    const fakeError = new Error('foo');

                    const mockFetch = async () => Promise.reject(fakeError);

                    requests.__set__('fetch', mockFetch);

                    await assert.rejects(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);
                });
                it('calls `throwOrJson` if `fetch` succeeds but the response is erroneous.', async () => {
                    mockResponse.ok = false;

                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
            describe('Success:', async () => {
                it('calls `throwOrJson` if `fetch` succeeds.', async () => {
                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the incoming `opts.headers` if defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'POST');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the default headers if `opts.headers` is not defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'POST');
                    assert.equal(mockFetch.getCall(0).args[1].headers,
                        requests.__get__('DEFAULT_HEADERS'));
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('Converts the incoming `body` argument into a JSON string if `opts.json` '
                    + 'is not set to `false`.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };
                    mockData.opts.json = true;

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'POST');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(typeof mockFetch.getCall(0).args[1].body, 'string');
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('Does not convert the incoming `body` argument into a JSON string if `opts.json` '
                    + 'is set to `false`.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };
                    mockData.opts.json = false;

                    await assert.doesNotReject(
                        async () => {
                            await requests.post(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'POST');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(typeof mockFetch.getCall(0).args[1].body, 'object');
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
        });
        describe('put:', () => {
            describe('Failures:', () => {
                it('calls only `optLog` and throws an error if `buildUrl` throws an exception.', async () => {
                    const fakeError = new Error('foo');

                    const mockBuildUrl = () => {
                        throw fakeError;
                    };

                    const mockBuildUrlRestore = requests.__set__('buildUrl', mockBuildUrl);

                    await assert.rejects(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);

                    mockBuildUrlRestore();
                });
                it('calls only `optLog` and throws an error if `fetch` fails.', async () => {
                    const fakeError = new Error('foo');

                    const mockFetch = async () => Promise.reject(fakeError);

                    requests.__set__('fetch', mockFetch);

                    await assert.rejects(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);
                });
                it('calls `throwOrJson` if `fetch` succeeds but the response is erroneous.', async () => {
                    mockResponse.ok = false;

                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
            describe('Success:', async () => {
                it('calls `throwOrJson` if `fetch` succeeds.', async () => {
                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the incoming `opts.headers` if defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'PUT');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the default headers if `opts.headers` is not defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'PUT');
                    assert.equal(mockFetch.getCall(0).args[1].headers,
                        requests.__get__('DEFAULT_HEADERS'));
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('Converts the incoming `body` argument into a JSON string if `opts.json` '
                    + 'is not set to `false`.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };
                    mockData.opts.json = true;

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'PUT');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(typeof mockFetch.getCall(0).args[1].body, 'string');
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('Does not convert the incoming `body` argument into a JSON string if `opts.json` '
                    + 'is set to `false`.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };
                    mockData.opts.json = false;

                    await assert.doesNotReject(
                        async () => {
                            await requests.put(mockData.url, mockData.body, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'PUT');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(typeof mockFetch.getCall(0).args[1].body, 'object');
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
        });
        describe('del:', () => {
            describe('Failures:', () => {
                it('calls only `optLog` and throws an error if `buildUrl` throws an exception.', async () => {
                    const fakeError = new Error('foo');

                    const mockBuildUrl = () => {
                        throw fakeError;
                    };

                    const mockBuildUrlRestore = requests.__set__('buildUrl', mockBuildUrl);

                    await assert.rejects(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);

                    mockBuildUrlRestore();
                });
                it('calls only `optLog` and throws an error if `fetch` fails.', async () => {
                    const fakeError = new Error('foo');

                    const mockFetch = async () => Promise.reject(fakeError);

                    requests.__set__('fetch', mockFetch);

                    await assert.rejects(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, false);
                });
                it('calls `throwOrJson` if `fetch` succeeds but the response is erroneous.', async () => {
                    mockResponse.ok = false;

                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
            describe('Success:', async () => {
                it('calls `throwOrJson` if `fetch` succeeds.', async () => {
                    const mockFetch = async () => Promise.resolve(mockResponse);

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the incoming `opts.headers` if defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    mockData.opts.headers = { foo: 'bar' };

                    await assert.doesNotReject(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'DELETE');
                    assert.equal(mockFetch.getCall(0).args[1].headers, mockData.opts.headers);
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
                it('uses the default headers if `opts.headers` is not defined.', async () => {
                    const mockFetch = sinon
                        .stub()
                        .returns(Promise.resolve(mockResponse));

                    requests.__set__('fetch', mockFetch);

                    await assert.doesNotReject(
                        async () => {
                            await requests.del(mockData.url, mockData.opts);
                        },
                    );

                    assert.equal(mockFetch.getCall(0).args[1].method, 'DELETE');
                    assert.equal(mockFetch.getCall(0).args[1].headers,
                        requests.__get__('DEFAULT_HEADERS'));
                    assert.equal(throwOrJsonSpy.called, true);
                    assert.equal(throwOrJsonSpy.calledWith(mockResponse), true);
                });
            });
        });
        describe('buildUrl:', () => {
            describe('Success:', () => {
                it('Strips all beginning and end forward-slashes from each of the arguments and'
                    + 'properly joins all the stripped strings with a forward-slash between them', () => {
                    assert.equal(requests.buildUrl('http://foo', '/bar', '/baz/', '/qux//',
                        '//quux/', '//quuz//', 'corge', 'bar', 'baz', '/////qux/////'),
                    'http://foo/bar/baz/qux/quux/quuz/corge/bar/baz/qux/');
                });
            });
        });
    });
});
