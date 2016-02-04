$(document).ready(function () {
    be.util.log('Document Read Start');

    // http://www.jsviews.com/#allowcodetag
    $.views.settings.allowCode = true;

    be.util.log('Binding Widgets');
    be.util.createWidgets();
    be.util.log('Document Read End');
});

