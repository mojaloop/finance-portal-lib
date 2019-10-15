/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const chance = new require('chance')();
const test = require('ava');
const algo = require('../src/settlement').util.minPaymentsAlgorithm;
const support = require('./_support');
const currencies = require('../src/settlement/currencies.json');
const Decimal = require('decimal.js');
Decimal.set({ precision: 22 });
// global.crypto = require('crypto');
// Decimal.set({ crypto: true });

test('Test simple input', t => {
    const [ dr, cr ] = support.randomSwitchCurrencyPair();
    const input = support.genInput({ data: () => [{ id: 1, amount: dr }, { id: 2, amount: cr }] });
    const { matrix } = algo(input);
    t.deepEqual(matrix, { '1': { '2': dr } }, 'Check result is as expected');
});

test('Check simple change of input ordering', t => {
    const [ dr, cr ] = support.randomSwitchCurrencyPair();
    const input = support.genInput({ data: () => [{ id: 1, amount: cr }, { id: 2, amount: dr }] });
    const { matrix } = algo(input);
    t.deepEqual(matrix, { '2': { '1': dr } }, 'Check result is as expected');
});

test('Check duplicate participants throws an error', t => {
    const [ x, y ] = support.randomSwitchCurrencyPair();
    const input = support.genInput({ data: () => [{ id: 1, amount: x }, { id: 1, amount: y }] });
    t.throws(algo.bind(null, input), 'Participant appears more than once in settlement');
});

test('Check mixed currencies throws an error', t => {
    // 50 random strings means almost no chance of all currencies being the same
    const input = support.genInput({ minTx: 50, maxTx: 50, currency: () => chance.string(), fixed: 0 });
    t.throws(algo.bind(null, input), 'Not all currencies are the same');
});

test('Check invalid currency throws an error', t => {
    const curr = 'ABCD'; // none have a four-digit code
    const data = () => support.genDataSimple({ maxTx: 1, minTx: 1 });
    const input = support.genInput({ currency: () => curr, data, fixed: 0 });
    t.throws(algo.bind(null, input), new RegExp(`Unsupported currency ${curr}. Add a new currency to currencies\.json`));
});

test('Check invalid settlement amount throws an error', t => {
    const curr = 'USD';
    const data = () => support.genDataSimple({ maxTx: 1, minTx: 1 }).map(v => ({ ...v, amount: v.amount + '12345' }));
    const input = support.genInput({ currency: () => curr, data });
    t.throws(algo.bind(null, input),
        new RegExp(`${curr} allows ${currencies[curr].dp} decimal places. Participants \\d+, \\d+ have invalid settlement amounts of -?\\d+(\\.\\d+)?, -?\\d+(\\.\\d+)? respectively.*`));
});

test('Check non-zero-sum amounts throw an error', t => {
    const data = () => support.genDataSimple({ minTx: 10 }).map(v => ({ ...v, amount: Decimal(v.amount).plus(chance.integer()) }));
    const input = support.genInput({ data });
    t.throws(algo.bind(null, input), /Creditors and debtors do not sum to zero, they sum to -?\d+(\.\d+)?/);
});

test('Test invalid input missing creditors', t => {
    const [ x, y ] = support.randomSwitchCurrencyPair();
    let input = support.genInput({ data: () => [{ id: 1, amount: x }, { id: 2, amount: y }] });
    input.participants.pop();
    t.throws(algo.bind(null, input), /Creditors and debtors do not sum to zero, they sum to -?\d+(\.\d+)?/);
});

test('Test pathological floating-point values', t => {
    // # node
    // > -0.3 + 0.2
    // -0.09999999999999998
    // > -0.3 + 0.1
    // -0.19999999999999998
    // > 0.1 - 0.3
    // -0.19999999999999998
    // > 0.2 - 0.3
    // -0.09999999999999998
    const input = support.genInput({ data: () => [
        { id: 1, amount: '0.1' },
        { id: 2, amount: '0.2' },
        { id: 3, amount: '-0.3' }
    ]});
    let matrix;
    t.notThrows(() => { matrix = algo(input).matrix; }, 'hello');
    t.deepEqual(matrix, { '1': { '3': '0.1' }, '2': { '3': '0.2' } });
});

test('Fuzz', t => {
    // TODO: we _must_ output the failed input whenever a fuzz test fails such that the person
    // tasked with investigating the failure is able to reproduce the failure. Perhaps we should
    // print it to a file? Actually, this applies to all of these tests with their randomly
    // generated input.
    const { credits, debits, totalDebit } = support.genData({ maxTx: 500 });
    const input = support.genInput({ data: () => [ ...credits, ...debits ].sort(support.randomly) });

    // Run algo
    const { matrix } = algo(input);

    // A couple of utilities for the following assertions
    const sumArr = a => a.reduce((pv, cv) => pv.plus(cv), Decimal(0));
    const /* sort */ byId = (a, b) => a.id - b.id;

    // Check all creditors are fully paid
    const resultCreditors = Object.entries(
        Object.values(matrix).reduce((pv, cv) =>
            Object.entries(cv).reduce((pv2, [k, v]) =>
                ({ ...pv2, [k]: Decimal(pv[k] || 0).minus(v).toString() }), pv), {}))
        .map(([id, amount]) => ({ id: Number.parseInt(id), amount }));
    t.deepEqual(resultCreditors.sort(byId), credits.sort(byId), 'Check all creditors are fully paid.');

    // Check all debtors payments sum to their debt
    const debtorPayments = Object.entries(matrix).map(([id, payments]) =>
        ({ id: Number.parseInt(id), amount: sumArr(Object.values(payments)).toString() }));
    t.deepEqual(debtorPayments.sort(byId), debits.sort(byId), 'Check all debtors payments sum to their debt');

    // Check the total payments equal the total expected payments
    const totalResultPayments = sumArr(Object.values(matrix).map(Object.values).map(sumArr));
    t.true(totalDebit.eq(totalResultPayments), 'Total payments equal total debits');
});
