// See ../test/widgetdoco
(function ($, be, undefined) {
    "use strict";
    be.widgets.baseWidget = {
        options: {
            widgetName: "baseWidget",
            // Use this if you are dynamical creating a view.
            view: "",

            sortColumns: [""],
            sortingEnabled: true,
            sortOnLoad: false,
            sortFunction: "_genericSortMultiFunction"
        },

        triggers: {},

        triggerBindings: [],

        viewModel: {},

        // the widget that this is contained in inside the dom. Used for get in set.
        // TODO: More doco to come this is still in dev.
        parentWidget: null,

        dataSourceIndex: 0,

        userFriendlyDSIndex: function () {
            var widget = this;

            return widget.dataSourceIndex + 1;
        },

        setDataSourceIndex: function (intIn) {
            var widget = this;

            widget.dataSourceIndex = intIn;
        },

        customSourceIndex: 0,
        customSourceTarget: null,

        setCustomSourceIndex: function (intIn) {
            var widget = this;

            widget.customSourceIndex = intIn;
        },

        setCustomSourceTarget: function (tarIn) {
            var widget = this;

            widget.customSourceTarget = tarIn;
        },

        // dataSources always need to be arrays
        dataSource: [],

        baseView: '',

        boundObject: null,

        guid: null,

        sortValue: null,

        sortDs: function () {
            var widget = this;

            widget.sort(null, "dataSource");
        },

        sort: function (sortCols, target) {
            var widget = this,
                tar = widget.get(target),
                newtar,
                sortValue = widget.get("sortValue");

            if (sortValue !== null) {
                sortCols = [sortValue];
            }

            widget.setNonObservable("sortColumns", sortCols);

            newtar = tar.sort(
                widget.get(widget.get("sortFunction"), false, true)[widget.get("sortFunction")](sortCols)
            );

            $.observable(tar).refresh(newtar);
            widget.bind();
        },

        bind: function (target, dataSourceIndex, skipUnbind, customSourceIndex, customSourceTar) {
            var widget = this,
                bindingObjects,
                bindingObject,
                k,
                i,
                bindings,
                bindingsKeys,
                bindingsKeysLength,
                bindingType,
                bindingValue,
                bindingObj,
                bindDeffered;

            dataSourceIndex = dataSourceIndex === null || dataSourceIndex === undefined ? 0 : dataSourceIndex;
            skipUnbind = skipUnbind === null || skipUnbind === undefined ? false : skipUnbind;
            widget.setDataSourceIndex(dataSourceIndex);
            // Normaly Unbind Everything In cases where we no there is nothing bound its faster not to
            if (skipUnbind === false) {
                widget.unbind(target);
            }

            if (target === null || target === undefined) {
                // Re Register Triggers if a top level bind
                widget.registerTriggers();
                be.util.log('Full Bind Called', this);
            }
            else
            {
                be.util.log('Partial Bind Called', this);
            }

            // Get Targets
            bindingObjects = widget._buildBindTargets(target);

            // Bind the Targets
            for (k = 0; k < bindingObjects.length; k += 1) {
                bindingObject = $(bindingObjects[k]); // TODO: JQuery for each may be faster
                bindings = bindingObject.data("bind");
                bindingsKeys = Object.keys(bindings);
                bindingsKeysLength = bindingsKeys.length;
                for (i = 0; i < bindingsKeysLength; i += 1) {
                    bindingType = bindingsKeys[i];
                    bindingValue = bindings[bindingType];

                    if (bindingType.toLowerCase() == "source") {
                        // deffered is wrong
                        bindDeffered = widget._bindTemplates(bindingObject);
                        continue;
                    }

                    // Determine binding type
                    bindingObj = be.bindings.getBindingObject(bindingType);
                    bindingObj.bind(widget, bindingObject, bindingValue, dataSourceIndex, customSourceIndex, customSourceTar);
                    // Merge new data objects that may have just be bound #recursion:P
                    if (bindingObj.doMergeOnNewData !== false) {
                        $.merge(bindingObjects, bindingObject.find('*[data-bind]'));
                    }
                }
            }

            return bindDeffered;
        },

        unbind: function (target) {
            be.util.log('UnBind Called', this);
            var widget = this,
                bindingObjects = widget._buildBindTargets(target),
                k;

            //TODO REFACTOR THIS INTO HERE
            widget._unbindTemplates(target);

            // Un-Bind existing bindings
            for (k = 0; k < bindingObjects.length; k += 1) {
                $(bindingObjects[k]).off();
            }
        },

        getObject: function (value) {
            var widget = this;

            return widget.get(value, false, true);
        },

        get: function (value, returnFunction, returnParent) {
            var widget = this,
                returnValue = "",
                targets,
                i,
                toplevel;

            if (value === null || value === undefined) {
                return value;
            }

            //default params
            returnFunction = returnFunction === null ? false : returnFunction;
            returnParent = returnParent === null ? false : returnParent;

            // Force string and check it has a length and trim
            value = String(value).trim();
            if (value.length === 0) {
                return value;
            }

            // Multiple Bindings
            if (value.indexOf("+") !== -1) {
                targets = value.split('+');
                for (i = 0; i < targets.length; i += 1) {
                    // RECURSIONNNNN!!!! :O Bewareeee
                    returnValue += widget.get(targets[i]);
                }
                return returnValue;
            }

            if (value[0] === '~') {
                return value.substring(1);
            }

            toplevel = value.split('.')[0];

            if (widget.viewModel[toplevel] !== undefined) {
                return widget._recursiveGet(value, widget.viewModel, returnFunction, returnParent);
            }

            if (widget.options[toplevel] !== undefined) {
                return widget._recursiveGet(value, widget.options, returnFunction, returnParent);
            }

            if (widget.dataSource[widget.dataSourceIndex] !== undefined &&
                    widget.dataSource[widget.dataSourceIndex][toplevel] !== undefined) {
                return widget._recursiveGet(
                    value,
                    widget.dataSource[widget.dataSourceIndex],
                    returnFunction,
                    returnParent
                );
            }

            if (widget[toplevel] !== undefined) {
                return widget._recursiveGet(value, widget, returnFunction, returnParent);
            }

            return returnParent ? widget.viewModel : value;
        },

        set: function (target, value) {
            var widget = this;
            $.observable(widget.get(target, false, true)).setProperty(target, value);

            $(widget.viewModel).trigger("propertyChange");
            $(widget).trigger("propertyChange");
        },

        setNonObservable: function (target, value) {
            var widget = this;

            widget.get(target, false, true)[target] = value;
        },

        lastfetchDataSourceParams: {},

        dataSourceNeedsRefetch: false,

        fetchDataSourceParams: {
            doneFunc: function (widget, request, response) {
                widget.setDataSource(response.Data);
            },
            failFunc: $.noop,
            alwaysFunc: $.noop,

            requiredParams: []
        },

        forceFetchDataSource: function()
        {
            var widget = this;

            widget.set("dataSourceHasBeenSet", false);
            widget.setNonObservable("dataSourceNeedsRefetch", true);
            widget.fetchDataSource();
        },

        fetchDataSource: function () {
            be.util.log('fetchDataSource Called', this);

            var widget = this,
                lastfetchDataSourceParams = widget.get("lastfetchDataSourceParams"),
                fetchDataSourceParams = widget.get("fetchDataSourceParams"),
                fetch = widget.get("dataSourceNeedsRefetch"),
                i,
                param,
                ajax;

            if (fetch !== true) {
                for (i = 0; i < fetchDataSourceParams.requiredParams.length; i += 1) {
                    param = fetchDataSourceParams.requiredParams[i];
                    if (widget.get(param) !== lastfetchDataSourceParams[param]) {
                        fetch = true;
                    }
                    lastfetchDataSourceParams[param] = widget.get(param);
                }
            }

            if (fetch === true) {
                widget.setNonObservable("lastfetchDataSourceParams", lastfetchDataSourceParams);
                be.util.log('fetchDataSource - Fetching : ' + fetchDataSourceParams.urlTarget, widget);

                ajax = be.ajax.getFunction(widget.get("dataSourceFetchFunction"))();

                ajax.done(function (result) {
                    widget.setDataSource(result);
                });
            }
        },

        currentDataSourceItem: function()
        {
            var widget = this;

            return widget.dataSource[widget.dataSourceIndex];
        },

        currentCustomSourceItem: function () {
            var widget = this;

            return widget.get(widget.customSourceTarget)[widget.customSourceIndex];
        },

        dataSourceHasBeenSet: false,
        setDataSource: function (value) {
            // http://www.jsviews.com/#arrchange
            // see the above when manipultaing array objects and making the changes observable.
            var widget = this;

            if (!(value instanceof Array)) {
                value = [value];
            }

            widget.dataSource = value;
            widget.setNonObservable("dataSourceHasBeenSet", true);
            return widget.bind();
        },

        refreshDataSource: function () {
            // http://www.jsviews.com/#arrchange
            // see the above when manipultaing array objects and making the changes observable.

            // if manipulation is done correctly in theory this method should not be needed.
            var widget = this,
                oldData = widget.dataSource;

            $.observable(widget).setProperty("dataSource", []);
            $.observable(widget).setProperty("dataSource", oldData);
        },

        registerTriggers: function () {
            var widget = this, i;

            widget.unregisterTriggers();
            for (i = 0; i < widget.triggerBindings.length; i += 1) {
                $(widget.boundObject).on(
                    widget.triggerBindings[i].triggerName,
                    widget._wrapperForCustomTriggerFunction(
                        widget.triggerBindings[i].triggerName,
                        widget.triggerBindings[i].triggerListenFunction
                    )
                );
            }
        },

        unregisterTriggers: function () {
            var widget = this, i;

            $(widget).off();
            for (i = 0; i < widget.triggerBindings.length; i += 1) {
                $(widget.boundObject).unbind(widget.triggerBindings[i].triggerName);
            }
        },

        destroyInstance: function () {
            var widget = this;

            widget.unregisterTriggers();
            be.util.deleteWidgets($(widget.boundObject));
        },

        reInitInstance: function () {
            var widget = this,
                // we should use this to reinit a widget.
                old = widget.guid;

            widget.init();
            widget.guid = old;
        },

        dataSourceFetchFunction: null,

        init: function () {
            be.util.log('Widget starting Init', this);

            var widget = this,
                widgetOptions = $(widget.boundObject).data('options'),
                widgetSource = $(widget.boundObject).data('source'),
                option,
                options,
                bindFired = false;

            widget.guid = be.util.generateGuid();
            widget.viewModel.widget = this;
            widget.preInit();

            if (widgetOptions !== "" && widgetOptions !== undefined && widgetOptions !== null) {
                be.util.log("Widget Options:", this);
                be.util.log(widgetOptions, this);
                for (option in widgetOptions) {
                    if (widgetOptions.hasOwnProperty(option)) {
                        options = typeof widgetOptions[option] === 'string' || widgetOptions[option] instanceof String ?
                                widgetOptions[option].toLowerCase() :
                                widgetOptions[option];
                        // TODO: parse into json object? Handle int/decimals

                        switch (options) {
                            case true:
                            case "true":
                                options = true;
                                break;

                            case false:
                            case "false":
                                options = false;
                                break;

                            default:
                                options = widgetOptions[option];
                                break;
                        }

                        widget.options[option] = options;
                    }
                }
            }

            widget.registerTriggers();

            // TODO: Make conditional.
            // Allow for override with template
            if (widget.baseView !== "") {
                if (!$.trim($(widget.boundObject).html())) {
                    $(widget.boundObject).html(widget.baseView);
                }
                widget.set("view", widget.baseView);
            }

            if (widgetSource !== "" && widgetSource !== null && widgetSource !== undefined) {
                be.util.log("Widget Source:", this);
                be.util.log(widgetSource, this);

                widgetSource = typeof widgetSource === "string" ? widget.get(widgetSource) : widgetSource;

                widget.setDataSource(widgetSource);
                bindFired = true;       
            }

            if (widget.get("fetchDataSourceOnInit") === true) {
                widget.forceFetchDataSource();
            }

            if (bindFired === false)
            {
                widget.bind();
            }

            be.util.log('Widget ending Init', this);

            widget.postInit();

            // Call create to make sure any injected widgets get created :D
            be.util.createWidgets(widget.boundObject, widget);
        },

        preInit: $.noop,

        postInit: $.noop,

        toString: function () {
            var widget = this,
                returnStatement = widget.guid !== null ?
                        widget.options.widgetName +
                        ' - ' +
                        widget.guid :
                        widget.options.widgetName;

            return returnStatement;
        },

        // --- Private(ish) Functions --- ///
        _bindTemplates: function (target) {
            be.util.log('BindTemplates Called', this);

            var widget = this,
                bindingObjects = widget._buildBindTargets(target),
                bindingObject,
                bindings,
                bindingType,
                bindingValue,
                bindingsKeys,
                bindingsKeysLength,
                dataTemplateName,
                dataHeaderTemplateName,
                dataFooterTemplateName,
                isSelect,
                k,
                i;

            for (k = 0; k < bindingObjects.length; k += 1) {
                bindingObject = $(bindingObjects[k]);
                bindings = bindingObject.data("bind");
                bindingsKeys = Object.keys(bindings);
                bindingsKeysLength = bindingsKeys.length;
                for (i = 0; i < bindingsKeysLength; i += 1) {
                    bindingType = bindingsKeys[i];
                    bindingValue = bindings[bindingType];

                    if (bindingType.toLowerCase() === 'source') {
                        dataTemplateName = bindingObject.data("template");
                        dataHeaderTemplateName = bindingObject.data("headertemplate");
                        dataFooterTemplateName = bindingObject.data("footertemplate");
                        isSelect = bindingObject.is("select");

                        // TODO: this needs to accept multilple;
                        // Set the initial value
                        return widget._htmlTemplateSetFunc(
                            bindingValue,
                            bindingObject,
                            dataTemplateName,
                            dataHeaderTemplateName,
                            dataFooterTemplateName,
                            isSelect
                        );
                    }
                }
            }
        },

        _unbindTemplates: function (target) {
            be.util.log('UnBindTemplates Called', this);

            var widget = this,
                bindingObjects = widget._buildBindTargets(target),
                bindings,
                bindingType,
                bindingValue,
                bindingsKeys,
                bindingsKeysLength,
                dataTemplateName,
                dataHeaderTemplateName,
                dataFooterTemplateName,
                isSelect,
                k,
                i;

            for (k = 0; k < bindingObjects.length; k += 1) {
                bindings = $(bindingObjects[k]).data("bind");
                bindingsKeys = Object.keys(bindings);
                bindingsKeysLength = bindingsKeys.length;
                for (i = 0; i < bindingsKeysLength; i += 1) {
                    bindingType = bindingsKeys[i];
                    bindingValue = bindings[bindingType];

                    if (bindingType.toLowerCase() === 'source') {
                        $(bindingObjects[k]).html(""); // clear all templates
                    }
                }
            }
        },

        _buildBindTargets: function (targets) {
            var widget = this,
                ignoreSelectors = $(),
                returnSelectors = $(),
                target,
                targetsIndex,
                targetChildrenRole,
                targetChildrenRoles,
                i;

            // Target could be null single or multiple selectors.
            // If null assume we are binding the from widget base.
            targets = targets === null || targets === undefined ?
                be.util.jqueryafiy(widget.boundObject) :
                be.util.jqueryafiy(targets);

            // We need to remove all nested roles
            for (targetsIndex = 0; targetsIndex < targets.length; targetsIndex += 1) {
                // Check current target for sub widgets. Note this could be multiple.(single / null)
                target = be.util.jqueryafiy(targets[targetsIndex]);

                targetChildrenRoles = target.find('*[data-role]');
                for (i = 0; i < targetChildrenRoles.length; i += 1) {
                    targetChildrenRole = be.util.jqueryafiy(targetChildrenRoles[i]);

                    // Ignore this selector as its a seperate widget.
                    ignoreSelectors = $.merge(ignoreSelectors, targetChildrenRole);
                    // Ignore all children of the seperate widget as well.
                    ignoreSelectors = $.merge(ignoreSelectors, targetChildrenRole.find('*'));
                }

                // If the actual target is a widget ignore it. But not this widget.
                if (target.is('*[data-role]') &&
                    (target[0].bindingObject === undefined || target[0].bindingObject.guid !== widget.guid)) {
                    // Ignore this selector as its a seperate widget.
                    ignoreSelectors = $.merge(ignoreSelectors, target);
                    // Ignore all children of the seperate widget as well.
                    ignoreSelectors = $.merge(ignoreSelectors, target.find('*'));
                }

                // Add the target if its a binding.
                if (target.is('*[data-bind]')) {
                    returnSelectors = $.merge(returnSelectors, target);
                }

                // Find all children that have data binding.
                returnSelectors = $.merge(returnSelectors, target.find('*[data-bind]'));
            }

            // Return all data bind selectors that are not inside data roles
            return returnSelectors.not(ignoreSelectors);
        },

        _recursiveGet: function (value, object, returnFunction, returnParent) {
            var widget = this,
                children = value.split(".");

            if (object === null || object === undefined) {
                return value;
            }

            if (children.length !== 1) {
                object = object[children[0]];
                children.shift();
                return widget._recursiveGet(children.join("."), object, returnFunction, returnParent);
            }

            if (returnParent === true) {
                return object;
            }

            // TODO: ?????
            //if (typeof object.get === "function" && object[value] === null) {
            //    if (returnFunction) {
            //        return object.get(value, true);
            //    }
            //    return object.get(value);
            //}

            if (typeof object[value] === "function" && !returnFunction) {
                return object[value]();
            }

            return object[value];
        },

		_wrapperForGenericFunction: function (funcitonName) {
		    var widget = this;
		    return function (e) {
		        widget.get(funcitonName, false, true)[funcitonName](e);
		    };
		},

        _wrapperForCustomTriggerFunction: function (triggerName, setFunctionName) {
            var widget = this,
                guidAlreadyTriggeredForThisEvent,
                i;

            return function (e, data) {
                guidAlreadyTriggeredForThisEvent = false;
                for (i = 0; i < data.eventHandled.length; i += 1) {
                    if (data.eventHandled[i] === widget.guid) {
                        guidAlreadyTriggeredForThisEvent = true;
                        break;
                    }
                }

                if (guidAlreadyTriggeredForThisEvent !== true) {
                    be.util.log("Trigger hit:" + triggerName, widget);
                    widget.get(setFunctionName, false, true)[setFunctionName]([e, data]);
                    data.eventHandled.push(widget.guid);
                }
            };
        },

        _htmlTemplateObserverFunc: function (
            dataSourceBindingValue,
            target,
            dataTemplateName,
            dataHeaderTemplateName,
            dataFooterTemplateName,
            isSelect
        ) {
            var widget = this;

            return function () {
                widget._htmlTemplateSetFunc(
                    dataSourceBindingValue,
                    target,
                    dataTemplateName,
                    dataHeaderTemplateName,
                    dataFooterTemplateName,
                    isSelect
                );
            };
        },

        _htmlTemplateSetFunc: function (
            dataSourceBindingValue,
            targetIn,
            dataTemplateName,
            dataHeaderTemplateName,
            dataFooterTemplateName,
            isSelect
        ) {
            var widget = this,
                target = targetIn instanceof jQuery ? targetIn : $(targetIn),
                dataSource = widget.get(dataSourceBindingValue),
                dfd;

            if (dataSource === dataSourceBindingValue) {
                dataSource = [];
            }

            // Delete any sub widgets that are about to get clobbered
            be.util.deleteWidgets(target);

            if (isSelect) {
                dfd = widget._parseGenericSelect(target, dataTemplateName, dataSource, dataSourceBindingValue);
            } else {
                dfd = widget._parseTemplate(
                    target,
                    dataTemplateName,
                    dataSource,
                    dataSourceBindingValue,
                    dataHeaderTemplateName,
                    dataFooterTemplateName
                );
            }

            be.util.log("Templates Set", widget);

            // TODO: should this beincluded in dfd chain?
            // In case of new widgets
            be.util.createWidgets(widget.boundObject, widget);

            return dfd;
        },

        _clicksorterToggled: [],

        _genericSortFunction: function (property) {
            var sortOrder = 1;

            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }

            return function (a, b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            };
        },

        _genericSortMultiFunction: function (cols) {
            var widget = this;

            return function (obj1, obj2) {
                var i = 0,
                    result = 0,
                    numberOfProperties = cols.length;

                // try getting a different result from 0 (equal)
                // as long as we have extra properties to compare
                while (result === 0 && i < numberOfProperties) {
                    result = widget._genericSortFunction(cols[i])(obj1, obj2);
                    i += 1;
                }
                return result;
            };
        },

        _getJSObservableTemplate: function (name)
        {
            return $.templates(
                    name,
                    {
                        markup: '#' + name,
                        allowCode: true,
                        helpers: {
                            returnFunctions: be.util.returnFunctions
                        }
                    }
                );
        },

        _parseTemplate: function (
            target,
            templateName,
            dataSource,
            dataSourceBindingValue,
            dataHeaderTemplateName,
            dataFooterTemplateName
        ) {
            var widget = this,
                templateSource,
                templateHeaderSource = null,
                templateFooterSource = null,
                dfd = new $.Deferred(),
                isDataSource = false,
                fragment;

            templateName = widget.get(templateName);
            dataHeaderTemplateName = widget.get(dataHeaderTemplateName);
            dataFooterTemplateName = widget.get(dataFooterTemplateName);

            if (templateName === "" || templateName === null || templateName === undefined) {
                return dfd.fail();
            }

            templateSource = widget._getJSObservableTemplate(templateName);

            if (dataHeaderTemplateName !== "" &&
                    dataHeaderTemplateName !== null &&
                    dataHeaderTemplateName !== undefined) {
                templateHeaderSource = widget._getJSObservableTemplate(dataHeaderTemplateName);
            }

            if (dataFooterTemplateName !== "" &&
                    dataFooterTemplateName !== null &&
                    dataFooterTemplateName !== undefined) {
                templateFooterSource = widget._getJSObservableTemplate(dataFooterTemplateName);
            }

            if (dataSource === null) {
                dataSource = widget.dataSource;
                isDataSource = true;
            } else if (Object.prototype.toString.call(dataSource) !== "[object Array]") {
                dataSource = [dataSource];
            }

            if (dataSource === widget.dataSource) {
                isDataSource = true;
            }

            fragment = document.createDocumentFragment();

            widget._batchedParse(
                templateHeaderSource,
                templateFooterSource,
                templateSource,
                dataSource,
                dataSourceBindingValue,
                target,
                widget,
                fragment,
                dfd,
                isDataSource
            );

            return dfd;
        },

        // TODO consider deleting this.
        _postParse: function (template, widget) {
            var bindingStartIndex, binding, bindingEndIndex;

            while (template.indexOf("#:") !== -1) {
                bindingStartIndex = template.indexOf("#:");
                binding = template.substr(bindingStartIndex + 2);
                bindingEndIndex = binding.indexOf("#");

                binding = binding.substr(0, bindingEndIndex);
                binding = binding.trim();

                binding = binding === "this" ? widget.viewModel : widget.get(binding);

                if (typeof binding !== 'string' && !(binding instanceof String)) {
                    binding = JSON.stringify(binding);
                }

                template = template.substr(0, bindingStartIndex)
                    + binding
                    + template.substr(bindingEndIndex + bindingStartIndex + 3);
            }

            return template;
        },

        _batchedParse: function (header, footer, templateSource, dataSource,dataSourceBindingValue, target, widget, fragment, dfd, isDataSource, batchBase) {
            var template, htmlObject, batchSize = 50, j, headerTemplate, footerTemplate;
            // Start of recursion
            if (batchBase === null || batchBase === undefined) {
                batchBase = 0;
            }

            // While batch base is less then datasource carry on.
            if (batchBase < dataSource.length) {
                for (j = batchBase; j < batchBase + batchSize && j < dataSource.length; j += 1) {
                    // Set dataSourceIndex if we are on the dataSource
                    if (isDataSource) {
                        widget.setDataSourceIndex(j);
                    } else {
                        widget.setCustomSourceIndex(j);
                        widget.setCustomSourceTarget(dataSourceBindingValue);
                    }
                    // Parse
                    template = widget._postParse(templateSource.render(dataSource[j]), widget);
                    // Make html obj
                    htmlObject = $(template);
                    htmlObject.each(function () {
                        var innerHtmlObj = $(this);
                        fragment.appendChild(innerHtmlObj[0]);
                        widget.bind(innerHtmlObj, widget.dataSourceIndex, true, widget.customSourceIndex, dataSourceBindingValue);
                    });
                }
                // Increment batchBase
                batchBase = batchBase + batchSize;
            }

            // If we have more to execute then setTimeout
            if (batchBase < dataSource.length) {
                // Move to the end of current execution stack so we can keep rendering with out locking the screen;
                setTimeout(function () {
                    // RECURSION AHOY!
                    widget._batchedParse(
                        header, footer, templateSource, dataSource, target, widget, fragment, dfd, isDataSource, batchBase
                    );
                }, 0); // All we want is continue other execution so 0 is fine.

                // Otherwise we are done and need to append
            } else {
                // We need to build the whole template header and footer included if they exist to guess the structure.
                template = "";

                // If we have a header add it.
                if (header !== null) {
                    // Parse and post parse once. Dont bind yet as we do it later
                    headerTemplate = widget._postParse(header.render(dataSource[0]));
                    template += headerTemplate;
                }

                // Add a place holder for main content
                template += "<script id='superMergerTarget'></script>";

                // If we have a footer add it.
                if (footer !== null) {
                    // Parse and post parse once. Dont bind yet as we do it later
                    footerTemplate = widget._postParse(footer.render(dataSource[0]));
                    template += footerTemplate;
                }

                // Convert to html object
                htmlObject = $(template);

                // So at this point we could have nothing but the script tag or a container or a wrapper
                // BUT IN ANY CASE AT THIS POINT WE MUST HAVE VALID HTML

                // Attempt to find the place holder - this should always return a selector
                var htmlTarget = htmlObject.
                    // check if its nested in container situation.
                    find('#superMergerTarget').
                    // Check self if wrapper or single situation.
                    addBack('#superMergerTarget');

                // Select The element
                var element = htmlTarget[0];
                // If we have a parent then we are WRAPPER OR SINGLE
                if (element.parentElement === null) {
                    // Clear the targets html
                    target.html("");
                    // If we have a header which is already parsed then bind and add it
                    if (header !== null) {
                        headerTemplate = $(headerTemplate);
                        widget.bind(headerTemplate, 0);
                        target.html(headerTemplate);
                    }
                    // Add body
                    target[0].appendChild(fragment);
                    // If we have a footer which is already parsed then bind and add it
                    if (footer !== null) {
                        footerTemplate = $(footerTemplate);
                        widget.bind(footerTemplate, 0);
                        target.append(footerTemplate);
                    }
                    // If we hit the else then we must be a container and need to bind then replace the placeholder.
                } else {
                    widget.bind(htmlObject, 0);
                    element.appendChild(fragment);

                    while (element.firstChild) {
                        element.parentNode.insertBefore(element.firstChild, element);
                    }

                    element.parentNode.removeChild(element);
                    target.append(htmlObject);
                }
                // Resolve the deffered as we have finished the template
                dfd.resolve(target);
            }
        },

        _parseGenericSelect: function (target, templateName, dataSource, dataSourceBindingValue) {
            var widget = this,
                html = "",
                i;

            //Todo make deffereddde;
            target = be.util.jqueryafiy(target);

            if (templateName !== "" && templateName !== null && templateName !== undefined) {
                widget._parseTemplate(target, templateName, dataSource, dataSourceBindingValue);
            }

            for (i = 0; i < dataSource.length; i += 1) {
                if (dataSource[i].id !== undefined) {
                    html += "<option value='" + dataSource[i].id + "'>" + dataSource[i].name + "</option>";
                } else {
                    html += "<option>" + dataSource[i] + "</option>";
                }
            }

            target.html(html);
        }
    };
}(jQuery, be));