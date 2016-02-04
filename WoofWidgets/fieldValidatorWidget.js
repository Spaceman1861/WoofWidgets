// Docs : TODO Not Implemented
// TODO : validator does not actual stop page submit more of a guideline. There should be an option that stops this.
(function ($, be, undefined) {
    "use strict";
    be.widgets.fieldValidatorWidget = $.extend({}, be.widgets.baseWidget, {
        options: {
            widgetName: "fieldValidatorWidget",
            messageBoxClass: "alert alert-danger",

            // Requirements 0 = not required.
            initialValueIsAlwaysValid: true,
            initialValue: "",

            inputClass: "",
            placeholder: "",

            minChars: 0,
            minCharsFailed: "You are required to use a minimum of {0} characters.",
            maxChars: 0,
            maxCharsFailed: "You are required to use a maximum of {0} characters.",

            upperCaseRequired: false,
            upperCaseRequiredFailed: "You are required to use at least 1 uppercase character.",
            upperCaseAllowed: true,
            upperCaseAllowedFailed: "You are required to not use any uppercase characters.",

            numbersRequired: false,
            numbersRequiredFailed: "You are required to use at least 1 numerical character.",
            numbersAllowed: true,
            numbersAllowedFailed: "You are required to not use any numerical characters.",

            specialCharacters: "!@#$%^&*()",
            specialCharactersRequired: false,
            specialCharactersRequiredFailed: "You are required to use at least 1 special character ({0}).",
            specialCharactersAllowed: false,
            specialCharactersAllowedFailed: "You are required to not use any special characters ({0}).",

            formName: "",
            type: "text",
            size: 15,
            maxlength: 15,
            disabled: false
        },

        postInit: function () {
            var widget = this,
                vm = widget.viewModel;

            console.log(widget.options.initialValue);

            widget.set("fieldValue", widget.options.initialValue);
            vm.validate();
        },

        viewModel: {
            isValid: function () {
                var vm = this;

                return vm.validate();
            },

            messages: [],

            fieldValue: null,

            validate: function () {
                var vm = this,
                    widget = vm.widget,
                    value = widget.get("fieldValue"),
                    messages = [];

                if (widget.options.initialValueIsAlwaysValid === true && value === widget.options.initialValue) {
                    // hmmm
                } else {
                    if (widget.options.minChars !== 0 && value.length < widget.options.minChars)
                        messages.push(be.util.stringFormat(widget.options.minCharsFailed, widget.options.minChars));

                    if (widget.options.maxChars !== 0 && value.length > widget.options.maxChars)
                        messages.push(be.util.stringFormat(widget.options.maxCharsFailed, widget.options.maxChars));

                    if (widget.options.upperCaseRequired === true && vm.hasUpperCase(value) === false)
                        messages.push(widget.options.upperCaseRequiredFailed);

                    if (widget.options.upperCaseAllowed === false && vm.hasUpperCase(value) === true)
                        messages.push(widget.options.upperCaseAllowedFailed);

                    if (widget.options.numbersRequired === true && vm.hasNumericCharacters(value) === false)
                        messages.push(widget.options.numbersRequiredFailed);

                    if (widget.options.numbersAllowed === false && vm.hasNumericCharacters(value) === true)
                        messages.push(widget.options.numbersAllowedFailed);

                    if (widget.options.specialCharactersRequired === true && vm.hasSpecialCharacters(value) === false)
                        messages.push(
                            be.util.stringFormat(widget.options.specialCharactersRequiredFailed, widget.options.specialCharacters)
                        );

                    if (widget.options.specialCharactersAllowed === false && vm.hasSpecialCharacters(value) === true)
                        messages.push(
                            be.util.stringFormat(widget.options.specialCharactersAllowedFailed, widget.options.specialCharacters)
                        );
                }

                widget.set("messages", messages);

                return messages.length === 0;
            },

            hasLowerCase: function (str) {
                return (/[a-z]/.test(str));
            },

            hasUpperCase: function (str) {
                return (/[A-Z]/.test(str));
            },

            hasNumericCharacters: function (str) {
                return (/[0-9]/.test(str));
            },

            hasSpecialCharacters: function (str) {
                return (/!+|@+|#+|\$+|%+|\^+|&+|\*+|\(+|\)+/.test(str));
            },

            messagesToString: function () {
                var vm = this,
                    widget = vm.widget;

                return widget.get("messages").join("<br/>");
            },

            hasMessages: function () {
                var vm = this,
                    widget = vm.widget,
                    messages = widget.get("messages");

                return messages.length !== 0;
            }
        },

        // Default View
        baseView:
            '<input data-bind=\'{"value":"fieldValue","change":"validate","keyup":"validate","attr":{"type":"type"},"enabled":"!disabled","class":"inputClass","attr":{"placeholder":"placeholder"}}\'/>' +
            '<div data-bind=\'{"html":"messagesToString","class":"messageBoxClass","visible":"hasMessages"}\' style="position:absolute;"></div>' +
            // Use hidden to get around autofill
            '<input type="hidden" data-bind=\'{"value":"fieldValue","attr":{"name":"formName"}}\'/>'
    });
}(jQuery, be));