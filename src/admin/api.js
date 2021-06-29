const assert = require('assert').strict;
const uuidv4 = require('uuid/v4');
const {
    get, put, post, del, buildUrl,
} = require('../requests/requests');

const FOREX_PROVIDERS = {
    CITI: 'citi',
};

/**
 * Get all participant accounts
 *
 * @returns {object}
 */
async function getParticipantAccounts(endpoint, participantName) {
    const accounts = await get(`participants/${participantName}/accounts`, { endpoint });
    return accounts;
}

/**
 * Get account details
 *
 * @returns {object}
 */
async function getAccountById(endpoint, participantName, accountId) {
    const accountIdNum = Number(accountId);
    const accounts = await getParticipantAccounts(endpoint, participantName);
    const account = accounts.find((a) => a.id === accountIdNum);
    if (account === undefined) {
        throw new Error(`Couldn't find account with id ${accountId}`);
    }
    return account;
}

/**
 * Get account details by type
 *
 * @returns {object}
 */
async function getAccountByType(endpoint, participantName, currency, accountType) {
    const accounts = await getParticipantAccounts(endpoint, participantName);
    const account = accounts
        .filter((a) => a.currency === currency)
        .find((ac) => ac.ledgerAccountType === accountType);
    if (account === undefined) {
        throw new Error(`Couldn't find account with type: ${accountType}`);
    }
    return account;
}

/**
 * Get a single participant's information
 *
 * @returns {object}
 */
async function getParticipant(endpoint, participantName) {
    const result = await get(`participants/${participantName}`, { endpoint });
    return result;
}

/**
 * Get the list of all participants
 *
 * @returns {object}
 */
async function getParticipants(endpoint) {
    const result = await get('participants', { endpoint });
    return result;
}

/**
 * Gets a list of email addresses for a participant
 *
 * @returns {object}
 */
async function getParticipantEmailAddresses(endpoint, participantName) {
    const participantEndpoints = await get(buildUrl('participants', participantName, 'endpoints'), { endpoint });
    const emailAddresses = participantEndpoints.filter((a) => a.type.endsWith('_EMAIL'));
    return emailAddresses;
}

/**
 * Updates participant email address for a notification type
 * @returns {object}
 */
async function updateEmailAddress(endpoint, dfspName, emailType, newEmailAddress) {
    const newEndPoint = { type: emailType, value: newEmailAddress };
    const result = await post(buildUrl('participants', dfspName, 'endpoints'), newEndPoint, { endpoint });
    return result;
}

/**
 * Get net debit cap for a given dfsp+currency
 *
 * @returns {object}
 */
async function getNDC(endpoint, dfspName, currency) {
    const limits = await get(buildUrl('participants', dfspName, 'limits'), { endpoint });
    const ndc = limits.find((l) => l.currency === currency && l.limit.type === 'NET_DEBIT_CAP');
    if (ndc === undefined) {
        throw new Error(`Couldn't find ${currency} net debit cap for participant ${dfspName}`);
    }
    // Looks like:
    // {
    //   "currency": "XOF",
    //   "limit": {
    //     "type": "NET_DEBIT_CAP",
    //     "value": 10000,
    //     "alarmPercentage": 10
    //   }
    // }
    return ndc;
}

/**
 * Set net debit cap for a given dfsp+currency
 *
 * @returns {object}
 */
async function setNDC(endpoint, dfspName, currency, newAmount) {
    const ndc = await getNDC(endpoint, dfspName, currency);
    const newNDC = { currency, limit: { ...ndc.limit, value: newAmount } };
    const result = await put(buildUrl('participants', dfspName, 'limits'), newNDC, { endpoint });
    return result;
}

/**
 * Get participant from account ID
 *
 * @returns {object}
 */
async function getParticipantByAccountId(endpoint, accountId) {
    const participants = await get('participants', { endpoint });
    // match participant account id to get the fsp name
    const fsp = participants.find((p) => p.accounts.findIndex((a) => a.id === accountId) !== -1);
    if (fsp.name === undefined) {
        throw new Error(`Couldn't find fsp with account ID ${accountId}`);
    }
    return fsp;
}

/**
 * Prepare DFSP funds out for reconciliation
 *
 * @returns {object}
 */
async function participantFundsOutPrepareReserve(
    endpoint, participantName, accountId, amount, currency, reason,
    { transferId = uuidv4() } = {},
) {
    // TODO: should really take the participant as argument
    await post(`participants/${participantName}/accounts/${accountId}`, {
        transferId,
        externalReference: 'string', // TODO: something useful
        action: 'recordFundsOutPrepareReserve',
        reason,
        amount: {
            amount,
            currency,
        },
    }, { endpoint });
    return { transferId };
}

/**
 * Prepare DFSP funds out for reconciliation
 *
 * @returns {object}
 */
async function fundsOutPrepareReserve(endpoint, accountId, amount, currency, reason) {
    // TODO: should really take the participant as argument
    const fsp = await getParticipantByAccountId(endpoint, accountId);
    const result = await participantFundsOutPrepareReserve(
        endpoint, fsp.name, accountId, amount, currency, reason,
    );
    return result;
}

/**
 * Prepare, reserve, commit DFSP funds in for reconciliation
 *
 * @returns {object}
 */
async function participantFundsInReserve(
    endpoint, participantName, accountId, amount, reason, currency,
    { transferId = uuidv4() } = {},
) {
    await post(`participants/${participantName}/accounts/${accountId}`, {
        transferId,
        externalReference: 'string', // TODO: something useful
        action: 'recordFundsIn',
        reason,
        amount: {
            amount,
            currency,
        },
    }, { endpoint });
    return { transferId };
}

/**
 * Prepare, reserve, commit DFSP funds in for reconciliation
 *
 * @returns {object}
 */
async function fundsInReserve(endpoint, accountId, amount, reason, currency) {
    // TODO: should really take the participant as argument
    const fsp = await getParticipantByAccountId(endpoint, accountId);
    return participantFundsInReserve(
        endpoint, fsp.name, accountId, amount, reason, currency,
    );
}

/**
 * Set the isActive flag for a participant
 *
 * @returns {object}
 */
async function setParticipantIsActiveFlag(endpoint, dfspName, value) {
    const payload = { isActive: value };
    const result = await put(buildUrl('participants', dfspName), payload, { endpoint });
    return result;
}

/**
 * @function getFxpCurrencyChannels
 * @private
 * @param {string} endpoint
 * @returns {Promise<*>}
 */
async function getFxpCurrencyChannels(endpoint) {
    const result = await get('exchange-rates/channels', { endpoint });
    return result;
}

/**
 * @function getFxpRatesForChannel
 * @private
 * @param {string} endpoint
 * @param channel
 * @returns {object}
 */
async function getFxpRatesForChannel(endpoint, channel) {
    const rates = await get(`exchange-rates/channels/${channel.id}/rates`, { endpoint });

    return {
        channel,
        rates,
    };
}

/**
 * @function buildCustomFxpChannelIdentifier
 * @private
 * @param {object} fxpCurrencyChannel
 * @returns {string}
 */
function buildCustomFxpChannelIdentifier(fxpCurrencyChannel) {
    return fxpCurrencyChannel.sourceCurrency.toLowerCase()
        + fxpCurrencyChannel.destinationCurrency.toLowerCase();
}

/**
 * Communicates with an external FX provider API in order to fetch the FX rates for all
 * available currency channels.
 *
 * @function getFxpRatesPerCurrencyChannel
 * @param {string} endpoint
 * @returns {object} An array of objects listing the exchange rates per currency channel, formatted:
 *  {
 *      <{string} the currency channel identifier. Format: concatenation of source and destination
 *          currencies, Example: "eurusd">: [
 *          {
 *              rate: <{int} The foreign exchange rate configured. The number of decimal points is
 *                  provided in decimalRate.>,
 *              decimalRate: <{int} The number of decimal points of the rate>,
 *              startTime: <{string} The starting period during which the exchange rate can be
 *                  applied to Forex transfers. Format: yyyy-MM-ddTHH:mm:ss.SSS[-HH:MM]>,
 *              endTime: <{string} The ending period up to which the exchange rate can be applied to
 *                  Forex transfers. Format: yyyy-MM-ddTHH:mm:ss.SSS[-HH:MM]>,
 *              reuse: <{boolean} Whether to override the end date or not. When set to true and
 *                  there is no other exchange rate valid at that point in time, it is expected that
 *                  the exchange rate remains valid after the end date>
 *          }
 *      ]
 *  }
 */
async function getFxpRatesPerCurrencyChannel(endpoint) {
    const currencyChannels = await getFxpCurrencyChannels(endpoint);
    const ratesForAllCurrencyChannels = await Promise.all(
        currencyChannels.map(
            async (currencyChannel) => {
                const result = await getFxpRatesForChannel(
                    endpoint, currencyChannel,
                );
                const rates = result.rates.map(
                    (rate) => ({
                        ...rate,
                        currencyPair: `${currencyChannel.sourceCurrency}${currencyChannel.destinationCurrency}`,
                    }),
                );
                return { ...result, rates };
            },
        ),
    );
    const ratesPerCurrencyChannel = {};

    ratesForAllCurrencyChannels.forEach((item) => {
        if (item.rates != null) {
            const customChannelIdentifier = buildCustomFxpChannelIdentifier(item.channel);
            ratesPerCurrencyChannel[customChannelIdentifier] = item.rates;
        }
    });
    return ratesPerCurrencyChannel;
}

/**
 * @function extractSourceCurrency
 * @private
 * @param {string} currencyPair The currencies of the target channel, in a single concatenated
 * string with format "<source><destination>", as in this example: "eurusd".
 * @return {string}
 */
function extractSourceCurrency(currencyPair) {
    return currencyPair.substring(0, 3);
}

/**
 * @function extractDestinationCurrency
 * @private
 * @param {string} currencyPair The currencies of the target channel, in a single concatenated
 * string with format "<source><destination>", as in this example: "eurusd".
 * @returns {string}
 */
function extractDestinationCurrency(currencyPair) {
    return currencyPair.substring(3, 6);
}

/**
 * @function buildDecimalRate
 * @param {String} rate
 * @param {Number} decimalPlaces
 * @returns {String}
 */
function buildDecimalRate(rate, decimalPlaces) {
    assert(typeof rate === 'string', '`rate` must be a string.');
    assert(typeof decimalPlaces === 'number', '`decimalPlaces` must be a number.');

    if (decimalPlaces === 0) {
        return rate;
    }

    const position = rate.length - decimalPlaces < 0
        ? 0
        : rate.length - decimalPlaces;

    const integerPart = rate.slice(0, position) || 0;
    const decimalPart = rate.slice(position);

    return `${integerPart}.${decimalPart}`;
}

/**
 * Generates the required object structure for a ForEx provider.
 * @function getForexProviderInfo
 * @param {String} forexProviderName
 * @param {String} currencyPair
 * @param {Object} rateDetails
 * @returns {Object}
 */
function getForexProviderInfo(forexProviderName, currencyPair, rateDetails) {
    switch (forexProviderName) {
        case FOREX_PROVIDERS.CITI: {
            const TENOR_VALUES = {
                ON: 'ON', // Same-day settlement.
                TN: 'TN', //  T+1 settlement, where T = date of order execution.
                SP: 'SP', // T+2 settlement, where T = date of order execution.
                BROKEN: 'BROKEN', // Variable date.
            };

            /**
             * rateSetId {String} - Unique identifier for each set of rates. ^[0-9]{1,10}$
             * currencyPair {String} - Identifies the currency pair in 6 characters.
             *      The currency codes defined in ISO 4217 as three-letter alphabetic codes are
             *      used for each member of the currency pair. ^[A-Z]{6}$
             * baseCurrency {String} - The base currency of the currency pair. ^[A-Z]{3}$
             * ratePrecision {String} - The number of decimal places to which this currency pair is
             *      quoted by the partner bank. NOTE: Use this if the base currency is EUR.
             *      It should be the same as the decimalRate.
             * invRatePrecision {String} - Used when exchange rates are stored both ways.
             *      NOTE: Currently not used.
             * tenor {String} - tenor must be TN
             * valueDate {String} - The value date for the rate as per the partner bank.
             *      NOTE: This is currently not mandatory. It can be null or not present.
             * bidSpotRate {String} The rate where the partner bank buys the base currency at.
             *      NOTE: Currently, this must be the same as rate but with the decimal point.
             * offerSpotRate {String} - The rate where the partner bank sells the base currency at.
             *      NOTE: This is currently not in use.
             * midPrice {String} - The rate that is at the middle of both the bid and the offer.
             *      NOTE: This is currently not in use.
             * validUntilTime {String} - Time and date that this rate will expire.
             *      Excludes grace period. Format: yyyy-MM-dd HH:mm:ss.SSS in UTC time.
             *      NOTE: Currently, this must be the same as endTime but in a different format.
             *      ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{3})?$
             * isValid {String} - Indicator that the partner bank was able to provide the rate.
             *      NOTE: Currently this must always be 'true' or 'TRUE'.
             * isTradable {String} - A flag to indicate that the currency pair is tradeable.
             *      NOTE: Currently this must always be 'true' or 'TRUE'.
             */
            return {
                citi: {
                    rateSetId: rateDetails.rateSetId,
                    currencyPair: currencyPair.toUpperCase(),
                    baseCurrency: extractSourceCurrency(currencyPair).toUpperCase(),
                    ratePrecision: rateDetails.decimalRate.toString(),
                    invRatePrecision: '1', // This is currently not in use.
                    tenor: TENOR_VALUES.TN, // Since payment settlement happens on T+1,
                    // where T = date of order execution, tenor must be TN.
                    valueDate: '0000-00-00', // This is currently not in use.
                    bidSpotRate: buildDecimalRate(rateDetails.rate.toString(),
                        rateDetails.decimalRate),
                    offerSpotRate: '0.0000', // This is currently not in use.
                    midPrice: '0.0000', // This is currently not in use.
                    validUntilTime: rateDetails.endTime.replace('T', ' ').replace('Z', ''),
                    isValid: 'true', // Currently this must always be 'true'
                    isTradable: 'true', // Currently this must always be 'true'
                },
            };
        }
        default:
            return {};
    }
}

/**
 * Communicates with an external FXP API in order to create the FXP rate for the specified
 * currency channel.
 *
 * @function createFxpRateForCurrencyChannel
 * @param {string} endpoint
 * @param {string} currencyPair The currencies of the target channel, in a single concatenated
 * string with format "<source><destination>", as in this example: "eurusd".
 * @param {object} rateDetails
 * @returns {Promise<*>} The result from the FXP API.
 */
async function createFxpRateForCurrencyChannel(endpoint, currencyPair, rateDetails) {
    const sourceCurrency = extractSourceCurrency(currencyPair);
    const destinationCurrency = extractDestinationCurrency(currencyPair);
    const body = {
        rate: rateDetails.rate,
        decimalRate: rateDetails.decimalRate,
        startTime: rateDetails.startTime,
        endTime: rateDetails.endTime,
        reuse: rateDetails.reuse,
        forexProviderInfo: rateDetails.forexProviderInfo
          || getForexProviderInfo(FOREX_PROVIDERS.CITI, currencyPair, rateDetails),
    };

    const currencyChannels = await getFxpCurrencyChannels(endpoint);
    const targetChannel = currencyChannels
        .find((currencyChannel) => currencyChannel.sourceCurrency.toLowerCase()
            === sourceCurrency.toLowerCase()
        && currencyChannel.destinationCurrency.toLowerCase() === destinationCurrency.toLowerCase());

    if (targetChannel == null) {
        throw new Error('FXP API error - Currency channel not found.');
    }

    const result = await post(`exchange-rates/channels/${targetChannel.id}/rates`, body, { endpoint });

    return result;
}

/**
 * Communicates with an external FXP API in order to delete the specified currency channel
 *
 * @function deleteFxpCurrencyChannel
 * @param {string} endpoint
 * @param {string} currencyPair The currencies of the target channel, in a single concatenated
 * string with format "<source><destination>", as in this example: "eurusd".
 * @returns {Promise<*>} The result from the FXP API.
 */
async function deleteFxpCurrencyChannel(endpoint, currencyPair) {
    const sourceCurrency = extractSourceCurrency(currencyPair);
    const destinationCurrency = extractDestinationCurrency(currencyPair);

    const currencyChannels = await getFxpCurrencyChannels(endpoint);
    const targetChannel = currencyChannels
        .find((currencyChannel) => currencyChannel.sourceCurrency.toLowerCase()
            === sourceCurrency.toLowerCase()
        && currencyChannel.destinationCurrency.toLowerCase() === destinationCurrency.toLowerCase());

    if (targetChannel == null) {
        return { ok: true };
    }

    const result = await del(`exchange-rates/channels/${targetChannel.id}`, { endpoint });

    return result;
}

/**
 * Communicates with an external FXP API in order to create the specified
 * currency channel.
 *
 * @function createFxpCurrencyChannel
 * @param {string} endpoint
 * @param {string} currencyPair The currencies of the target channel, in a single concatenated
 * string with format "<source><destination>", as in this example: "eurusd".
 * @param {object} channelDetails
 * @returns {Promise<*>} The result from the FXP API.
 */
async function createFxpCurrencyChannel(endpoint, currencyPair, channelDetails) {
    const sourceCurrency = extractSourceCurrency(currencyPair);
    const destinationCurrency = extractDestinationCurrency(currencyPair);
    const body = {
        sourceCurrency: sourceCurrency.toUpperCase(),
        destinationCurrency: destinationCurrency.toUpperCase(),
        ...channelDetails,
    };
    const currencyChannels = await getFxpCurrencyChannels(endpoint);
    const targetChannel = currencyChannels
        .find((currencyChannel) => currencyChannel.sourceCurrency.toLowerCase()
            === sourceCurrency.toLowerCase()
        && currencyChannel.destinationCurrency.toLowerCase() === destinationCurrency.toLowerCase());

    if (targetChannel != null) {
        throw new Error('FXP API error - Currency channel already exists.');
    }

    const result = await post('exchange-rates/channels', body, { endpoint });

    return result;
}
/**
 * Communicates with an external settlement API in order to commit the target settlement window.
 *
 * @function commitSettlementWindow
 * @param {string} endpoint
 * @param {number} settlementWindowId
 * @returns {Promise<*>} The result from the TMF API.
 */
async function commitSettlementWindow(endpoint, settlementWindowId) {
    const body = {
        hubSettlementId: settlementWindowId,
    };

    const result = await post('settlement/phase-two', body, { endpoint });

    return result;
}

module.exports = {
    commitSettlementWindow,
    createFxpCurrencyChannel,
    createFxpRateForCurrencyChannel,
    deleteFxpCurrencyChannel,
    fundsInReserve,
    fundsOutPrepareReserve,
    getAccountById,
    getAccountByType,
    getForexProviderInfo,
    getFxpCurrencyChannels,
    getFxpRatesPerCurrencyChannel,
    getParticipantAccounts,
    getParticipantEmailAddresses,
    getNDC,
    getParticipantByAccountId,
    getParticipants,
    getParticipant,
    participantFundsInReserve,
    participantFundsOutPrepareReserve,
    setNDC,
    setParticipantIsActiveFlag,
    updateEmailAddress,
};
