/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const Big = require('big.js');
const crypto = require('crypto');
const util = require('util');
const currencies = require('./currencies.json');
const fs = require('fs');
const { xml2js, js2xml } = require('xml-js'); // converts between xml, pojo, json
const path = require('path');

module.exports = {
    minPaymentsAlgorithm,
    format,
    currencies,
    generatePaymentFile
};

function generatePaymentFile(settlementWindowId, input, dfspConf, templateFile = path.resolve(__dirname, 'template_file.xml')) {
    const template = xml2js(
        fs.readFileSync(templateFile).toString(),
        { compact: true });
    const raw = minPaymentsAlgorithm(input);
    return js2xml(format(raw, dfspConf, template, settlementWindowId), { compact: true, spaces: 2 });
}

/**
 * Implements an algorithm to determine the minimum payments matrix for a set of debtors and
 * creditors. Input format is the output of /settlements/${id}. There is a test input generator in
 * test support.
 *
 * @returns {object}
 */
function minPaymentsAlgorithm(input) {
    /*
        there are a few algorithms in the public domain that accomplish
        the task of minimising the number of money movements between a set
        of debtors and creditors. A google search will reveal the landscape.
        most are variations on a common theme thus:

        some validation is required in this case:
        1. the TOTAL of debitors and creditors net amounts MUST sum to zero
        2. all accounts must be of the same currency
        3. only one account per participant (this may change in future)
    */

    //work out the minimal set of transfers to settle

    //start by projecting our participants into net amount order
    let participants = input.participants
        .map(p => ({
            id: p.id,
            acctId: p.accounts[0].id,
            amount: Big(p.accounts[0].netSettlementAmount.amount),
            cur: p.accounts[0].netSettlementAmount.currency
        }))
        .sort((a, b) => a.amount.cmp(b.amount));

    //do some validation

    //check we have some participants to settle between
    if (input.participants.length === 0) {
        throw new Error('No participants in settlement');
    }

    //no duplicate participants
    participants.forEach(p => {
        if (participants.findIndex(q => q.id === p.id && !Object.is(p, q)) !== -1) {
            throw new Error('Participant appears more than once in settlement');
        }
    });

    //all currencies the same?
    if(!participants.every(p => p.cur === participants[0].cur)) {
        throw new Error('Not all currencies are the same');
    }
    const currency = currencies[participants[0].cur];

    //currency is valid
    if (currency === undefined) {
        throw new Error(`Unsupported currency ${participants[0].cur}. Add a new currency to currencies.json.`);
    }

    //check the input has a valid number of decimal places
    const currErrs = participants.filter(p => !p.amount.round(currency.dp).eq(p.amount));
    if (currErrs.length > 0) {
        throw new Error(util.format(participants[0].cur, 'allows', currency.dp,
            'decimal places. Participants', currErrs.map(p => p.id).join(', '),
            'have invalid settlement amounts of', currErrs.map(p => p.amount.toString()).join(', '),
            'respectively. See currencies.json in this package and ISO 4217 for more.'));
    }

    //sum to zero?
    let sum = participants.reduce((a, c) => a.plus(c.amount), Big(0));
    if(!sum.eq(0)) {
        throw new Error(`Creditors and debtors do not sum to zero, they sum to ${sum}`);
    }

    //only one account per participant?
    input.participants.forEach(p => {
        if(p.accounts.length > 1) {
            throw new Error(`Participant has more than one account in settlement: ${util.inspect(p)}`);
        }
    });

    //ok to proceed
    const splitIndex = participants.findIndex(p => p.amount.gt(0));
    let debtors = participants.splice(splitIndex); // WARNING: modifies participants
    let creditors = participants; // correct because the above line modifies participants
    let matrix = debtors.reduce((o, d) => ({ [d.id]: {}, ...o }), {});
    while (creditors.length > 0) {
        let creditor = creditors.pop();
        // If there are unpaid creditors and the smallest remaining balance is less than or equal
        // to the remaining amount payable by our current debtor
        while (debtors.length > 0 && creditor.amount.plus(debtors[debtors.length - 1].amount).lte(0)) {
            const exhaustedDebtor = debtors.pop();
            matrix[exhaustedDebtor.id][creditor.id] = exhaustedDebtor.amount.toString();
            creditor.amount = creditor.amount.plus(exhaustedDebtor.amount);
        }
        // If we haven't fully paid our creditor, take some money from the next debtor
        if (creditor.amount.lt(0)) {
            const partiallyExhaustedDebtor = debtors[debtors.length - 1];
            matrix[partiallyExhaustedDebtor.id][creditor.id] = creditor.amount.times(-1).toString();
            partiallyExhaustedDebtor.amount = partiallyExhaustedDebtor.amount.plus(creditor.amount);
        }
    }

    if (debtors.length > 0) {
        throw new Error('Failed to balance payments');
    }

    // TODO: a bunch more validation, e.g. checking the sum of the payment amounts in the
    // result equals the sum of the payment amounts in the input. Checking that all debtors and
    // creditors are represented, etc. Note: this does _not_ have to be an efficient piece of
    // software. Further note: a lot of the infrastructure for this validation exists in the tests;
    // it could be reproduced/used here.

    return { currency: input.participants[0].accounts[0].netSettlementAmount.currency, matrix };
}

/*
 * <Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
 */
function format({ matrix, currency }, dfspConf, template, windowId) {

    // cursory check that we've got a/the correct file
    if (template.Document._attributes.xmlns !== 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03') {
        throw new Error('Template file appears not to have correct document attributes');
    }

    // Flatten the payment matrix
    const paymentsArr = Object.entries(matrix).reduce((pv, [payer, payments]) => 
        [ ...pv, ...Object.entries(payments).map(([payee, amt]) => ({ payer, payee, amt })) ],
        []);

    // Check required information is present
    paymentsArr.forEach(({ payer, payee }) => {
        if (!(payer in dfspConf)) {
            throw new Error(util.format('Couldn\'t find DFSP with id', payer, 'in DFSP config'));
        }
        if (!(payee in dfspConf)) {
            throw new Error(util.format('Couldn\'t find DFSP with id', payee, 'in DFSP config'));
        }
    });

    // Modify header
    // let grpHdr = template.elements[0].elements[0].elements.find(e => e.name === 'GrpHdr');
    const now = new Date();
    const nowDate = now.toISOString().split('T')[0];
    let grpHdr = template.Document.CstmrCdtTrfInitn.GrpHdr;
    // 1 / (64 ^ 35) chance of collision, or, for five settlements per week, MTBF of
    // (((1 / (64 ^ 35)) / 2) / 5) weeks, or roughly 3.2e60 years. So probably not in our lifetimes.
    // Additionally, the failure mode is rejection of the output file by Citibank, citing a
    // duplicate message header id. Which can be overcome by regeneration of the file with a new ID.
    // If you're reading this comment in the extremely distant future, I'm sorry.
    grpHdr.MsgId._text = crypto.randomBytes(27).toString('base64').substring(0, 35);
    grpHdr.CreDtTm._text = now.toISOString();
    grpHdr.NbOfTxs._text = paymentsArr.length;
    grpHdr.CtrlSum._text = paymentsArr.reduce((pv, cv) => pv.plus(cv.amt), Big(0)).toString();

    // Map our payments array into the required output format
    // Get a payment object from the template
    const pmtInfTemplate = template.Document.CstmrCdtTrfInitn.PmtInf;
    const creditInfTemplate = pmtInfTemplate.CdtTrfTxInf[0];

    // for all CdtTrfTxInf, we want the RmtInf.Ustrd field to contain the settlement window ID, so we modify the template here
    template.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.forEach(acc => acc.RmtInf.Ustrd._text = `Settlement Window ${windowId}`);
    
    const pmtInf = Object.entries(matrix).map(([payer, payments], i) => ({
        ...pmtInfTemplate,
        // TODO: Does PmtInfId need to be 'universally unique' or unique within the context of this PmtInf
        PmtInfId: i.toString(),
        NbOfTxs: Object.keys(payments).length,
        CtrlSum: Object.values(payments).reduce((pv, cv) => pv.plus(cv), Big(0)).toString(),
        // TODO: required execution date, is it "today"?
        ReqdExctnDt: nowDate,
        Dbtr: {
            Nm: { _text: dfspConf[payer].name },
            PstlAdr: { Ctry: { _text: dfspConf[payer].country } },
            Id: { OrgId: { BICOrBEI: { _text: 'CITICIAX' } } } },
        DbtrAcct: {
            Id: { Othr: { Id: { _text: dfspConf[payer].accountId.replace(/^0*/,'') } } },
            Ccy: { _text: currency } },
        CdtTrfTxInf: Object.entries(payments).map(([payee, amount]) => ({
            ...creditInfTemplate,
            // TODO: Does PmtId need to be 'universally unique' or unique within the context of this CdtTrfTxInf
            PmtId: { EndToEndId: { _text: crypto.randomBytes(5).toString('hex') } }, // EndToEndId cannot be zero as specified by Peter Kamperman of Citi
            Amt: { InstdAmt: { _attributes: { Ccy: currency }, _text: amount.toString() } },
            Cdtr: {
                Nm: { _text: dfspConf[payee].name },
                PstlAdr: { Ctry: { _text: dfspConf[payee].country } },
                CtctDtls: { Nm: { _text: 'Casablanca JV Org' } } },
            CdtrAcct: { Id: { Othr: { Id: { _text: dfspConf[payee].accountId.replace(/^0*/,'') } } } } }))
    }));

    template.Document.CstmrCdtTrfInitn.PmtInf = pmtInf;

    return template;
}
