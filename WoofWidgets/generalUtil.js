// Define global objects
var be = typeof (be) == 'undefined' || _.isUndefined(be) ?
    {} :
    be;

be.initializedWidgets = typeof(be.initializedWidgets) == 'undefined' || _.isUndefined(be.initializedWidgets) ?
    [] :
    be.initializedWidgets;

be.util = typeof(be.util) == 'undefined' || _.isUndefined(be.util) ?
    {} :
    be.util;

be.widgets = typeof(be.widgets) == 'undefined' || _.isUndefined(be.widgets) ?
    {} :
    be.widgets;

be.triggers = typeof(be.triggers) == 'undefined' || _.isUndefined(be.triggers) ?
    {} :
    be.triggers;

be.ajax = typeof (be.ajax) == 'undefined' || _.isUndefined(be.ajax) ?
    {} :
    be.ajax;

// Initialize application-wide bindings manager
be.keys.bindings = new be.keys.Bindings();

// --- UTIL Methods ---
be.util.allowConsoleLogging = function () {
    return true;
};

be.util.booleanBindingParse = function (widget, value) {
    var booleanToCheck = true;

    if (value[0] === "!") {
        booleanToCheck = false;
        value = value.substring(1);
    }

    return widget.get(value) === booleanToCheck;
},

be.util.jqueryafiy = function (target) {
    return target instanceof jQuery ? target : $(target);
};

//TODO: make this include stack?
be.util.log = function(log, id)
{
    if (be.util.allowConsoleLogging())
    {
        id = id === '' || id === "" || id == null ? "anon" : id;

        console.log(
            '%c Log from ' + id + ': %o',
            'color:' + be.util.getGuidLogColor(id),
            log
        );
    }
};

be.util.getGuidLogColor = function(id)
{
    if (typeof (be.util.guidLogColorArray) == 'undefined'
        || _.isUndefined(be.util.guidLogColorArray))
    {
        be.util.guidLogColorArray = [['anon', '#000']];
    }

    for (var i = 0; i < be.util.guidLogColorArray.length; i++)
    {
        if (be.util.guidLogColorArray[i][0] === id)
        {
            return be.util.guidLogColorArray[i][1];
        }
    }

    var color = be.util.getRandomColor();
    be.util.guidLogColorArray.push([
        id,
        color
    ]);

    return color;
};

be.util.getRandomColor = function()
{
    var letters = '01234567'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++)
    {
        color += letters[Math.round(Math.random() * 7)];
    }
    return color;
};

be.util.generatedGuids = [];
be.util.generateGuid = function()
{
    function s4()
    {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    function constructGuid()
    {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function checkGuidExists(guid)
    {
        var guidExists = false;
        for (var i = 0; i < be.util.generatedGuids.length; i++)
        {
            if (guid === be.util.generatedGuids[i])
            {
                guidExists = true;
                break;
            }
        }
        return guidExists;
    }

    var guid = constructGuid();
    while (checkGuidExists(guid))
    {
        guid = constructGuid();
    }

    return guid;
};

be.util.stringFormat = function()
{
    var s = arguments[0];

    if (arguments[1] !== undefined && arguments[1] instanceof Array)
        arguments = [null].concat(arguments[1]);
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }
    return s;
};

be.util.stringFormatGetter = function (str, args, widget)
{
    var array = [];
    for (var j = 0; j < args.length; j++)
    {
        array[j] = widget.get(args[j]);
    }
    for (var i = 0; i < array.length; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        str = str.replace(reg, array[i]);
    }
    return str;
}

be.util.widgetSelector = '*[data-role]';
be.util.createWidgets = function (targets, parentWidget) {
    // Target could be null single or multiple selectors.
    // If null assume we are binding the from page base.
    targets = targets === null || targets === undefined ?
        be.util.jqueryafiy(be.util.widgetSelector) :
        be.util.jqueryafiy(targets).find('*[data-role]');

    targets.each(function () {
        if (typeof (this.bindingObject) == 'undefined' || _.isUndefined(this.bindingObject)) {
            var widgetName = $(this).data("role");

            if (widgetName in be.widgets) {

                var widgetClass = be.widgets[widgetName];

                this.bindingObject = Object.create(widgetClass);
                this.bindingObject.options = Object.create(widgetClass.options);
                this.bindingObject.viewModel = Object.create(widgetClass.viewModel);
                this.bindingObject.dataSource = Object.create(widgetClass.dataSource);
                this.bindingObject.boundObject = this;
                if (parentWidget !== null && parentWidget !== undefined)
                    this.bindingObject.set("parentWidget", parentWidget);
                this.bindingObject.init();

                be.initializedWidgets.push(this.bindingObject);
            } else {
                be.util.log(widgetName + ' widget does not exist');
            }
        }
    });
};

// If we are re binding a section that has x sub widgets.
// We cannot assume that the widget will remain as such we need to destroy them
// If you need a sub-widget to remain in its current state you will need to specifiy in its options its
// state when you define the html.

// The main reason we dont keep existing objects is memory. (garbage collection)

// This is a relatively key feature dont modifiy without thinking alot :D
be.util.deleteWidgets = function (target) {
    target = target == null ? $(be.util.widgetSelector) : $(target).find(be.util.widgetSelector);
    target.each(function () {
        if (typeof (this.bindingObject) == 'object') {
            var guid = this.bindingObject.guid;
            this.bindingObject.unregisterTriggers();

            delete this.bindingObject.boundObject;
            delete this.bindingObject.viewModel;
            delete this.bindingObject.options;
            delete this.bindingObject.dataSource;
            delete this.bindingObject.bindingObject;
            
            for (var i = 0; i < be.initializedWidgets.length; i++) {
                if (be.initializedWidgets[i].guid === guid) {
                    be.initializedWidgets.splice(i, 1);
                    break;
                }
            }
            be.util.log(guid + '- widget destroyed');
        }
    });
};

be.util.getUrlParameter = function (sParam) {
    var sPageURL = window.location.search.substring(1).toLowerCase();
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam.toLowerCase()) {
            return decodeURIComponent(sParameterName[1]);
        }
    }
};

jQuery.expr[":"].containsCaseIgnore = jQuery.expr.createPseudo(function (arg) {
    return function (elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

be.util.returnFunctions = function()
{
    var data = this.data;
    var returnArr = [];
    for (var key in data)
    {
        if(typeof(data[key]) === "function")
        {
            returnArr.push(
                { "name": key }
            );
        }
    }

    return returnArr;
} 