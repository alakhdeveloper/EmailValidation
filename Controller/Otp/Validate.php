<?php
namespace DiligentWebTech\EmailValidation\Controller\Otp;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Session\SessionManagerInterface;
use DiligentWebTech\EmailValidation\Logger\Logger;

class Validate extends Action
{
    protected $resultJsonFactory, $session, $logger;

    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        SessionManagerInterface $session,
        Logger $logger
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->session = $session;
        $this->logger = $logger;
    }

    public function execute()
    {
        //$this->session->start();
        $result = $this->resultJsonFactory->create();
        $email = $this->getRequest()->getParam('email');
        $otp = $this->getRequest()->getParam('otp');

        $sessionOtp = $this->session->getEmailOtp();
        $sessionEmail = $this->session->getEmailOtpEmail();
        $otpTime = $this->session->getEmailOtpTime();
		$this->logger->info("OTP validation to email: " . $email . " with OTP: " . $otp);
        if (!$email || !$otp) {
            $this->logger->info("Email and OTP are required for validation.");
            return $result->setData(['success' => false, 'message' => __('Email and OTP are required')]);
        }

        // Optional: Check OTP expiry (e.g., 10 minutes)
        if ($otpTime && (time() - $otpTime > 600)) {
            $this->logger->info("OTP expired for email: " . $email);
            return $result->setData(['success' => false, 'message' => __('OTP expired')]);
        }
		//echo "--".$sessionOtp ." , " . $sessionEmail;
		//echo "++".$otp ." , " . $email;
        if ($sessionOtp && $sessionEmail && $sessionEmail == $email && $sessionOtp == $otp) {
            $this->logger->info("OTP validated for email: " . $email . " with OTP: " . $otp);
            return $result->setData(['success' => true, 'message' => __('OTP validated')]);
        }
        $this->logger->warning("OTP validation failed for email: " . $email . ": Invalid OTP , expected: " . $sessionOtp . " but got: " . $otp);
        return $result->setData(['success' => false, 'message' => __('Invalid OTP')]);
    }
}