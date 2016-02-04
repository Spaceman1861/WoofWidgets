;
(function ($, be) {
    "use strict";
    be.bindings = be.bindings === undefined ? {} : be.bindings;

    be.bindings.getBindingObject = function (key) {
        for (var i = 0; i < be.bindings.bindingObjects.length; i++) {
            if (be.bindings.bindingObjects[i].binding === key.toLowerCase())
                return be.bindings.bindingObjects[i];
        }
    }

    be.bindings.bindingObjectsBase = {
        binding: "",
        initalSetFunction: false,
        observableHtmlToObjectFunction: false,
        observableObjectToHtmlFunction: false,
        observableObjectToHtmlBindingEvents: "keydown keyup keypress blur change",
        doMergeOnNewData: false,
        getValueAsBoolean: false,
        getValueAsFunction: false,
        getValueAsKeyPair: false,
        needsTemplateBinding: false,
        bind: function (widget, bindingDomObject, bindingValue, dataSourceIndex, customSourceIndex, customSourceTar) {
            // Set the initial value
            if (this.initalSetFunction !== false) {
                be.bindings.genericSetWrapper(
                    widget,
                    bindingDomObject,
                    bindingValue,
                    dataSourceIndex,
                    customSourceIndex,
                    customSourceTar,
                    this
                );
            }

            // Bind the observable Html -> Object
            if (this.observableHtmlToObjectFunction !== false) {
                bindingDomObject.on(
                    this.observableObjectToHtmlBindingEvents,
                    be.bindings.genericHtmlToObjectWrapper(
                        widget,
                        bindingDomObject,
                        bindingValue,
                        dataSourceIndex,
                        customSourceIndex,
                        customSourceTar,
                        this
                    )
                );
            }

            // Bind the observable Object -> Html
            if (this.observableObjectToHtmlFunction !== false) {
                $(widget.viewModel).on(
                    "propertyChange",
                    be.bindings.genericHtmlObserverWrapper(
                        widget,
                        bindingDomObject,
                        bindingValue,
                        dataSourceIndex,
                        customSourceIndex,
                        customSourceTar,
                        this
                    )
                );
            }
        }
    }

    // WRAPPERS - BEGIN
    be.bindings.genericSetWrapper = function (widget, target, value, dataSourceIndex, customSourceIndex, customSourceTar, bindingObject, functionType) {
        var valueOut;

        widget.setDataSourceIndex(dataSourceIndex);
        widget.setCustomSourceIndex(customSourceIndex);
        widget.setCustomSourceTarget(customSourceTar);

        target = be.util.jqueryafiy(target);
        // Set on the dom the index so we can get it later
        target.idx = dataSourceIndex;
        target.cidx = customSourceIndex;
        target.ctar = customSourceTar;

        if (bindingObject.getValueAsBoolean === true) {
            valueOut = be.util.booleanBindingParse(widget, value);
        }
        else if (bindingObject.getValueAsFunction === true) {
            valueOut = function (event) {
                widget.setDataSourceIndex(target.idx);
                widget.setCustomSourceIndex(target.cidx);
                widget.setCustomSourceTarget(target.ctar);

                widget.get(value, false, true)[value](event, target);
            }
        }
        else if (bindingObject.getValueAsKeyPair === true) {
            var keys = Object.keys(value);

            if (keys.length === 1) {
                valueOut = {
                    target: keys[0],
                    value: widget.get(value[keys[0]])
                }
            }
            else {
                valueOut = {
                    target: value[keys[0]],
                    value: widget.get(value[keys[1]])
                }
            }
        }
        else {
            valueOut = widget.get(value);
        }

        if (functionType == undefined) {
            bindingObject.initalSetFunction(valueOut, target);
            // Set on the dom the index so we can get it later
            target.idx = dataSourceIndex;
        }
        else if (functionType === "observableObjectToHtmlFunction")
        {
            bindingObject.observableObjectToHtmlFunction(valueOut, target);
        }

        if (bindingObject.needsTemplateBinding === true) {
            widget._bindTemplates(target);
        }
    }

    be.bindings.genericHtmlToObjectWrapper = function (widget, target, binding, dataSourceIndex, customSourceIndex, customSourceTar, bindingObject) {
        return function () {
            widget.setDataSourceIndex(dataSourceIndex);
            widget.setCustomSourceIndex(target.cidx);
            widget.setCustomSourceTarget(target.ctar);

            var val = bindingObject.observableHtmlToObjectFunction(target);

            if (widget.get(binding) !== val) {
                widget.set(binding, val);
            }
        };
    }

    be.bindings.genericHtmlObserverWrapper = function (widget, target, value, dataSourceIndex, customSourceIndex, customSourceTar, bindingObject) {
        return function () {
            be.bindings.genericSetWrapper(
                widget,
                target,
                value,
                dataSourceIndex,
                customSourceIndex,
                customSourceTar,
                bindingObject,
                "observableObjectToHtmlFunction"
            );
        };
    }
    // WRAPPERS - END

    // HTML SET FUNCTIONS - BEGIN
    be.bindings.animateHtmlSetFunc = function (value, target) {
        target.finish().animate(obj.animationChanges, obj.animationTime);
    };

    be.bindings.attrHtmlSetFunc = function (value, target) {
        if (target.attr(value.target) !== value.value) {
            target.attr(value.target, value.value);
        }
    };

    be.bindings.changeHtmlSetFunc = function (value, target) {
        target.on("change", function (event) {
            value(event, this);
        });
    };

    be.bindings.classHtmlSetFunc = function (value, target) {
        target.removeClass();
        target.addClass(value);
    };

    be.bindings.clickHtmlSetFunc = function (value, target) {
        target.on("click", function (event) {
            event.stopPropagation();
            event.preventDefault();

            if (event.handled !== true) {
                event.handled = true;
                value(event, this);
            }

            return false;
        });
    };

    be.bindings.clicksorterHtmlSetFunc = function (value, target) {
        // TODO: REFACTOR?
        target.on("click", function (event) {
            if (event.handled !== true) {
                var clicksorterToggled = widget.get("_clicksorterToggled"),
                    i;

                for (i = 0; i < clicksorterToggled.length; i += 1) {
                    if (clicksorterToggled[i] === '-' + value.prop) {
                        clicksorterToggled.splice(i, 1);
                        widget.set("_clicksorterToggled", clicksorterToggled);
                        widget.sort(clicksorterToggled, value.target);
                        return;
                    }
                    if (clicksorterToggled[i] === value.prop) {
                        clicksorterToggled.splice(i, 1);
                        clicksorterToggled.push('-' + value.prop);
                        widget.set("_clicksorterToggled", clicksorterToggled);
                        widget.sort(clicksorterToggled, value.target);
                        return;
                    }
                }

                clicksorterToggled.push(value.prop);
                widget.set("_clicksorterToggled", clicksorterToggled);
                widget.sort(clicksorterToggled, value.target);
                event.handled = true;
            }
        });
    };

    be.bindings.cssHtmlSetFunc = function (value, target) {
        if (target.css(value.target) !== value.value) {
            target.css(value.target, value.value);
        }
    };

    be.bindings.dateHtmlSetFunc = function (date, target) {
        var returnString = "";

        if (!(date instanceof Date)) {
            be.util.log(value + " is not the type of date", widget);

            try {
                date = new Date(Date.parse(date));
            } catch (e) {
                be.util.log(value + " typecast failed - date", widget);
                return;
            }

            if (!(date instanceof Date)) {
                return;
            }
        }

        returnString =
            date.getDate() + '/' +
            (date.getMonth() + 1) + '/' +
            date.getFullYear();

        target.val(returnString);

        try {
            target.datepicker("destroy");
        } catch (e) {
            // THIS IS FILITHY
        }

        target.datepicker({ dateFormat: 'dd/mm/yy' });
    };

    be.bindings.enabledHtmlSetFunc = function (value, target) {
        if (value === true) {
            target.prop('disabled', false);
        } else {
            target.prop('disabled', true);
        }
    };

    be.bindings.hideHtmlSetFunc = function (value, target) {
        if (value === true) {
            target.hide();
        }
    };

    be.bindings.htmlHtmlSetFunc = function (value, target) {
        // To stop any wacko iframe request
        // Check if the html we are binding is the exact same.
        // Replace the auto encoding of &
        if (target.html().replace(/&amp;/g, '&') !== value.replace(/&amp;/g, '&')) {
            // Delete any sub widgets that are about to get clobbered
            be.util.deleteWidgets(target);

            // Set Html
            target.html(value);

            // In case of new widgets
            be.util.createWidgets();
        }
    };

    be.bindings.jsonHtmlSetFunc = function (value, target) {
        var json = JSON.parse(value);

        if (target.text() !== json) {
            target.text(json);
        }
    };

    be.bindings.keydownHtmlSetFunc = function (value, target) {
        target.on("keydown", function (event) {
            value(event, this);
        });
    };

    be.bindings.keyupHtmlSetFunc = function (value, target) {
        target.on("keyup", function (event) {
            value(event, this);
        });
    };

    be.bindings.moneyHtmlSetFunc = function (value, target) {
        var output = parseFloat(value);

        if (output === "0.00" || output == NaN || output == "NaN") {
            output = '-';
        } else {
            output = output.toLocaleString("en-US", {style:"currency", currency:"USD", minimumFractionDigits: 2});
        }

        target.text(output);
    };

    be.bindings.srcHtmlSetFunc = function (value, target) {
        if (target.attr("src") !== value) {
            target.attr("src", value);
        }
    };

    be.bindings.tdhideHtmlSetFunc = function (value, target) {
        if (value) {
            target.css('visibility', 'hidden');
        }
    };

    be.bindings.textHtmlSetFunc = function (value, target) {
        if (target.text() !== value) {
            target.text(value);
        }
    };

    be.bindings.piechartHtmlSetFunc = function (value, target) {
        // Missing charts.js
        if (be.util.sparkline === undefined) return;
        var options = {
            id: target.attr("id"),
            trackColor: 'rgba(255,255,255,0.2)',
            scaleColor: 'rgba(255,255,255,0.5)',
            barColor: 'rgba(255,255,255,0.7)',
            lineWidth: 7,
            lineCap: 'butt',
            size: 148
        };

        if (target.data('pieChartOptions')) {
            options = $.extend(true, {}, options, target.data('pieChartOptions'));
        }

        be.util.sparkline.easyPieChart(
            options.id,
            options.trackColor,
            options.scaleColor,
            options.barColor,
            options.lineWidth,
            options.lineCap,
            options.size
        );
    };

    be.bindings.sparklineHtmlSetFunc = function (value, target) {
        // Missing charts.js
        if (be.util.sparkline === undefined) return;
        if (!target.data('sparkline')) {
            var options = {
                id: target.attr("id"),
                values: value,
                width: '100%',
                height: '95px',
                lineColor: 'rgba(255,255,255,0.7)',
                fillColor: 'rgba(0,0,0,0)',
                lineWidth: 2,
                maxSpotColor: 'rgba(255,255,255,0.4)',
                minSpotColor: 'rgba(255,255,255,0.4)',
                spotColor: 'rgba(255,255,255,0.4)',
                spotRadius: 5,
                highlightSpotColor: 'rgba(255,255,255,0.4)',
                highlightLineColor: '#fff'
            };

            be.util.sparkline.sparklineLine(
                options.id,
                options.values,
                options.width,
                options.height,
                options.lineColor,
                options.fillColor,
                options.lineWidth,
                options.maxSpotColor,
                options.minSpotColor,
                options.spotColor,
                options.spotRadius,
                options.hSpotColor,
                options.hLineColor
            );
        } else { // Already set just update
            //target.data('easyPieChart').update(value)
        }
    };

    be.bindings.timetextshortHtmlSetFunc = function (value, target) {
        var time, ms, secs, mins, hrs;

        ms = value % 1000;
        value = (value - ms) / 1000;
        secs = ("00" + (value % 60)).slice(-2);
        value = (value - secs) / 60;
        mins = ("00" + (value % 60)).slice(-2);
        hrs = (value - mins) / 60;

        time = mins + ':' + secs;
        if (hrs !== 0) {
            time = hrs + ':' + mins + ':' + secs;
        }

        target.text(time);
    };

    be.bindings.valueHtmlSetFunc = function (value, target) {
        var type = target.attr('type');

        if (type && type === 'checkbox') {
            if (target.prop('checked') !== value) {
                if (value === true) {
                    target.prop('checked', true);
                } else {
                    target.prop('checked', false);
                }
            }
        } else {
            if (target.val() !== value) {
                target.val(value);
            }
        }
    };

    be.bindings.visibleHtmlSetFunc = function (value, target) {
        if (value === true) {
            //if (value === true && target.is(':visible')) {
            target.show();
        } else if (value === false) {
            //} else if (value === false && !target.is(':visible')) {
            target.hide();
        }
    };
    // HTML SET FUNCTIONS - END

    // HTML BIND FUNCTIONS - BEGIN
    be.bindings.dateHtmlBindFunc = function (target) {
        var dateparts = target.val().split("/"),
            date = new Date(
                dateparts[2],
                dateparts[1] - 1,
                dateparts[0]
            );

        return date;
    };

    be.bindings.valueHtmlBindFunc = function (target) {
        var type = target.attr('type'),
            val = target.val();

        if (type && type === 'checkbox') {
            val = target.prop('checked');
        }

        return val;
    };
    // HTML BIND FUNCTIONS - END

    be.bindings.bindingObjects = [
        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "animate",
            initalSetFunction: be.bindings.animateHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.animateHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "attr",
            initalSetFunction: be.bindings.attrHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.attrHtmlSetFunc,
            getValueAsKeyPair: true,
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "change",
            initalSetFunction: be.bindings.changeHtmlSetFunc,
            getValueAsFunction: true,
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "class",
            initalSetFunction: be.bindings.classHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.classHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "click",
            initalSetFunction: be.bindings.clickHtmlSetFunc,
            getValueAsFunction: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "clicksorter",
            initalSetFunction: be.bindings.clicksorterHtmlSetFunc,
            getValueAsFunction: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "css",
            initalSetFunction: be.bindings.cssHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.cssHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "date",
            initalSetFunction: be.bindings.dateHtmlSetFunc,
            observableHtmlToObjectFunction: be.bindings.dateHtmlBindFunc,
            observableObjectToHtmlFunction: be.bindings.dateHtmlSetFunc,
            observableObjectToHtmlBindingEvents: "change"
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "enabled",
            initalSetFunction: be.bindings.enabledHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.enabledHtmlSetFunc,
            getValueAsBoolean: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "hide", // merge with visible hide and tdhide?
            initalSetFunction: be.bindings.hideHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.hideHtmlSetFunc,
            getValueAsBoolean: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "html",
            initalSetFunction: be.bindings.htmlHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.htmlHtmlSetFunc,
            needsTemplateBinding: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "json",
            initalSetFunction: be.bindings.jsonHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.jsonHtmlSetFunc,
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "keyup",
            initalSetFunction: be.bindings.keyupHtmlSetFunc,
            getValueAsFunction: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "keydown",
            initalSetFunction: be.bindings.keydownHtmlSetFunc,
            getValueAsFunction: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "money",
            initalSetFunction: be.bindings.moneyHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.moneyHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "piechart",
            initalSetFunction: be.bindings.piechartHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.piechartHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "sparkline",
            initalSetFunction: be.bindings.sparklineHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.sparklineHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "src",
            initalSetFunction: be.bindings.srcHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.srcHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "tdhide", // merge with visible hide and tdhide?
            initalSetFunction: be.bindings.tdhideHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.tdhideHtmlSetFunc,
            getValueAsBoolean: true
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "text",
            initalSetFunction: be.bindings.textHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.textHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "timetextshort",
            initalSetFunction: be.bindings.timetextshortHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.timetextshortHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "value",
            initalSetFunction: be.bindings.valueHtmlSetFunc,
            observableHtmlToObjectFunction: be.bindings.valueHtmlBindFunc,
            observableObjectToHtmlFunction: be.bindings.valueHtmlSetFunc
        }),

        $.extend(true, {}, be.bindings.bindingObjectsBase, {
            binding: "visible", // merge with visible hide and tdhide?
            initalSetFunction: be.bindings.visibleHtmlSetFunc,
            observableObjectToHtmlFunction: be.bindings.visibleHtmlSetFunc,
            getValueAsBoolean: true
        })
    ];

}(jQuery, be));