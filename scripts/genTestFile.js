const fs = require('fs');
const path = require('path');
const { xml2js, js2xml } = require('xml-js');
const model = require('../src/settlement/util');
const support = require('../test/_support');
// eslint-disable-next-line import/no-unresolved
const accounts = require('./accounts.json');
// accounts.json looks like:
// {
//     "dfsp1": "1234567890",
//     "dfsp2": "1234567890"
// }


const input = support.genInput({ maxTx: 1, currency: () => 'XOF', fixed: 0 });

const dfspConf = support.genDfspConf(input.participants);
dfspConf[Object.keys(dfspConf)[0]].name = 'dfsp1 test fsp';
dfspConf[Object.keys(dfspConf)[0]].accountId = accounts.dfsp1;
dfspConf[Object.keys(dfspConf)[1]].name = 'dfsp2 test fsp';
dfspConf[Object.keys(dfspConf)[1]].accountId = accounts.dfsp2;
const template = xml2js(fs.readFileSync(path.resolve(__dirname, '../src/settlement/template_file.xml')).toString(), { compact: true });

const result = js2xml(
    model.format(model.minPaymentsAlgorithm(input), dfspConf, template, 558),
    { compact: true, spaces: 2 },
);
// eslint-disable-next-line no-console
console.log(result);
