(function ($, be, undefined) {
    be.widgets.tabWidget = $.extend(true,{}, be.widgets.baseWidget,
    {
        options: {
            widgetName: "tabWidget",
            activeClass: "",
            targetParentForActiveClass: false
        },

        postInit: function () {
            var widget = this;
            var vm = widget.viewModel;

            var tabId = $(widget.boundObject).data("tabId");
            widget.set("tabId", tabId);

            var tabObjects = $('*[data-tab-id="' + tabId + '"][data-tab-target]');
            widget.set("tabObjects", tabObjects);

            tabObjects.each(function (index, tab) {
                $(tab).click(function () { vm.click(tab);});
            });

            vm.renderMagic();
        },

        viewModel: {
            tabId: "",

            tabObjects: null,

            renderMagic : function()
            {
                var vm = this;
                var widget = vm.widget;

                var tabObjects = widget.get("tabObjects");
            
                tabObjects.each(function (index, tab) {
                    var target = $(tab).data('tabTarget');
                    var show = $(tab).data('tabEnabled');
                    var classTar = widget.get("targetParentForActiveClass") === true ? $(tab).parent() : $(tab);

                    if (show === 'true' || show === true || show === 'True')
                    {
                        $(target).show();
                        $(classTar).addClass(widget.get("activeClass"));
                    }
                    else
                    {
                        $(classTar).removeClass(widget.get("activeClass"));
                        $(target).hide();
                    }
                });
            },

            click: function(tab)
            {
                var vm = this;
                var widget = vm.widget;

                var tabObjects = widget.get("tabObjects");

                tabObjects.each(function (index, tab) {
                    $(tab).data('tabEnabled', 'false');
                });

                $(tab).data('tabEnabled', 'true');

                vm.renderMagic();
            }
        }
    });
})(jQuery, be);