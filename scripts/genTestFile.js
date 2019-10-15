const fs = require('fs');
const path = require('path');
const { xml2js, js2xml } = require('xml-js');
const model = require('../src/settlement/util');
const support = require('../test/_support');
// eslint-disable-next-line import/no-unresolved
const accounts = require('./accounts.json');
// accounts.json looks like:
// {
//     "MTN": "1234567890",
//     "Orange": "1234567890"
// }


const input = support.genInput({ maxTx: 1, currency: () => 'XOF', fixed: 0 });

const dfspConf = support.genDfspConf(input.participants);
dfspConf[Object.keys(dfspConf)[0]].name = 'MTN mobile financial services';
dfspConf[Object.keys(dfspConf)[0]].accountId = accounts.MTN;
dfspConf[Object.keys(dfspConf)[1]].name = 'Orange Money Cote d\'Ivoire ( OMCI)';
dfspConf[Object.keys(dfspConf)[1]].accountId = accounts.Orange;
const template = xml2js(fs.readFileSync(path.resolve(__dirname, '../src/settlement/template_file.xml')).toString(), { compact: true });

const result = js2xml(
    model.format(model.minPaymentsAlgorithm(input), dfspConf, template, 558),
    { compact: true, spaces: 2 },
);
console.log(result);
