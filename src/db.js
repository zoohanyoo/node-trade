var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var confirmPath = path.resolve(__dirname,'confirm');
var x = 10;//间距
var cacheDb = {};
cacheDb.consignation = {};//委托
cacheDb.deal = {};//成交
cacheDb.stop = {};//止损
cacheDb.posi = {};//持仓

exports.cacheDb = cacheDb;

/*
var exists = fs.existsSync(path.resolve(__dirname,'db'));
if(exists){
    var buffer = fs.readFileSync(path.resolve(__dirname,'db'));
    var content = buffer.toString('utf-8');
    var lines = content.split('\n');
    lines.forEach(function(json){
        var obj = JOSN.parse(json);
        cacheDb[obj.ID] = obj;
    });
}
exports.insert = function(inputOrder,callback){
    
    fs.appendFile(path.resolve(__dirname,'db'),JSON.stringify(inputOrder),'utf-8',function(err){
        if(err)
            throw;
        id = id+1;
        inputOrder.ID = id;
        cacheDb[id] = inputOrder;
        callback(id);
    });
}
exports.find = function(id){
    return cacheDb[id];
}
exports.values = function(){
    var vals = [];
    for(var key in values){
        vals.push(values[key]);
    }
    return vals;
}
*/
