global.tenv = 'test';

var ctp = require('./node_modules/node-ctp/shifctp');
ctp.settings({log:true});
global.trader = ctp.createTrader();

var emitter = require('./src/emitter');
var on = require('./src/on');
var cli = require('./src/cli');

global.emitter.emit('connect');
console.info('Cli启动完成');
