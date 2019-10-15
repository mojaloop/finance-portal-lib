/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const chance = new require('chance')();
const util = require('util');
const Decimal = require('decimal.js');
const currencies = require('../src/settlement/currencies.json');

// Some constants that can be configured
const numAfterDecimal = 2;
const numBeforeDecimal = 10;
const precision = numAfterDecimal + numBeforeDecimal;

Decimal.set({ precision });
// Possible to have Decimal use crypto RNG by uncommenting the following two lines
// global.crypto = require('crypto');
// Decimal.set({ crypto: true });

const /* sort */ randomly = () => Math.random() - 0.5;

// JS floating point number with decimal precision of 4
const randomSwitchCurrency = ({ max = Decimal(10).pow(numBeforeDecimal), min = Decimal(0), fixed = numAfterDecimal } = {}) =>
    Decimal.random(Decimal(max).logarithm(10).ceil().plus(fixed).toNumber())
        .mul(Decimal(max).minus(min))
        .plus(min)
        .toDP(fixed);
const randomSwitchCurrencyPair = opts => {
    const amt = randomSwitchCurrency(opts);
    return [ amt, amt.negated() ].map(v => v.toString());
};

const randomCurrenciesWithoutDuplicates = ({ fixed = numAfterDecimal, min = 0, max, n } = {}) => {
    if (((n - 1) * (10 ** -fixed)) > Math.abs(max - min)) {
        throw new Error(util.format('Impossible to generate', n, 'random numbers between', min, 'and', max, 'with', fixed, 'decimal places'));
    }
    const getRand = () => randomSwitchCurrency({ min, max, fixed });
    const findDuplicateIndices = arr => arr.map((e, i) => arr.filter(v => v.eq(e)).length > 1 ? i : -1).filter(e => e !== -1);
    let result = Array.from({ length: n }, getRand);
    let dupes;
    while ((dupes = findDuplicateIndices(result)).length > 0) {
        dupes.forEach(d => result[d] = getRand());
    }
    return result;
};

const partitionFloat = (num, numParts, fixed = numAfterDecimal) => {
    const delta = (10 ** -fixed);
    const opts = {
        min: delta,
        max: num.abs().minus(delta),
        fixed,
        n: numParts - 1
    };
    const sequence = [0, ...randomCurrenciesWithoutDuplicates(opts).sort((a, b) => a.minus(b)), num].map(Decimal);
    let rands = [];
    for (let i=1; i<sequence.length; i++) {
        rands.push(sequence[i].minus(sequence[i-1]));
    }
    return rands;
};

const genData = ({ minTx = 1, maxTx = Math.max(5, minTx), fixed } = {}) => {
    // Generate a random set of debtor and creditor IDs, randomly between 1 and 500. Not the same
    // number of creditors and debtors.
    const genIds = () => Array.from({ length: chance.integer({ min: minTx, max: maxTx }) }, () => chance.integer({ min: 0 }));
    const debtorIds = genIds();
    const creditorIds =  genIds();

    // Generate a random number as the total settlement amount. The minimum value ensures the value
    // is divisible such that every creditor or debtor pays or receives at least 0.01.
    const totalDebit = randomSwitchCurrency({ min: Decimal(Math.max(debtorIds.length, creditorIds.length)).mul(0.01), fixed });
    const totalCredit = totalDebit.negated();

    // Assign amounts to ids
    const debits = partitionFloat(totalDebit, debtorIds.length, fixed)
        .map((v, i) => ({ id: debtorIds[i], amount: v.toString() }));
    const credits = partitionFloat(totalDebit, creditorIds.length, fixed)
        .map((v, i) => ({ id: creditorIds[i], amount: v.negated().toString() }));
    return { debits, credits, totalDebit, totalCredit }; // [ ...debits, ...credits ];
};

const genDataSimple = opts => {
    const { credits, debits } = genData(opts);
    return [ ...credits, ...debits ].sort(randomly);
};

const genInput = ({
    settlementId = () => chance.integer(),
    currency = () => 'USD',
    createdDate = () => chance.date().toISOString(),
    changedDate = () => chance.date().toISOString(),
    minTx = 1, // at least this number of each of debits and credits
    maxTx = 5, // at most this number of each of debits and credits
    fixed = currencies[currency()].dp, // number of decimal places to use when generating random currency amounts
    data = () => genDataSimple({ maxTx, minTx, fixed })
} = {}) => ({
    id: settlementId,
    state: 'SETTLED',
    settlementWindows: // TODO: can there be more than one?
    [ { id: chance.integer(),
        state: 'SETTLED',
        reason: 'All settlement accounts are settled',
        createdDate: createdDate(),
        changedDate: changedDate() } ],
    participants: data().map(({ id, amount }) => ({
        id,
        accounts: [{ id: chance.integer({ min: 0 }), netSettlementAmount: { amount, currency: currency() } }]
    }))
});

// The parameter 'participants' comes from genInput().participants
const genAccountId = () => 10 ** 9 + Math.floor(Math.random() * (10 ** 10 - 10 ** 9)); // randomised ten digit positive integer
const genDfspConf = participants => participants.reduce((pv, cv) => ({
    ...pv,
    [cv.id]: {
        name: `DFSP-${cv.id}`,
        country: 'CI',
        accountId: genAccountId()
    }
}), {});

module.exports = {
    randomly,
    randomSwitchCurrency,
    randomSwitchCurrencyPair,
    randomCurrenciesWithoutDuplicates,
    partitionFloat,
    genData,
    genDataSimple,
    genInput,
    genDfspConf
};
