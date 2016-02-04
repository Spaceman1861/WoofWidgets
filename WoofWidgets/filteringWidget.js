// See ../test/widgetdoco
(function ($, be, undefined) {
    be.widgets.filteringWidget = $.extend(true,{}, be.widgets.baseWidget,
    {
        options: {
            widgetName: "filteringWidget",

            filterCaseSensitive: false,

            // Classes that filtering will be applied to
            jquerySelectorTarget: null,
            removeCollapseOnInput: true,
            // Default to bootstrap collapse
            collapseRemoveSelector: '.filterable.sub-menu.toggled',
            collapseAddSelector: '.filterable.sub-menu:not(.toggled)',

            enableFilterUpDownSelection: false,
            upDownSelectionSelectionClass: "upDownSelectionSelectionClass"
        },

        postInit: function () {
            var widget = this;

            if (widget.get("enableFilterUpDownSelection") === true)
            {
                be.keys.bindings.add(
                    'filterUp',
                    new be.keys.Combo(be.keys.Key.Up)
                );
                be.keys.bindings.add(
                    'filterDown',
                    new be.keys.Combo(be.keys.Key.Down)
                );
                be.keys.bindings.add(
                    'filterEnter',
                    new be.keys.Combo(be.keys.Key.Enter)
                );
                
                var filterUpFunc = widget._wrapperForGenericFunction("upCalled");
                var filterDownFunc = widget._wrapperForGenericFunction("downCalled");
                var filterEnterFunc = widget._wrapperForGenericFunction("enterCalled");

                be.keys.bindings.registerHandler(
                    "filterUp",
                    filterUpFunc,
                    true
                );
                be.keys.bindings.registerHandler(
                    "filterDown",
                    filterDownFunc,
                    true
                );
                be.keys.bindings.registerHandler(
                    "filterEnter",
                    filterEnterFunc,
                    true
                );
            }
        },

        viewModel: {

            focusAndContentClass : function ()
            {
                var vm = this;
                var widget = vm.widget;

                return widget.get("inputValue") !== "" ? " fg-toggled" : "";
            },

            inputChange: function()
            {
                var vm = this;
                var widget = vm.widget;
                // get the value of the input, which we filter on
                var filter = widget.get("inputValue");
                var prev = widget.get("previousValue");

                if (prev === filter)
                    return;

                // set this in non-observablefashion
                widget.viewModel.previousValue = filter;

                // Get the target for the filter
                var target = widget.get("jquerySelectorTarget");

                $(target).each(function()
                {
                    if (vm.recursiveSelectorFilter($(this), filter, target) === true)
                    {
                        $(this).show();
                    } else
                    {
                        $(this).hide();
                    }
                });

                var collapseRemoveSelector = filter.trim() === "" ?
                    widget.get("collapseRemoveSelector") :
                    widget.get("collapseAddSelector");

                $(collapseRemoveSelector).each(function()
                {
                    // simulate open
                    // Todo: make less soulution specific
                    $(this).children()[0].click()
                });
            },

            recursiveSelectorFilter: function(selector, filter, target)
            {
                var vm = this;
                var widget = vm.widget;

                while (selector.length !== 0)
                {
                    var selectorFilter = widget.get("filterCaseSensitive")
                        ? "contains"
                        : "containsCaseIgnore";

                    if (selector.find("a:" + selectorFilter + "(" + filter + ")").length !== 0)
                        return true;

                    selector = selector.find(target);
                }
                return false;
            },

            checkBoundSearchInputHasFocus: function()
            {
                var vm = this;
                var widget = vm.widget;

                return document.activeElement == widget.boundObject;
            },

            upCalled: function()
            {
                var vm = this;
                var widget = vm.widget;

                be.util.log("upCalled", widget);

                if (widget.get("checkBoundSearchInputHasFocus") === false)
                    return false;
            
                vm.upAndDownIndexChange(-1);
            },

            downCalled: function()
            {
                var vm = this;
                var widget = vm.widget;
                be.util.log("downCalled", widget);

                if (widget.get("checkBoundSearchInputHasFocus") === false)
                    return false;

                vm.upAndDownIndexChange(1);
            },

            enterCalled: function () {
                var vm = this;
                var widget = vm.widget;
            
                be.util.log("enterCalled", widget);

                if (widget.get("checkBoundSearchInputHasFocus") === false)
                    return false;

                var selectionClass = widget.get("upDownSelectionSelectionClass" + ":visible");

                // Maybe to specfic?
                $("."+selectionClass).children('a')[0].click();
            },

            upAndDownIndexChange: function(amount)
            {
                var vm = this;
                var widget = vm.widget;
                var valid = $(widget.get("jquerySelectorTarget") + ":visible");
                var selectionClass = widget.get("upDownSelectionSelectionClass"); 
                be.util.log("downCalled", widget);

                if (valid.length === 0)
                    return;

                if (valid.hasClass(selectionClass) === false) {
                    $(valid[0]).addClass(selectionClass);
                }
                else {
                    var indexAt = 0;
                    valid.each(function (index, element) {
                        if ($(element).hasClass(selectionClass))
                        {
                            indexAt = index;
                        }
                    });

                    if (valid[indexAt + amount] != undefined)
                    {
                        $(widget.get("jquerySelectorTarget")).removeClass(selectionClass);
                        $(valid[indexAt + amount]).addClass(selectionClass);
                    }
                }

                // Very Specific Need to optionate
                $('.navbar-nav').scrollTo("." + selectionClass, { duration: '10', offsetTop: '200' });
            },

            previousValue: "",

            inputValue : ""
        }
    });
})(jQuery, be);