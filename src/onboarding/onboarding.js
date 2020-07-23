const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const { Headers } = fetch;

/**
 * Sends a request given an args array generated via lib functions in the same module.
 *
 * @param {function} request
 * @param {function} fetchFunc
 *
 * @returns {Promise<void>} The result of the sent request
 */
async function sendRequest(request, timeout = 30000, fetchFunc = fetch) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, timeout);
    const [url, options] = request;

    try {
        const result = await fetchFunc(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out.');
        }
        throw error;
    }
}

/**
 * Returns the settlement account ID of a given DFSP's accounts on the hub.
 *
 * @param {array} hubAccounts Array of accounts registered to a specific DFSP on the hub
 * @param {string} dfspCurrency Three-letter currency string, e.g. EUR
 *
 * @returns {number} settlementId
 */
const settlementIdFromHubAccounts = (hubAccounts, dfspCurrency) => hubAccounts
    .filter((account) => account.currency === dfspCurrency.toUpperCase())
    .find((account) => account.ledgerAccountType === 'SETTLEMENT')
    .id;

/**
 * Returns an array with args to get accounts for a given DFSP associated with the hub.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.authToken
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 * ß
 * @returns {array} url, requestOptions
 */
function getDfspAccounts({
    dfspName,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const requestOptions = {
        method: 'GET',
        headers,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/accounts`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to add a DFSP.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCurrency Three-letter currency string, e.g. EUR
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addDfsp({
    dfspName,
    dfspCurrency,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        name: dfspName,
        currency: dfspCurrency,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = '/participants';

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to add initial position and limits.
 *
 * @param options
 * @oaram {string} options.dfspName
 * @param {string} options.dfspCurrency Three-letter currency string, e.g. EUR
 * @param {number} [options.netDebitCap] Initial Net Debit Cap. Defaults to 10000.
 * @param {number} [options.initialPosition] Initial NDC position. Defaults to 0.
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addInitialPositionAndLimits({
    dfspName,
    dfspCurrency,
    netDebitCap = 10000,
    initialPosition = 0,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        currency: dfspCurrency,
        limit: {
            type: 'NET_DEBIT_CAP',
            value: netDebitCap,
        },
        initialPosition,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/initialPositionAndLimits`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to deposit funds.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCurrency Three-letter currency string, e.g. EUR
 * @param {number} options.amount
 * @param {string} options.transferId A UUID v4 string to identify the transfer
 * @param {string} options.settlementAccountId
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function depositFunds({
    dfspName,
    dfspCurrency,
    amount,
    transferId,
    settlementAccountId,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        transferId,
        externalReference: 'string',
        action: 'recordFundsIn',
        reason: 'string',
        amount: {
            amount,
            currency: dfspCurrency,
        },
        extensionList: {
            extension: [{
                key: 'string',
                value: 'string',
            }],
        },
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/accounts/${settlementAccountId}`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTICIPANT PUT.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackParticipantPut({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/participants/{{partyIdType}}/{{partyIdentifier}}`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTICIPANT_PUT',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTICIPANT PUT ERROR.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackParticipantPutError({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/participants/{{partyIdType}}/{{partyIdentifier}}/error`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTICIPANT PUT Batch.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackParticipantPutBatch({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/participants/{{requestId}}`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTICIPANT PUT Batch Error.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackParticipantPutBatchError({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/participants/{{requestId}}/error`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT_ERROR',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTIES GET.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackPartiesGet({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/parties/{{partyIdType}}/{{partyIdentifier}}`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTIES_GET',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTIES PUT.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackPartiesPut({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/parties/{{partyIdType}}/{{partyIdentifier}}`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTIES_PUT',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for PARTIES PUT Error.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackPartiesPutError({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/parties/{{partyIdType}}/{{partyIdentifier}}/error`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_PARTIES_PUT_ERROR',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns a fetch-arguments formatted array to add callback for QUOTES.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackQuotes({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_QUOTES',
        value: dfspCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to add callback for TRANSFER POST.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackTransferPost({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/transfers`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_POST',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to add callback for TRANSFER PUT.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackTransferPut({
    dfspName,
    dfspCallbackUrl,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    authToken, fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/transfers/{{transferId}}`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_PUT',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to add callback for TRANSFER Error.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.dfspCallbackUrl
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function addCallbackTransferError({
    dfspName,
    dfspCallbackUrl,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const fullCallbackUrl = `${dfspCallbackUrl}/transfers/{{transferId}}/error`;

    const body = JSON.stringify({
        type: 'FSPIOP_CALLBACK_URL_TRANSFER_ERROR',
        value: fullCallbackUrl,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to set the email alerted after an NDC adjustment.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.email
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function setEmailNetDebitCapAdjustment({
    dfspName,
    email,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        type: 'NET_DEBIT_CAP_ADJUSTMENT_EMAIL',
        value: email,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to set the email alerted after a transfer position change.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.email
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function setEmailSettlementTransferPositionChange({
    dfspName,
    email,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        type: 'SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL',
        value: email,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

/**
 * Returns an array with args to set the email alerted after an NDC threshold breach.
 *
 * @param options
 * @param {string} options.dfspName
 * @param {string} options.email
 * @param {string} options.authToken Hub account authorization token
 * @param {string} options.hostCentralLedger
 * @param {string} [options.baseCentralLedgerAdmin]
 * @param {string} [options.fspiopSource]
 *
 * @returns {array} url, requestOptions
 */
function setEmailNetDebitCapThresholdBreach({
    dfspName,
    email,
    authToken,
    hostCentralLedger,
    baseCentralLedgerAdmin = '/admin/1.0',
    fspiopSource = 'hub_operator',
}) {
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Content-Type', 'application/json');
    headers.append('FSPIOP-Source', fspiopSource);
    headers.append('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify({
        type: 'NET_DEBIT_CAP_THRESHOLD_BREACH_EMAIL',
        value: email,
    });

    const requestOptions = {
        method: 'POST',
        headers,
        body,
        redirect: 'follow',
    };

    const endpoint = `/participants/${dfspName}/endpoints`;

    const url = `${hostCentralLedger}${baseCentralLedgerAdmin}${endpoint}`;

    return [url, requestOptions];
}

module.exports = {
    sendRequest,
    settlementIdFromHubAccounts,
    getDfspAccounts,
    addDfsp,
    addInitialPositionAndLimits,
    depositFunds,
    addCallbackParticipantPut,
    addCallbackParticipantPutError,
    addCallbackParticipantPutBatch,
    addCallbackParticipantPutBatchError,
    addCallbackPartiesGet,
    addCallbackPartiesPut,
    addCallbackPartiesPutError,
    addCallbackQuotes,
    addCallbackTransferPost,
    addCallbackTransferPut,
    addCallbackTransferError,
    setEmailNetDebitCapAdjustment,
    setEmailSettlementTransferPositionChange,
    setEmailNetDebitCapThresholdBreach,
};
