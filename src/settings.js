module.exports = function(env){
    var settings = undefined;
    switch(env)
    {   
        case 'test':
            settings = require('../env/settings.test.js');        

        break;

        case 'bo':
            settings = require('../env/settings.bo.js');

        break;

        case 'public':
            settings = require('../env/settings.public.js');

        break;
    }
    return settings;
}(global.tenv);

