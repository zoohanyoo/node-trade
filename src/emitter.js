//cli命令处理模块
//
//日期：2014/12/19
//作者：bo
var fs = require('fs');
var path = require('path');
var events = require('events');
var chalk = require('chalk');
var settings = require('./settings.js');

var emitter = new events.EventEmitter();
global.emitter = emitter;

emitter.on('prompt',function(){
    global.rl.prompt();
});

emitter.on('connect', function(){
    global.trader.connect(settings.Trader_Front_Addr,undefined,settings.Public_Topic_Type,settings.Private_Topic_Type,function(result){
        if(result!=0)
            console.log(chalk.red('初始化失败'));
    });
});

emitter.on('help',function(){
    var buffer =fs.readFileSync(path.resolve(__dirname,'help'));
    var data = buffer.toString("utf8");
    var fast = '';
    for(var fk in settings.INSERT){
        var f = settings.INSERT[fk];
        console.log(JSON.stringify(f));
        fast = fast+'合约:'+f.instrument+' 价格类型:'+f.priceType+' '+fk+' <-q> -q:数量'+'\n';
    }
    data = data+fast;
    console.log(chalk.blue(data));
});

emitter.on('echo',function(){
    console.log(chalk.red(JSON.stringify(settings)));
});

emitter.on('clear',function(){
    clear();
    console.log('clear');
});

emitter.on('instrument',function(instrumentID){
    global.trader.reqQryInstrument(instrumentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查询合约失败'));
    });
});
emitter.on('account',function(){
    global.trader.reqQryTradingAccount(settings.BrokerID,settings.InvestorID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查询资金账户失败'));
    });
});

emitter.on('confirm',function(){
    global.trader.reqSettlementInfoConfirm(settings.BrokerID,settings.InvestorID,function(result){
        if(result!=0)
             console.log(chalk.red('请求确认结算失败'));
    });
});
emitter.on('posi',function(instrumentID){
    cachePosition = [];
    global.trader.reqQryInvestorPosition(settings.BrokerID,settings.InvestorID,instrumentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查持仓信息失败'));
    });
});
emitter.on('p-detail',function(instrumentID){
    global.trader.reqQryInvestorPositionDetail(settings.BrokerID,settings.InvestorID,instrumentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求持仓明细信息失败'));
    });
});

emitter.on('disconnect',function(orderId,quantity){
    global.trader.disconnect();
});

emitter.on('data',function(instrument){
    global.trader.reqQryDepthMarketData(instrument,function(result){
        console.log('rqDdpthmarketData return val is '+result);
    });
});
