const CONFIG = {

    // if set to true, will give you detail logs in the console.
    logging: false,
    
    // service used for idea2life node app, add url and service name to route to the service
    // URL is plugged in directly by server.js
    internal_services : {

        layout: {
            url: '/layout',
            name: 'layout'
        },
        generator: {
            url: '/generator',
            name: 'generator'
        },
        admin: {
            url: '/admin',
            name: 'admin'
        }
    },

    external_services: {
        ai: {
            url: 'localhost',
            name: 'ai',
            port: 5000
        }
    },

    ui : {
        name : 'ui',
        url: '/ui',
        dir : 'public'
    },

    appSettings : {
        rendering: {
            main : 'index'
        }
    },

    // express https server settings
   server : {
        nodeDir : "node_modules",
        home : '/admin',
        port : 1813,
        host_base_url: 'https://127.0.0.1',
        path_for_views : [
            '/admin/views',
            '/generator/userpages/views',
            '/generator/views'
        ],
        path_for_static : {
            themes: 'generator/views/themes',
            userdata : 'userData',
            adminassets : '/admin/assets',
            adminnotification: '/admin/views/',        
        }
   },

   utilities: {
       last_page_data : {
           root_dir: "public",
           filename: "last_page_data.json",
           name_key: "name"
       },
   },

   // supported components by idea2life
   components : [
        'Button',
        'CheckBox',
        'Heading',
        'Image',
        'ImageHorizontal',
        'ImageVertical',
        'ProfileImage',
        'Label',
        'Link',
        'BigParagraph',
        'Paragraph',
        'RadioButton',
        'TextBox',
        'Header',
        'Footer',
        'Carousel',
        'SearchBar',
        'Slider',
        'Ratings',
        'Video',
        'VideoHorizontal',
        'ComboBox',
        'Social'
   ]
    
};

module.exports = CONFIG;

