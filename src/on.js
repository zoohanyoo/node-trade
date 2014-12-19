//向Treader注册接收事件
//
//日期：2014/12/19
//作者：bo
var chalk = require('chalk');
var tools = require('./tools');
var report = require('./report');

var isErrorRspInfo = tools.isErrorRspInfo;
var printAccount = report.printAccount;
var printPostion = report.printPosition;

var frontId;
var sessionId;
var cachePosition = [];

var on_error = function(requestId,isLast,info){
    console.log(chalk.red('ERROR.........................'));
    console.log(chalk.red(JSON.stringify(info)));
}
var on_connect = function(result){
    global.trader.reqUserLogin(settings.BrokerID,settings.InvestorID,settings.PWD,function(result){
        if(result!=0)
            console.log(chalk.red('请求登录失败'));
    });
};
var on_userlogin = function(requestId,isLast,field,info){
    var result = isErrorRspInfo(info);
    if(!result && isLast){
        var tradingDay = global.trader.getTradingDay();
        frontId = field.FrontID;
        sessionId = field.SessionID;
        orderRef = field.MaxOrderRef;
        global.emitter.emit('confirm');
    }
};
var on_settlementConfirm = function(requestId,isLast,field,info){
    var result = isErrorRspInfo(info);
    if(!result && isLast){
        console.log(chalk.green('结算单已确认'));
        global.emitter.emit('account');
    }
};
var on_rqInstrument = function(requestId,isLast,field,info){
    console.log(field);
    console.log(info);
};
var on_tradingAccount = function(requestId,isLast,field,info){
    console.log(field);
    console.log(info);
    var result = isErrorRspInfo(info);
    if(field!=undefined){
        if(!result && isLast){
            printAccount(field);
        }
    }
};
var on_investorPosition = function(requestId,isLast,field,info){
    if(field!=undefined){
        var result = isErrorRspInfo(info);
        if(!result){
            cachePosition.push(field);
            if(isLast == 1)
                printPosition(cachePosition);
        }
    }
};
var on_investorPositionDetail = function(requestId,isLast,field,info){
    if(field!=undefined){
        var result = isErrorRspInfo(info);
        if(!result && !field){

        }
    }
};
var on_rspQryOrder = function(requestId,isLast,field,info){

};
var on_rspQryTrade = function(requestId,isLast,field,info){

};
var on_frontDisconnected = function(reason){
    console.log('连接断开，原因：'+reason);
};
var on_rspUserLogout = function(requestId,isLast,field,info){

};
var on_rspQryDepthMarketData = function(requestId,isLast,field,info){
    console.log(field);
    console.log(info);
};

global.trader.on('rspError',on_error);//调用错误
global.trader.on('connect',on_connect);//连接
global.trader.on('rspUserLogin',on_userlogin);//登陆
global.trader.on('rspInfoconfirm',on_settlementConfirm);//结算确认
global.trader.on('rqInstrument',on_rqInstrument);//查询合约
global.trader.on('rqTradingAccount',on_tradingAccount);//查询账户
global.trader.on('rqInvestorPosition',on_investorPosition);//查询持仓信息
global.trader.on('rqInvestorPositionDetail',on_investorPositionDetail);//持仓详细信息
global.trader.on('rqOrder',on_rspQryOrder);
global.trader.on('rqTrade',on_rspQryTrade);
global.trader.on('disconnected',on_frontDisconnected);
global.trader.on('rspUserLogout',on_rspUserLogout);
global.trader.on('rqDdpthmarketData',on_rspQryDepthMarketData);
