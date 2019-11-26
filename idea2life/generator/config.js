var idea2LifeConfig = require('../config');

var CONFIG = {

    logging: idea2LifeConfig.logging,

    // Theme currently used
    current_theme: 'default',

    userDataDirPath : idea2LifeConfig.server.path_for_static.userdata,

    // themes config
    themes_dir: 'themes',
    themes_main: 'index',
    theme_static: 'static',

    // these are not extendible, only these directories are supported
    component_dir : 'components',
    component_main: 'index',
    components_static : [
        "assets",
        "css",
        "js"
    ],

    // page static url
    page_static_url: '/static_page/',

    // theme static url
    theme_static_url: '/static_theme/',

    // views dir
    views_dir: 'views'

};

module.exports.GENERATOR_CONFIG  = CONFIG;