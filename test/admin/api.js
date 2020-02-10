/* eslint-disable no-underscore-dangle */
const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');

const api = rewire('../../src/admin/api');

describe('API:', () => {
    describe('Private functions:', () => {
        describe('buildCustomFxpChannelIdentifier:', () => {
            describe('Failures:', () => {
                it('throws an exception if the incoming parameter is not a valid object (number).', () => {
                    assert.throws(() => {
                        api.__get__('buildCustomFxpChannelIdentifier')(123);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid object (string).', () => {
                    assert.throws(() => {
                        api.__get__('buildCustomFxpChannelIdentifier')('foo');
                    });
                });
                it('throws an exception if the incoming parameter is not a valid object (function).', () => {
                    assert.throws(() => {
                        api.__get__('buildCustomFxpChannelIdentifier')(() => {});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid object (array).', () => {
                    assert.throws(() => {
                        api.__get__('buildCustomFxpChannelIdentifier')([]);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid object (object).', () => {
                    assert.throws(() => {
                        api.__get__('buildCustomFxpChannelIdentifier')({});
                    });
                });
            });
            describe('Success:', () => {
                it('returns a valid string based on `sourceCurrency` and '
                    + '`destinationCurrency` parameters of the incoming object.', () => {
                    assert.deepEqual(api.__get__('buildCustomFxpChannelIdentifier')({
                        sourceCurrency: 'vaRiousCase',
                        destinationCurrency: 'ALLCAPS',
                    }), 'variouscaseallcaps');
                });
            });
        });
        describe('buildCurrencyChannelRates:', () => {
            describe('Failures:', () => {
                it('throws an exception if the incoming parameter is not a valid array (number).', () => {
                    assert.throws(() => {
                        api.__get__('buildCurrencyChannelRates')(123);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid array (string).', () => {
                    assert.throws(() => {
                        api.__get__('buildCurrencyChannelRates')('foo');
                    });
                });
                it('throws an exception if the incoming parameter is not a valid array (function).', () => {
                    assert.throws(() => {
                        api.__get__('buildCurrencyChannelRates')(() => {});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid array (object).', () => {
                    assert.throws(() => {
                        api.__get__('buildCurrencyChannelRates')({});
                    });
                });
            });
            describe('Success:', () => {
                it('returns a valid array of objects extracted from the incoming array.', () => {
                    const rates = [{
                        rate: 6666680,
                        decimalRate: 4,
                        startTime: '2019-09-04T12:00:00.000Z',
                        endTime: '2019-09-05T12:00:00.000Z',
                        reuse: true,
                        somethingElse1: 'does not matter',
                        somethingElse2: 'does not matter',
                    }];
                    const expectedResult = [{
                        rate: rates[0].rate,
                        decimalRate: rates[0].decimalRate,
                        startTime: rates[0].startTime,
                        endTime: rates[0].endTime,
                        reuse: rates[0].reuse,
                    }];

                    assert.deepEqual(api.__get__('buildCurrencyChannelRates')(rates), expectedResult);
                });
            });
        });
        describe('extractSourceCurrency:', () => {
            describe('Failures:', () => {
                it('throws an exception if the incoming parameter is not a valid string (null).', () => {
                    assert.throws(() => {
                        api.__get__('extractSourceCurrency')(null);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (number).', () => {
                    assert.throws(() => {
                        api.__get__('extractSourceCurrency')(12345);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (function).', () => {
                    assert.throws(() => {
                        api.__get__('extractSourceCurrency')(() => {});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (object).', () => {
                    assert.throws(() => {
                        api.__get__('extractSourceCurrency')({});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (array).', () => {
                    assert.throws(() => {
                        api.__get__('extractSourceCurrency')([]);
                    });
                });
            });
            describe('Success:', () => {
                it('returns the first 3 characters of the first incoming parameter if it is a string.', () => {
                    const result = api.__get__('extractSourceCurrency')('eurmad');
                    assert.strictEqual(result, 'eur');
                });
            });
        });
        describe('extractDestinationCurrency:', () => {
            describe('Failures:', () => {
                it('throws an exception if the incoming parameter is not a valid string (null).', () => {
                    assert.throws(() => {
                        api.__get__('extractDestinationCurrency')(null);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (number).', () => {
                    assert.throws(() => {
                        api.__get__('extractDestinationCurrency')(12345);
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (function).', () => {
                    assert.throws(() => {
                        api.__get__('extractDestinationCurrency')(() => {});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (object).', () => {
                    assert.throws(() => {
                        api.__get__('extractDestinationCurrency')({});
                    });
                });
                it('throws an exception if the incoming parameter is not a valid string (array).', () => {
                    assert.throws(() => {
                        api.__get__('extractDestinationCurrency')([]);
                    });
                });
            });
            describe('Success:', () => {
                it('returns the characters 4 to 6 of the first incoming parameter if it is a string.', () => {
                    const result = api.__get__('extractDestinationCurrency')('eurmad');
                    assert.strictEqual(result, 'mad');
                });
            });
        });
    });
    describe('Public methods:', () => {
        describe('getFxpRatesPerCurrencyChannel:', () => {
            let mockData;
            let getFxpCurrencyChannelsRestore;
            let getFxpRatesForChannelRestore;
            let buildCustomFxpChannelIdentifierRestore;
            let buildCurrencyChannelRatesRestore;

            beforeEach(() => {
                // re-define the mock data in each test's run, in order to avoid issues if
                // a test case alters them.
                mockData = {
                    currencyChannels: [
                        {
                            sourceCurrency: 'EUR',
                            destinationCurrency: 'MAD',
                            status: 'Suspended',
                            id: 0,
                            createdBy: 'string',
                            createdDate: 'string',
                        },
                        {
                            sourceCurrency: 'MAD',
                            destinationCurrency: 'EUR',
                            status: 'Active',
                            id: 1,
                            createdBy: 'string',
                            createdDate: 'string',
                        },
                    ],
                    customChannelIdentifiers: ['eurmad', 'madeur'],
                    endpoint: 'http://fake-endpoint.mojaloop',
                    fxpRates: [{
                        rate: 6666667,
                        decimalRate: 4,
                        startTime: '2019-09-03T12:00:00.000Z',
                        endTime: '2019-09-04T12:00:00.000Z',
                        reuse: true,
                    },
                    {
                        rate: 6666680,
                        decimalRate: 4,
                        startTime: '2019-09-04T12:00:00.000Z',
                        endTime: '2019-09-05T12:00:00.000Z',
                        reuse: true,
                    }],
                    logger: {},
                };
                // stub all private functions that are used inside the method, in order to avoid
                // duplication of code. Re-stub each one individually only when needed in each test.
                getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', sinon.stub().resolves(mockData.currencyChannels));
                getFxpRatesForChannelRestore = api.__set__('getFxpRatesForChannel',
                    sinon.stub()
                        .onFirstCall()
                        .resolves({
                            channel: mockData.currencyChannels[0],
                            rates: mockData.fxpRates[0],
                        })
                        .onSecondCall()
                        .resolves({
                            channel: mockData.currencyChannels[1],
                            rates: mockData.fxpRates[1],
                        }));
                buildCustomFxpChannelIdentifierRestore = api.__set__('buildCustomFxpChannelIdentifier',
                    sinon.stub()
                        .onFirstCall()
                        .returns(mockData.customChannelIdentifiers[0])
                        .onSecondCall()
                        .returns(mockData.customChannelIdentifiers[1]));
                buildCurrencyChannelRatesRestore = api.__set__('buildCurrencyChannelRates', sinon.stub().returns(mockData.fxpRates));
            });

            afterEach(() => {
                // restore all stubbed functions to their originals
                getFxpCurrencyChannelsRestore();
                getFxpRatesForChannelRestore();
                buildCustomFxpChannelIdentifierRestore();
                buildCurrencyChannelRatesRestore();
            });

            describe('Failures:', () => {
                it('should throw an exception if `getFxpCurrencyChannels` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', stub);

                    await assert.rejects(
                        async () => {
                            await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });

                it('should throw an exception if `getFxpRatesForChannel` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpRatesForChannel', stub);

                    await assert.rejects(
                        async () => {
                            await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });

                it('should throw an exception if `buildCustomFxpChannelIdentifier` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    buildCustomFxpChannelIdentifierRestore = api.__set__('buildCustomFxpChannelIdentifier', stub);

                    await assert.rejects(
                        async () => {
                            await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });

                it('should throw an exception if `buildCurrencyChannelRates` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    buildCurrencyChannelRatesRestore = api.__set__('buildCurrencyChannelRates', stub);

                    await assert.rejects(
                        async () => {
                            await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });
            });
            describe('Success:', () => {
                it('should return an empty object if `getFxpCurrencyChannels` returns an empty result', async () => {
                    const stub = sinon.stub().resolves([]);

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', stub);

                    const result = await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                        mockData.logger);

                    assert.deepEqual(result, {});
                });

                it('should return an empty object if `getFxpCurrencyChannels` returns only one channel '
                    + 'and `getFxpRatesForChannel` returns an empty result for it.', async () => {
                    const stub1 = sinon.stub().resolves([]);
                    const stub2 = sinon.stub().resolves({});

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', stub1);
                    getFxpRatesForChannelRestore = api.__set__('getFxpRatesForChannel', stub2);

                    const result = await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                        mockData.logger);

                    assert.deepEqual(result, {});
                });

                it('should return a valid non empty object if `getFxpCurrencyChannels` returns only one channel '
                    + 'and `getFxpRatesForChannel` returns a none empty result for it.', async () => {
                    const stub1 = sinon.stub().resolves([mockData.currencyChannels[0]]);
                    const stub2 = sinon.stub().resolves({
                        channel: mockData.currencyChannels[0],
                        rates: mockData.fxpRates[0],
                    });

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', stub1);
                    getFxpRatesForChannelRestore = api.__set__('getFxpRatesForChannel', stub2);

                    const expectedResult = {
                        [mockData.customChannelIdentifiers[0]]: mockData.fxpRates,
                    };
                    const result = await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                        mockData.logger);

                    assert.deepEqual(result, expectedResult);
                });

                it('should return a valid non empty object if `getFxpCurrencyChannels` returns multiple channels '
                    + 'and `getFxpRatesForChannel` returns a none empty result for them.', async () => {
                    const expectedResult = {
                        [mockData.customChannelIdentifiers[0]]: mockData.fxpRates,
                        [mockData.customChannelIdentifiers[1]]: mockData.fxpRates,
                    };
                    const result = await api.getFxpRatesPerCurrencyChannel(mockData.endpoint,
                        mockData.logger);

                    assert.deepEqual(result, expectedResult);
                });
            });
        });
        describe('createFxpRateForCurrencyChannel:', () => {
            let mockData;
            let extractSourceCurrencyRestore;
            let extractDestinationCurrencyRestore;
            let getFxpCurrencyChannelsRestore;
            let postRestore;

            const postStub = sinon.stub().resolves({ ok: true });

            beforeEach(() => {
                // re-define the mock data in each test's run, in order to avoid issues if
                // a test case alters them.
                mockData = {
                    currencyChannels: [
                        {
                            sourceCurrency: 'EUR',
                            destinationCurrency: 'MAD',
                            status: 'Suspended',
                            id: 0,
                            createdBy: 'string',
                            createdDate: 'string',
                        },
                        {
                            sourceCurrency: 'MAD',
                            destinationCurrency: 'EUR',
                            status: 'Active',
                            id: 1,
                            createdBy: 'string',
                            createdDate: 'string',
                        },
                    ],
                    currencyPair: 'eurmad',
                    destinationCurrency: 'mad',
                    endpoint: 'http://fake-endpoint.mojaloop',
                    logger: () => {},
                    rateDetails: {
                        rate: 666667,
                        decimalRate: 4,
                        startTime: '2019-09-03T12:00:00.000Z',
                        endTime: '2019-09-04T12:00:00.000Z',
                        reuse: true,
                    },
                    sourceCurrency: 'eur',
                };
                // stub all private functions that are used inside the method, in order to avoid
                // duplication of code. Re-stub each one individually only when needed in each test.
                extractSourceCurrencyRestore = api.__set__('extractSourceCurrency', sinon.stub().returns(mockData.sourceCurrency));
                extractDestinationCurrencyRestore = api.__set__('extractDestinationCurrency', sinon.stub().returns(mockData.destinationCurrency));
                getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', sinon.stub().resolves(mockData.currencyChannels));

                postRestore = api.__set__('post', postStub);
            });

            afterEach(() => {
                // restore all stubbed functions to their originals
                extractSourceCurrencyRestore();
                extractDestinationCurrencyRestore();
                getFxpCurrencyChannelsRestore();
                postRestore();
            });

            describe('Failures:', () => {
                it('should throw an exception if `extractSourceCurrency` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    extractSourceCurrencyRestore = api.__set__('extractSourceCurrency', stub);

                    await assert.rejects(
                        async () => {
                            await api.createFxpRateForCurrencyChannel(mockData.endpoint,
                                mockData.currencyPair,
                                mockData.currencyPair,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });
                it('should throw an exception if `extractDestinationCurrency` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    extractDestinationCurrencyRestore = api.__set__('extractDestinationCurrency', stub);

                    await assert.rejects(
                        async () => {
                            await api.createFxpRateForCurrencyChannel(mockData.endpoint,
                                mockData.currencyPair,
                                mockData.rateDetails,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });
                it('should throw an exception if `getFxpCurrencyChannels` fails.', async () => {
                    const fakeError = new Error('foo');
                    const stub = sinon.stub().throws(fakeError);

                    getFxpCurrencyChannelsRestore = api.__set__('getFxpCurrencyChannels', stub);

                    await assert.rejects(
                        async () => {
                            await api.createFxpRateForCurrencyChannel(mockData.endpoint,
                                mockData.currencyPair,
                                mockData.rateDetails,
                                mockData.logger);
                        },
                        {
                            name: fakeError.name,
                            message: fakeError.message,
                        },
                    );
                });
            });
            describe('Success:', () => {
                it('should return the result of the `requests.post` if it succeeds.', async () => {
                    const expectedResult = { ok: true };
                    const result = await api.createFxpRateForCurrencyChannel(mockData.endpoint,
                        mockData.currencyPair,
                        mockData.rateDetails,
                        mockData.logger);

                    assert.strictEqual(postStub.getCall(0).args[0], 'exchange-rates/channels/0');
                    assert.deepEqual(postStub.getCall(0).args[1], {
                        rate: mockData.rateDetails.rate,
                        decimalRate: mockData.rateDetails.decimalRate,
                        startTime: mockData.rateDetails.startTime,
                        endTime: mockData.rateDetails.endTime,
                        reuse: mockData.rateDetails.reuse,
                    });
                    assert.deepEqual(postStub.getCall(0).args[2], {
                        endpoint: mockData.endpoint,
                        logger: mockData.logger,
                    });
                    assert.deepEqual(result, expectedResult);
                });
            });
        });
    });
});
