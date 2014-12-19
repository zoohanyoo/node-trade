
module.exports = function(){
    var settings = {};
    settings.INSERT = {//下单快捷键
        'f0':{instrunment:'IF1412',direction:'0'},
        'f1':{instrunment:'IF1412',direction:'1'}
    }
    settings.BrokerID = '';
    settings.InvestorID = '';
    settings.PWD = '';
    settings.Trader_Front_Addr = '';
    settings.MdUser_Front_Addr = '';
    settings.Public_Topic_Type = 0;
    settings.Private_Topic_Type = 1;
    settings.INSTRUNMENTID = ['IF1412'];    
    return settings;
}();

