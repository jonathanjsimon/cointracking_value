var fs = require('fs');
const os = require('os');
var crypto = require('crypto');
var fetch = require('node-fetch');
var moment = require('moment');
var FormData = require('form-data');
var http_build_query = require('qhttp/http_build_query');

function getConfigPath()
{
    var homePath = os.homedir();
    return homePath + "/.cointracking/config.json";
}

// This function borrowed from https://github.com/bpirson/cointracking-example-NodeJs
async function coinTracking(method, params) {
    var paramsSafety = params || {};
    params = paramsSafety;

    params.method = method;
    params.nonce = moment().unix();

    var post_data = http_build_query(params, {leave_brackets: false});

    var hash = crypto.createHmac('sha512', secret);
    hash.update(post_data);
    var sign = hash.digest('hex');

    var headers =  { 'Key': key, 'Sign': sign};

    var form = new FormData();
    for(var paramKey in params) {
        var value = params[paramKey];
        form.append(paramKey, value);
    }

    var result = await fetch(url, {
        method: 'POST',
        body:   form,
        headers: headers,
    });
    var json = await result.json();
    return json;
}

async function getBalance() {
    var res = await coinTracking('getBalance');
    return res;
}

async function getAccountValue(precision) {
    if (precision === undefined)
    {
        precision = 2;
    }

    var res = await getBalance();
    var summary = res.summary;
    var profit = Number(summary.profit_fiat).toFixed(precision);

    return profit;
}

async function getTrades() {
    var params={};
    params.limit=200;

    var res = await coinTracking('getTrades', params);
    console.log(res);
}

const url = "https://cointracking.info/api/v1/";

var config = JSON.parse(fs.readFileSync(getConfigPath()));

const key = config.key;
const secret = config.secret;

async function main()
{
    var res = await getBalance();

    var currency = res.account_currency;

    var summary = res.summary;
    var value_fiat = Number(summary.value_fiat).toFixed(2);
    var profit_fiat = Number(summary.profit_fiat).toFixed(2);

    console.log(value_fiat + " (" + profit_fiat + ")");

}

// console.log(os.homedir());
main();