var chalk = require('../node_modules/chalk');

var isErrorRspInfo = function(info){
    var result = info && info.ErrorID!=0;
    if(result){
        console.log(chalk.red('ErrorID:'+info.ErrorID+','+'ErrorMsg'+info.ErrorMsg));
    }
    return result;
}

var searchParam = function(key,params){
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

exports.isErrorRspInfo = isErrorRspInfo;
exports.searchParam = searchParam;

