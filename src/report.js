//报表模块，根据模板*.templte文件生成报表
//
//
//日期：2014/12/19
//作者：bo
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

var printAccount = function(field){
    var tmpName = '../templet/account.templte';
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
    var tmpName = '../templte/position.templte'
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

function printText(templte,head,field,formats){
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
