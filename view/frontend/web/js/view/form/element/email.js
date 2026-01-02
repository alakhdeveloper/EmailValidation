/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'jquery',
    'uiComponent',
    'ko',
    'Magento_Customer/js/model/customer',
    'Magento_Customer/js/action/check-email-availability',
    'Magento_Customer/js/action/login',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/model/full-screen-loader',
    'mage/validation',
    'mage/url'
], function ($, Component, ko, customer, checkEmailAvailability, loginAction, quote, checkoutData, fullScreenLoader, validation, urlBuilder) {
    'use strict';

    var validatedEmail;

    if (!checkoutData.getValidatedEmailValue() &&
        window.checkoutConfig.validatedEmailValue
    ) {
        checkoutData.setInputFieldEmailValue(window.checkoutConfig.validatedEmailValue);
        checkoutData.setValidatedEmailValue(window.checkoutConfig.validatedEmailValue);
    }

    validatedEmail = checkoutData.getValidatedEmailValue();

    if (validatedEmail && !customer.isLoggedIn()) {
        quote.guestEmail = validatedEmail;
    }

    return Component.extend({
        defaults: {
            template: 'DiligentWebTech_EmailValidation/form/element/email',
            email: checkoutData.getInputFieldEmailValue(),
            emailFocused: false,
            isLoading: false,
            isPasswordVisible: false,
            isOtpVisible: false,
            otpMessage: '',
            listens: {
                email: 'emailHasChanged',
                emailFocused: 'validateEmail'
            },
            ignoreTmpls: {
                email: true
            }
        },
        checkDelay: 2000,
        checkRequest: null,
        isEmailCheckComplete: null,
        isCustomerLoggedIn: customer.isLoggedIn,
        forgotPasswordUrl: window.checkoutConfig.forgotPasswordUrl,
        emailCheckTimeout: 0,

        /**
         * Initializes regular properties of instance.
         *
         * @returns {Object} Chainable.
         */
        initConfig: function () {
            this._super();

            this.isPasswordVisible = this.resolveInitialPasswordVisibility();

            return this;
        },

        /**
         * Initializes observable properties of instance
         *
         * @returns {Object} Chainable.
         */
        initObservable: function () {
            this._super()
                .observe(['email', 'emailFocused', 'isLoading', 'isPasswordVisible', 'isOtpVisible', 'otpMessage', 'isOtpValidated']);
            this.isOtpValidated(false); // Default to false

            return this;
        },

        /**
         * Callback on changing email property
         */
        emailHasChanged: function () {
            var self = this;

            clearTimeout(this.emailCheckTimeout);

            if (self.validateEmail()) {
                quote.guestEmail = self.email();
                checkoutData.setValidatedEmailValue(self.email());
            }
            this.emailCheckTimeout = setTimeout(function () {
                if (self.validateEmail()) {
                    self.checkEmailAvailability();
                } else {
                    self.isPasswordVisible(false);
                    self.isOtpVisible(false);
                }
            }, self.checkDelay);

            checkoutData.setInputFieldEmailValue(self.email());
        },

        /**
         * Check email existing.
         */
        checkEmailAvailability: function () {
            this.validateRequest();
            this.isEmailCheckComplete = $.Deferred();
            this.isLoading(true);
            this.checkRequest = checkEmailAvailability(this.isEmailCheckComplete, this.email());

            $.when(this.isEmailCheckComplete).done(function () {
                this.isPasswordVisible(false);
                this.isOtpVisible(true); // Show OTP if password is not visible
				console.log('sending otp');
				this.resendOtp();
                checkoutData.setCheckedEmailValue('');
            }.bind(this)).fail(function () {
                this.isPasswordVisible(true);
                this.isOtpVisible(false); // Hide OTP if password is visible
                checkoutData.setCheckedEmailValue(this.email());
                this.enableContinueToPayment();
            }.bind(this)).always(function () {
                this.isLoading(false);
            }.bind(this));
        },

        /**
         * If request has been sent -> abort it.
         * ReadyStates for request aborting:
         * 1 - The request has been set up
         * 2 - The request has been sent
         * 3 - The request is in process
         */
        validateRequest: function () {
            if (this.checkRequest != null && $.inArray(this.checkRequest.readyState, [1, 2, 3])) {
                this.checkRequest.abort();
                this.checkRequest = null;
            }
        },

        /**
         * Local email validation.
         *
         * @param {Boolean} focused - input focus.
         * @returns {Boolean} - validation result.
         */
        validateEmail: function (focused) {
            var loginFormSelector = 'form[data-role=email-with-possible-login]',
                usernameSelector = loginFormSelector + ' input[name=username]',
                loginForm = $(loginFormSelector),
                validator,
                valid;

            loginForm.validation();

            if (focused === false && !!this.email()) {
                valid = !!$(usernameSelector).valid();

                if (valid) {
                    $(usernameSelector).removeAttr('aria-invalid aria-describedby');
                }

                return valid;
            }

            if (loginForm.is(':visible')) {
                validator = loginForm.validate();

                return validator.check(usernameSelector);
            }

            return true;
        },

        /**
         * Log in form submitting callback.
         *
         * @param {HTMLElement} loginForm - form element.
         */
        login: function (loginForm) {
            var loginData = {},
                formDataArray = $(loginForm).serializeArray();

            formDataArray.forEach(function (entry) {
                loginData[entry.name] = entry.value;
            });

            if (this.isPasswordVisible() && $(loginForm).validation() && $(loginForm).validation('isValid')) {
                fullScreenLoader.startLoader();
                loginAction(loginData).always(function () {
                    fullScreenLoader.stopLoader();
                });
            }
        },

        /**
         * Resolves an initial state of a login form.
         *
         * @returns {Boolean} - initial visibility state.
         */
        resolveInitialPasswordVisibility: function () {
            if (checkoutData.getInputFieldEmailValue() !== '' && checkoutData.getCheckedEmailValue() !== '') {
                return true;
            }

            if (checkoutData.getInputFieldEmailValue() !== '') {
                return checkoutData.getInputFieldEmailValue() === checkoutData.getCheckedEmailValue();
            }

            return false;
        },
        /**
         * Check if product is virtual or not and return
         *
         */
        isVirtualProduct : function(){
            var quoteItemData =  window.checkoutConfig.quoteItemData;
            var count =  quoteItemData.length;
        
            var isVirtualFlag = 1;

            if(count >= 1){
                $.each(quoteItemData, function (key, val) {
                    if(val.product.type_id != 'virtual'){
                        isVirtualFlag = 0;
                        return false;
                    }else{
                        isVirtualFlag = 1;
                    }
                });
            }
            return isVirtualFlag;
        },

        sendOtp: function () {
			console.log('sending otp method');
            var self = this;
            self.isLoading(true);
            self.otpMessage('');
			console.log('sending otp calling ajax');
            this.disableContinueToPayment();
			console.log('disabled continue to payment button');
            $.post(urlBuilder.build('emailupdate/otp/send'), {email: self.email()}, function(response){
                if(response.success){
                    self.otpMessage('OTP sent to your email.');
                } else {
                    self.otpMessage(response.message || 'Failed to send OTP.');
                }
                self.isLoading(false);
            }, 'json').fail(function(){
                self.otpMessage('Failed to send OTP.');
                self.isLoading(false);
            });
        },

        resendOtp: function () {
            this.sendOtp();
        },

        validateOtp: function () {
            var self = this;
            var otp = $('#customer-otp').val();
            self.isLoading(true);
            self.otpMessage('');
            $.post(urlBuilder.build('emailupdate/otp/validate'), {email: self.email(), otp: otp}, function(response){
                if(response.success){
                    self.otpMessage('OTP validated!');
                    self.isOtpValidated(true); 
                    self.enableContinueToPayment();
                } else {
                    self.otpMessage(response.message || 'Invalid OTP.');
                    self.isOtpValidated(false); 
                    self.disableContinueToPayment();
                }
                self.isLoading(false);
            }, 'json').fail(function(){
                self.otpMessage('Failed to validate OTP.');
                self.isOtpValidated(false);
                self.isLoading(false);
				self.disableContinueToPayment();
            });
        },
		
		disableContinueToPayment: function() {
			$('#co-shipping-method-form .actions-toolbar .button.action.primary').prop('disabled', true);
		}, 
		
		enableContinueToPayment: function() {
			$('#co-shipping-method-form .actions-toolbar .button.action.primary').prop('disabled', false);
		},
		
		nextStep: function() {
			console.log("validated: " + self.isOtpValidated());
			if(self.isOtpValidated()) {
				$('#co-shipping-method-form .actions-toolbar .button.action.primary').prop('disabled', false);
			} else {
				$('#co-shipping-method-form .actions-toolbar .button.action.primary').prop('disabled', true);
			}
		}
    });
});
