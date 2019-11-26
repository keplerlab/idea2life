const CONFIG = {
    home_url : '/admin/view',
    view_folder : '/../generator/userpages/views/',
    html_folder : '/../userData/',
    component_folder : '/../generator/views/themes/default/components/',
    page : {
        listview: 'view',
        pageview: 'pagehtmlview',
        edit: 'pageedit',
        delete: 'delete',
        rename:'rename',
        error: 'errorpage'
    },
    defaultpage : {
        name : 'index',
        ext : '.html'
    },
    component : {
        componentpath : '/default/components/',
        masterfolder : 'themes',
        staticpath : '/static_theme',
        componentview : 'componentview',
        componentedit : 'componentedit',
    },
    view : {
        listview: 'pagelist',
        home: 'home',
        edit: 'pageedit',
    },
}


module.exports = CONFIG;