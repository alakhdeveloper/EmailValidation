**DiligentWebTech_EmailValidation — README**

- **Purpose:** Replaces the checkout email UI to support OTP verification and custom email handling during checkout.

- **High-level Flow:**
  - Checkout email field is overridden by a custom component `DiligentWebTech_EmailValidation/js/view/form/element/email` (RequireJS mapping).
  - The component validates email locally, then calls Magento's `check-email-availability` action to determine if the address is associated with an account.
  - If the email exists (customer login flow) the original password flow is shown. If it does not exist, the module can send an OTP to the provided email and require OTP validation before continuing.
  - OTP send: frontend POST to `emailupdate/otp/send` → handled by the module OTP controller which uses `OtpSender` to build & send the email.
  - OTP validate: frontend POST to `emailupdate/otp/validate` → controller validates token and responds with success/failure; on success checkout continues.

- **Key files & locations:**
  - Module registration: `app/code/DiligentWebTech/EmailValidation/registration.php`
  - Module declaration: `app/code/DiligentWebTech/EmailValidation/etc/module.xml`
  - RequireJS mapping: `app/code/DiligentWebTech/EmailValidation/view/frontend/requirejs-config.js`
  - Component JS (checkout): `app/code/DiligentWebTech/EmailValidation/view/frontend/web/js/view/form/element/email.js`
  - Component template: `app/code/DiligentWebTech/EmailValidation/view/frontend/web/template/form/element/email.html`
  - OTP controllers: `Controller/Otp/Send.php`, `Controller/Otp/Validate.php` (module path)
  - Mail sender: `Model/OtpSender.php` (handles email construction and sending)
  - Logger: `Logger/Logger.php` and `Logger/Handler.php` (custom logger used by controllers/services)
  - Email templates: `etc/email_templates.xml` and `view/frontend/email/...` (template files)

- **Installation / Deploy:**
  1. Enable module (if not already): `php bin/magento module:enable DiligentWebTech_EmailValidation`
  2. Run DB & DI updates: `php bin/magento setup:upgrade && php bin/magento setup:di:compile`
  3. Redeploy frontend assets and clear caches:
     ```bash
     rm -rf pub/static/frontend/* var/view_preprocessed/*
     php bin/magento setup:static-content:deploy -f
     php bin/magento cache:flush
     ```

- **Troubleshooting:**
  - If checkout still shows the Magento default template, redeploy static assets and clear caches (theme-level requirejs-config or prebuilt bundles can override/merge mappings).
  - Confirm `pub/static/frontend/<Vendor>/<theme>/requirejs-config.js` contains the `DiligentWebTech_EmailValidation` mapping after deployment.
  - If OTP emails are not sent, check `var/log/` for entries from the module logger and ensure transport configuration (SMTP) is correct.

- **Security & Notes:**
  - OTP endpoints should be rate-limited and protected against abuse — the module includes simple client-side measures; consider adding server-side rate limits.
  - Keep email templates translatable and avoid exposing sensitive info in OTP messages.

If you want, I can run `setup:upgrade` and `setup:static-content:deploy` now and verify the merged `requirejs-config.js` in `pub/static`.
