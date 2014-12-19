module.exports = function(){
    /*
     *实盘经纪公司代码 0034
     BrokerID 为0034
     交易对接参数
     CTP柜台版本6.30
     电信交易站点IP及端口
     IP1：180.166.0.225 
     IP2：180.166.0.226
     交易端口 28205
     行情端口 28213
     联通交易站点IP及端口
     IP1: 140.206.102.129
     IP2: 140.206.102.130
     交易端口 28205
     行情端口 28213
     *
     *交易 222.240.130.30 端口41205
     行情 222.240.130.30 端口41213
     经纪公司代码 0292
     0000001000
     122015
     * */
    var settings = {};
    settings.INSERT = {//下单快捷键
        'f0':{instrunment:'IF1412',direction:'0'},
        'f1':{instrunment:'IF1412',direction:'1'}
    }
    settings.BrokerID = '0292';
    settings.InvestorID = '0000001000' //'71290043';
    settings.PWD = '122015';
    settings.Trader_Front_Addr = 'tcp://222.240.130.30:41205';
    settings.MdUser_Front_Addr = '';
    settings.Public_Topic_Type = 0;
    settings.Private_Topic_Type = 1;
    settings.INSTRUNMENTID = ['IF1412'];    
    return settings;
}();

