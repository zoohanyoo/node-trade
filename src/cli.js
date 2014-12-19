//cli
//
//日期：2014/12/19
//作者：bo
var readline = require('readline');
var clear = require('clear');
var chalk = require('chalk');
var tools = require('./tools');

console.log(chalk.blue('connecting...'));

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
global.rl = rl;

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
            global.emitter.emit(head);

        break;

        case 'instrument':
            var id = tools.searchParam('-i',cmd);//合约号
            if(id!=undefined){
                global.emitter.emit('instrument',id);
            }
            else{
                console.log('合约不能为空');
            }

        break

        case 'data':
            var id = tools.searchParam('-i',cmd);//合约号
            if(id!=undefined){
                golbal.emitter.emit('data',id);
            }
            else{
                console.log('合约不能为空');
            }

        break;

        case 'posi':
        case 'p-detail':
            var id = tools.searchParam('-i',cmd);
            if(id!=undefined){
                golbal.emitter.emit(head,id);
            }
            else{
                console.log('合约不能为空');
            }

        break;

        case 'p':

        break;

        case 'quit':
            global.trader.disconnect();
            process.exit(0);
        break;
        
        default:
            
        break;

    }
    global.emitter.emit('prompt');
}).on('close',function(){
    console.log(chalk.blue('退出交易系统'));
    global.trader.disconnect();
    process.exit(0);
});
console.log(chalk.blue('Please Enter <help> command line'));
