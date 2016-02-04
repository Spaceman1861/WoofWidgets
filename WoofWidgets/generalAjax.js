// Docs : TODO Not Implemented
;
(function ($, be) {
    "use strict";

    be.ajax = be.ajax === undefined ? {} : be.ajax;
    be.ajax.functions = be.ajax.functions === undefined ? {} : be.ajax.functions;

    be.ajax.ajaxCall = function (url, options) {
        options = $.extend(true, {}, {
            notificationMessage: "Generic Ajax Call Fired"
        },
        options);

        var req = $.ajax({
            url: url,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            type: options.type,
            data: options.data
        });

        req.id = be.util.generateGuid();
        be.triggers.trigger("ajaxStarted", {
            req: req,
            msg: options.notificationMessage
        });

        req.done(options.doneFunction);
        req.fail(options.failureFunction);

        return req;
    };

    be.ajax.defaultAjaxOptions = {
        doneFunction: $.noop,
        failureFunction: $.noop,
        type: "GET",
        data: "",
        notificationMessage: "Request Fired"
    };

    be.ajax.getFunction = function(functionName)
    {
        var returnFunc = $.noop,
            funcs = Object.keys(be.ajax.functions);

        for (var i = 0; i < funcs.length; i++)
        {
            var func = funcs[i];
            if (func === functionName)
                return be.ajax.functions[func]
        }
    }

}(jQuery, be));