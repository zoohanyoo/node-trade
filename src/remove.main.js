///////////////////////////////////////////////////////////////////require moudle
var fs = require('fs');
var events = require('events');
var readline = require('readline');
var ctp = require('./node_modules/node-ctp/shifctp');
var settings = require('./settings.js');
var db = require('./db.js');
var path = require('path');
var chalk = require('chalk');
var clear = require('clear');
///////////////////////////////////////////////////////////////////variable defind
var frontId;
var sessionId;
var pid = 0;//持仓计数器，作为主键
var emitter = new events.EventEmitter();
//var position = {};
//var fields = ['ID','instrunmentId','direction','offsetFlag','orderSysID','price','volume','tradeDate','tradeTime'];
//var fieldsRelationship = {'ID':'ID','instrunmentId':'合约','direction':'方向','offsetFlag':'开平标识','orderSysID':'':wq};
///////////////////////////////////////////////////////////////////init
ctp.settings({log:true});
//////////////////////////////////////////////////////////////////////////

emitter.on('prompt',function(){
    rl.prompt();
});

emitter.on('connect', function(){
    trader.connect(settings.Trader_Front_Addr,undefined,settings.Public_Topic_Type,settings.Private_Topic_Type,function(result){
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
        fast = fast+'合约:'+f.instrunment+' 价格类型:'+f.priceType+' '+fk+' <-q> -q:数量'+'\n';
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

emitter.on('instrunment',function(instrunmentID){
    trader.reqQryInstrument(instrunmentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查询合约失败'));
    });
});
emitter.on('account',function(){
    trader.reqQryTradingAccount(settings.BrokerID,settings.InvestorID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查询资金账户失败'));
    });
});

emitter.on('confirm',function(){
            trader.reqSettlementInfoConfirm(settings.BrokerID,settings.InvestorID,function(result){
                if(result!=0)
                    console.log(chalk.red('请求确认结算失败'));
            });
});
emitter.on('posi',function(instrunmentID){
    trader.reqQryInvestorPosition(settings.BrokerID,settings.InvestorID,instrunmentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查持仓信息失败'));
    });
});
emitter.on('p-detail',function(instrunmentID){
    trader.reqQryInvestorPositionDetail(settings.BrokerID,settings.InvestorID,instrunmentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求持仓明细信息失败'));
    });
});
//止损
emitter.on('stop',function(posiId,price,stopPrice,quantity){
    var posi = db.cacheDb.posi[posiId];
    if(!posi){
        console.log(chalk.red('没有持仓，止损失败！'));
        return;
    }
    if(quantity==undefined)
        quantity = posi.Position;
    var offsetFlag = '1';//平仓
    if(posi.TodayPosition!=0) {
        offsetFlag = '3';//平今
        quantity = posi.TodayPosition;//今仓
    }
    var args = {
        instrunmentId:posi.InstrumentID,
        direction:posi.Direction=='1'?'0':'1',
        quantity:quantity,
        limitPrice:price,
        priceType:'2',//限价单
        offsetFlag:offsetFlag,//平今或者平仓
        timeCondition:'3',//当日有效
        volumeCondition:'1',//任意数量
        minVolume:1,
        contingentCondition:'2',//止损
        stopPrice:stopPrice
    };
    orderInsert(args);
});
//平仓
emitter.on('close',function(posiId,price,quantity){
    var posi = db.cacheDb.posi[posiId];
    if(!posi){
        console.log(chalk.red('没有持仓，平仓失败！'));
        return;
    };
    var offsetFlag = '1';//平仓
    if(posi.TodayPosition!=0) {
        offsetFlag = '3';//平今
    }
    if(quantity==undefined)
        quantity = posi.Position;
    var args = {
        instrunmentId:posi.InstrumentID,
        direction:posi.Direction=='1'?'0':'1',
        quantity:quantity,
        limitPrice:price,
        priceType:'2',//限价单
        offsetFlag:offsetFlag,//平今或者平仓
        timeCondition:'3',//当日有效
        volumeCondition:'1',//任意数量
        minVolume:1,
        contingentCondition:'1'//立即
    };
    orderInsert(args);
});

emitter.on('action',function(id){
    var corder = db.cacheDb.consignation[id];
    if(corder){
        var inputOrder = {
            brokerId:settings.BrokerID,
            investorId:settings.InvestorID,
            instrunmentId:corder.InstrumentID,
            iexchangeID:corder.ExchangeID,
            orderSysID:corder.OrderSysID,
            frontId:corder.FrontID,
            sessionId:corder.SessionID,
            orderRef:corder.OrderRef,
            actionFlag:'0'
        };
        console.log(corder);
        console.log(inputOrder);
        trader.reqOrderAction(inputOrder,function(result){
            if(result!=0){
                console.log(chalk.red('撤销失败'));
            }
        });
    }else{
        console.log(chalk.red('没有委托，撤销失败！'));
    }
});

emitter.on('disconnect',function(orderId,quantity){
    trader.disconnect();
});


emitter.on('data',function(instrunment){
    trader.reqQryDepthMarketData(instrunment,function(result){
        console.log('rqDdpthmarketData return val is '+result);
    });
});
var trader = ctp.createTrader();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////trader on callback
var on_error = function(requestId,isLast,info){
    console.log(chalk.red('ERROR.........................'));
    console.log(chalk.red(JSON.stringify(info)));
}
var on_connect = function(result){
    trader.reqUserLogin(settings.BrokerID,settings.InvestorID,settings.PWD,function(result){
        if(result!=0)
            console.log(chalk.red('请求登录失败'));
    });
};
var on_userlogin = function(requestId,isLast,field,info){
    var result = isErrorRspInfo(info);
    if(!result && isLast){
        var tradingDay = trader.getTradingDay();
        frontId = field.FrontID;
        sessionId = field.SessionID;
        orderRef = field.MaxOrderRef;
        /*
        trader.reqQrySettlementInfo(settings.BrokerID,settings.InvestorID,tradingDay,function(result){
            if(result!=0)
                console.log(chalk.red('请求获取结算信息失败'));
        });*/
        emitter.emit('confirm');
    }
};
var on_rspQrySettlementInfo = function(requestId,isLast,field,info){
    var result = isErrorRspInfo(info);
    if(!result && isLast){ 
        if(!field)
            console.log(chalk.red('无结算信息'));
        else
            console.log(chalk.white(JSON.stringify(field)));
        if(isLast){
            trader.reqSettlementInfoConfirm(settings.BrokerID,settings.InvestorID,function(result){
                if(result!=0)
                    console.log(chalk.red('请求确认结算失败'));
            });
        }
    }
};
var on_settlementConfirm = function(requestId,isLast,field,info){
    var result = isErrorRspInfo(info);
    if(!result && isLast){
        console.log(chalk.green('结算单已确认'));
        emitter.emit('account');
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
    if(!result && isLast){
        /*
        settings.INSTRUNMENTID.forEach(function(instrunment){
            emitter.emit('posi',instrunment);
        });*/
    }
};
var on_investorPosition = function(requestId,isLast,field,info){
    console.log(info);
    var result = isErrorRspInfo(info);
    if(!result && !field){
        field.pid = pid;
        db.cacheDb.posi[pid] = field;
        pid = pid+1;
    }
    console.log(field);
};
var on_investorPositionDetail = function(requestId,isLast,field,info){
    console.log(field);
    console.log(info);
};
var on_rspOrderInsert = function(requestId,isLast,field,info){
    console.log('rspOrderInsert');
    console.log(field);
    console.log(info);
};
var on_errRtnOrderInsert = function(field,info){
    console.log(field);
    console.log(info);
};
var on_rspOrderAction = function(requestId,isLast,field,info){
    console.log('rspOrderAction');
    console.log(field);
    console.log(info);
};
var on_errRtnOrderAction = function(field,info){

};
var on_rspQryOrder = function(requestId,isLast,field,info){

};
var on_rtnOrder = function(field){
    console.log('rtnOrder');
    field.pid = pid;
    db.cacheDb.consignation[pid] = field;
    pid = pid + 1;
    console.log(field);
};
var on_rspQryTrade = function(requestId,isLast,field,info){

};
var on_rtnTrade = function(field){
    console.log('rtnTrade');
    field.pid = pid;
    db.cacheDb.deal[pid] = field;
    pid = pid + 1;
    console.log(field);
};
var on_frontDisconnected = function(reason){

};
var on_rspUserLogout = function(requestId,isLast,field,info){

};
var on_rspQryDepthMarketData = function(requestId,isLast,field,info){
    console.log(field);
    console.log(info);
};

////////////////////////////////////////////////////////////////////////////////////////////////trader on event

trader.on('rspError',on_error);//调用错误
trader.on('connect',on_connect);//连接
trader.on('rspUserLogin',on_userlogin);//登陆
trader.on('rqSettlementInfo',on_rspQrySettlementInfo);//请求结算     
trader.on('rspInfoconfirm',on_settlementConfirm);//结算确认
trader.on('rqInstrument',on_rqInstrument);//查询合约
trader.on('rqTradingAccount',on_tradingAccount);//查询账户
trader.on('rqInvestorPosition',on_investorPosition);//查询持仓信息
trader.on('rqInvestorPositionDetail',on_investorPositionDetail);//持仓详细信息
trader.on('rspInsert',on_rspOrderInsert);
trader.on('errInsert',on_errRtnOrderInsert);
trader.on('rspAction',on_rspOrderAction);
trader.on('errAction',on_errRtnOrderAction);
trader.on('rqOrder',on_rspQryOrder);
trader.on('rtnOrder',on_rtnOrder);
trader.on('rqTrade',on_rspQryTrade);
trader.on('rtnTrade',on_rtnTrade);
trader.on('disconnected',on_frontDisconnected);
trader.on('rspUserLogout',on_rspUserLogout);
trader.on('rqDdpthmarketData',on_rspQryDepthMarketData);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////tools
var orderInsert = function(params){
    var inputOrder = {
        brokerId:settings.BrokerID,
        investorId:settings.InvestorID,
        instrunmentId:params.instrunmentId,
        priceType:params.priceType,//1 任意价 2 限价 3最优价 4最新价 8卖一价 C买一价
        direction:params.direction,//1 buy 0 sell
        combOffsetFlag:params.offsetFlag,//0 开仓 1 平仓 3平今 4 平昨
        combHedgeFlag:'1',//投机
        limitPrice:params.limitPrice,
        volumeTotalOriginal:params.quantity,
        timeCondition:params.timeCondition,//1 立即有效 3 当日有效
        volumeCondition:params.volumeCondition,//1 任何数量 2 最小数量 全部数量
        minVolume:params.minVolume,
        forceCloseReason:'0',//非强平
        isAutoSuspend:0,
        userForceClose:0,
        contingentCondition:params.contingentCondition,//1 立即 2止损 3止赢 4预埋单 
        stopPrice:params.stopPrice
    };
    trader.reqOrderInsert(inputOrder,function(result){
        if(result!=0)
            console.log(chalk.red('请求报单失败'));
    });
}

var isErrorRspInfo = function(info){
    var result = info && info.ErrorID!=0;
    if(result){
        console.log(chalk.red('ErrorID:'+info.ErrorID+','+'ErrorMsg'+info.ErrorMsg));
    }
    return result;
}

function searchParam(key,params){
    var index = -1;
    var arg = undefined;
    for(var k in params){
        var param = params[k];
        index = param.indexOf(key);
        if(index!=-1){
            arg = param.replace(key,'');
            break;
        }
    };
    return arg;
}

var printGrid = function(gridName,head,datas){
    var cell_length = 50;
    var gHead = '     ';
    var rowSplit = '     ';
    var rows = [];
    head.forEach(function(item){
        gHead = gHead+nSpace(cell_length,item);
        rowSplit = rowSplit + nSplit(cell_length);
    });
    datas.forEach(function(data){
        var row = '     ';
        head.forEach(function(item){
            row = row + nSpace(cell_length,data[item]);
        });
        rows.push(row);
        rows.push(rowSplit);
    });
    console.log(gridName);
    console.log(rowSplit);
    console.log(chalk.white(gHead));
    console.log(rowSplit);
    rows.forEach(function(row){
        console.log(row);
    });
}

var nSpace = function(x,content){
    var delta = x - content.length;
    var space = '';
    for(var i=0;i<delta;i++){
        space = space+' ';
    }
    return content+space;
}

var nSplit = function(x){
    var space = '';
    for(var i=0;i<x;i++){
        space = space+'=';
    }
    return space;
}
/////////////////////////////////////////////////////////////////////////////cli

console.log(chalk.blue('Please Enter <help> command line'));
console.log(chalk.blue('connecting...'));

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('T > ');
rl.prompt();
rl.on('line',function(line){
    var cmd = line.trim().split(' ');
    var head = cmd[0];
    switch(head){
        case 'f0':
        case 'f1':
        case 'f2':
        case 'f3':
        case 'f4':
            var fast = settings.INSERT[head];
            var quantity = searchParam('-q',cmd);//数量
            var price = searchParam('-p',cmd);
            if(quantity==undefined)
                quantity = 1;
            if(price != undefined){
                var args = {
                    instrunmentId:fast.instrunment,
                    direction:fast.direction,
                    quantity:parseInt(quantity),
                    limitPrice:price,
                    priceType:'2',
                    offsetFlag:'0',
                    timeCondition:'3',
                    volumeCondition:'1',
                    minVolume:1,
                    contingentCondition:'1',
                    stopPrice:0
                };
            
                orderInsert(args);
            }
        break;

        case 'help':
        case 'echo':
        case 'clear':
        case 'disconnect':
        case 'account':
            emitter.emit(head);

        break;

        case 'instrunment':
            var id = searchParam('-i',cmd);//合约号
            if(id!=undefined){
                emitter.emit('instrunment',id);
            }
            else{
                console.log('合约不能为空');
            }

        break

        case 'data':
            var id = searchParam('-i',cmd);//合约号
            if(id!=undefined){
                emitter.emit('data',id);
            }
            else{
                console.log('合约不能为空');
            }


        break;

        case 'posi':
        case 'p-detail':
            var id = searchParam('-i',cmd);
            if(id!=undefined){
                emitter.emit(head,id);
            }
            else{
                console.log('合约不能为空');
            }

        break;
        //posiId,price,stopPrice,quantity
        case 'stop':
            var ref = searchParam('-r',cmd);
            var price = searchParam('-p',cmd);
            var stopPrice = searchParam('-s',cmd); 
            if(ref!=undefined && price!=undefined && stopPrice!=undefined){
                emitter.emit('stop',ref,price,stopPrice);
            }else{
                console.log('引用不能为空');
            }

        break;

        case 'close':
            var ref = searchParam('-r',cmd);
            var price = searchParam('-p',cmd);
            if(ref!=undefined && price!=undefined){
                emitter.emit('close',ref,price);
            }else{
                console.log('引用不能为空');
            }

        break;

        case 'action':
            var ref = searchParam('-r',cmd);
            if(ref!=undefined){
                emitter.emit('action',ref);
            }else{
                console.log('引用不能为空');
            }

        break;

        case 'var':
            console.log(sessionId+' '+frontId);

        break;

        case 'print':
            var head = ['a','b','cc','ddd'];
            var datas = [{a:'a',b:'b',cc:'cc',ddd:'dddd'},
                         {a:'1',b:'2',cc:'3',ddd:'4'    }];
            printGrid('测试',head,datas);

        break;

        case 'quit':
            trader.disconnect();
            process.exit(0);
        break;
        
        default:
            
        break;

    }
    emitter.emit('prompt');
}).on('close',function(){
    console.log(chalk.blue('退出交易系统'));
    trader.disconnect();
    process.exit(0);
});
emitter.emit('connect');
/////////////////////////////////////////////////////////////////////show help

