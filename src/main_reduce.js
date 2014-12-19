///////////////////////////////////////////////////////////////////require moudle
var fs = require('fs');
var events = require('events');
var readline = require('readline');
var ctp = require('./node_modules/node-ctp/shifctp');
var settings = require('./settings.js');
var path = require('path');
var chalk = require('chalk');
var clear = require('clear');
//////////////////////////////////////////////////////////////////////vari
var frontId;
var sessionId;
var cachePosition = [];
var emitter = new events.EventEmitter();
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
    trader.reqQryInstrument(instrumentID,function(result){
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
emitter.on('posi',function(instrumentID){
    cachePosition = [];
    trader.reqQryInvestorPosition(settings.BrokerID,settings.InvestorID,instrumentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求查持仓信息失败'));
    });
});
emitter.on('p-detail',function(instrumentID){
    trader.reqQryInvestorPositionDetail(settings.BrokerID,settings.InvestorID,instrumentID,function(result){
        if(result!=0)
            console.log(chalk.red('请求持仓明细信息失败'));
    });
});

emitter.on('disconnect',function(orderId,quantity){
    trader.disconnect();
});

emitter.on('data',function(instrument){
    trader.reqQryDepthMarketData(instrument,function(result){
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
        emitter.emit('confirm');
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

////////////////////////////////////////////////////////////////////////////////////////////////trader on event

trader.on('rspError',on_error);//调用错误
trader.on('connect',on_connect);//连接
trader.on('rspUserLogin',on_userlogin);//登陆
trader.on('rspInfoconfirm',on_settlementConfirm);//结算确认
trader.on('rqInstrument',on_rqInstrument);//查询合约
trader.on('rqTradingAccount',on_tradingAccount);//查询账户
trader.on('rqInvestorPosition',on_investorPosition);//查询持仓信息
trader.on('rqInvestorPositionDetail',on_investorPositionDetail);//持仓详细信息
trader.on('rqOrder',on_rspQryOrder);
trader.on('rqTrade',on_rspQryTrade);
trader.on('disconnected',on_frontDisconnected);
trader.on('rspUserLogout',on_rspUserLogout);
trader.on('rqDdpthmarketData',on_rspQryDepthMarketData);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////tools

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

var nSplit = function(x){
    var space = '';
    for(var i=0;i<x;i++){
        space = space+'=';
    }
    return space;
}

var printText = function(templte,head,field,formats){
    var _data = '';
    var buffer = fs.readFileSync(path.resolve(__dirname,templte));
    var data = buffer.toString('utf-8');
    var dataChars = [];
    for(var c in data){
        dataChars[c] = data[c];
    }
    head.forEach(function(item){
        var fd = '';
        var format = formats[item];
        if(format){
            fd = Math.round(field[item],1).toString();
        }else{
            fd = field[item].toString();
        }
        var index = data.indexOf('#'+item);
        var length = item.length + 1;
        for(var i=0;i<length;i++){
            dataChars[index + i] = ' ';
        }
        for(var c in fd){
            dataChars[index + parseInt(c)] = fd[c];
        }
    });
    for(var c in dataChars){
        _data = _data + dataChars[c];
    }
    console.log(chalk.yellow(_data));
}
function printGrid(templte,head,fields){
    var _data = '';
    var buffer = fs.readFileSync(path.resolve(__dirname,templte));
    var data = buffer.toString('utf-8');
    var dataChars = [];
    for(var c in data){
        dataChars[c] = data[c];
    }
    var enterIndex = data.indexOf('\n');
    var preChar = enterIndex+1;
    var keyWordIndex = {};
    head.forEach(function(item){
        var index = data.indexOf('#' + item);
        keyWordIndex['#' + item] = index - enterIndex;
    });
    var ii = 0; 
    var lastChar = 0;
    fields.forEach(function(field){
        head.forEach(function(item){
            var fd = field[item].toString();
            var index = keyWordIndex['#'+item] + preChar;
            var inx = 1;
            for(var c in fd){
                inx = inx + 1;
            }
            lastChar = inx + index;
        });
        
        for(var i=0;i<lastChar-preChar;i++){
            dataChars[preChar+i] = ' ';
        }

        head.forEach(function(item){
            var fd = field[item].toString();
            var index = keyWordIndex['#'+item];
            for(var c in fd){
                dataChars[preChar + index + parseInt(c)- 1] = fd[c];
            }
        });

        dataChars[lastChar] = '\n'
        lastChar = lastChar + 1;
        preChar = lastChar;
        ii = ii +1;
    });
    for(var c in dataChars){
        _data = _data + dataChars[c];
    }
    console.log(chalk.yellow(_data));
}
/////////////////////////////////////////////////////////////////////////////print grid
var printAccount = function(field){
    var tmpName = 'account.templte';
    var head = ['AccountID',
                'Deposit',
                'Withdraw',
                'FrozenMargin',
                'FrozenCash',
                'FrozenCommission',
                'CurrMargin',
                'Commission',
                'CloseProfit',
                'PositionProfit',
                'Balance',
                'Available',
                'WithdrawQuota',
                'SettlementID',
                'TradingDay',
                'Credit'];
    printText(tmpName,head,field,{'PositionProfit':'round(1)','Balance':'round(1)','CurrMargin':'round(1)'});
}

var printPosition = function(fields){
    var tmpName = 'position.templte'
    var head = ['j1','j2','j3','j4','j5','j6','j7','j8','j9','j10'];
    var nFields = [];
    fields.forEach(function(field){
        var nField = {};
        nField.j1 = field.InstrumentID;//合约代码
        nField.j2 = field.PosiDirection;//多空
        nField.j3 = field.PositionDate;//持仓日期
        nField.j4 = field.Position;//持仓
        nField.j5 = field.TodayPosition;//今仓
        nField.j6 = field.PositionCost;//持仓成本
        nField.j7 = field.PositionProfit;//持仓盈亏
        nField.j8 = field.CloseProfit;//平仓盈亏
        nField.j9 = field.CloseProfitByTrade;//逐笔盈亏
        nField.j10 = field.CloseProfitByDate;//盯市盈亏
        nFields.push(nField);
    });
    printGrid(tmpName,head,nFields);
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
        case 'help':
        case 'echo':
        case 'clear':
        case 'disconnect':
        case 'account':
            emitter.emit(head);

        break;

        case 'instrument':
            var id = searchParam('-i',cmd);//合约号
            if(id!=undefined){
                emitter.emit('instrument',id);
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

        case 'p':

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

