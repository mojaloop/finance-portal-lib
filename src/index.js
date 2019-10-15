/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const settlement = require('./settlement/index');
const admin = require('./admin/index');
const requests = require('./requests/requests');

module.exports = {
    settlement,
    admin,
    requests
};
