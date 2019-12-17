/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const qs = require('querystring');
const { get, put, post, HTTPResponseError } = require('../requests/requests');

// TODO: should probably split this api abstraction into settlementApi and settlement

class SettlementsModel {
    constructor(options) {
        this.options = options;

        if(!options.endpoint) {
            throw new Error('No endpoint configured');
        }
    }

    /**
     * Returns settlements based on the query provided.
     *
     * 'query' must contain at least one property, as per the settlements API. The 'query' object
     * will be passed directly to querystring.stringify. See the settlements API spec here (at the
     * time of writing):
     * https://github.com/mojaloop/central-settlement/blob/master/APIDefinition.md#get-settlements
     *
     * @returns {object}
     */
    async getSettlements(query) {
        if (Object.keys(query).length === 0) {
            return [];
        }
        const q = qs.stringify(query);
        try {
            return await get(`settlements?${q}`, this.options);
        } catch (e) {
            if (e instanceof HTTPResponseError &&
                e.getData().resp.statusCode === 404 &&
                e.getData().resp.message &&
                e.getData().resp.message.errorInformation &&
                e.getData().resp.message.errorInformation.errorDescription === 'Settlements not found') {
                return [];
            }
            throw e;
        }
    }


    /**
     * Returns the specified settlement object
     *
     * @returns {object}
     */
    async getSettlement(id) {
        return await get(`settlements/${id}`, this.options);
    }


    /**
     * Returns single settlement window for the given id
     *
     * @returns {object}
     */
    async getSettlementWindow(id) {
        return await get(`settlementWindows/${id}`, this.options);
    }

/**
     * Returns settlement windows based on the query provided.
     *
     * 'query' must contain at least one property, as per the settlements API. The 'query' object
     * will be passed directly to querystring.stringify. See the settlements API spec here (at the
     * time of writing):
     * https://github.com/mojaloop/central-settlement/blob/master/APIDefinition.md#get-settlementwindows
     *
     * @returns {object}
     */
    async getSettlementWindows(query) {
        if (Object.keys(query).length === 0) {
            throw new Error('getSettlementWindows: query must contain at least one parameter');
        }
        const q = qs.stringify(query);
        try {
            return await get(`settlementWindows?${q}`, this.options);
        } catch (e) {
            if (e instanceof HTTPResponseError &&
                e.getData().resp.statusCode === 404 &&
                e.getData().resp.message &&
                e.getData().resp.message.errorInformation &&
                e.getData().resp.message.errorInformation.errorDescription.match(/settlementWindow by filters.*not found/) !== null) {
                return [];
            }
            throw e;
        }
    }

    /**
     * Closes a settlement window
     *
     * @returns {object}
     */
    async closeSettlementWindow(id, reason) {
        return await post(`settlementWindows/${id}`, { state: 'CLOSED', reason: reason }, this.options);
    }

    /**
     * Creates a settlement including the specified windows
     *
     * @returns {object}
     */
    async createSettlement(reason, windows) {
        return await post('settlements', {
            reason,
            settlementWindows: windows.map(w => ({ id: Number(w) }))
        }, this.options);
    }

    /**
     * Modify the content of the specified settlement
     *
     * @returns {object}
     */
    async putSettlement(settlementId, body) {
        return await put(`settlements/${settlementId}`, body, this.options);
    }

    /**
     * Gets settlement files for a specific settlement window
     *
     * @returns {object}
     */
    async getSettlementFiles(windowId) {
        return await get(`settlementFile/${windowId}`, this.options);
    }

    /**
     * Creates a settlement file
     *
     * @returns {object}
     */
    async postSettlementFile(settlementId, settlementFile, source) {
        return await post('settlementFile', { settlementId, settlementFile, source }, this.options);
    }
}

module.exports = SettlementsModel;
