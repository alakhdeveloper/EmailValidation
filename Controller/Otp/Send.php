<?php
namespace DiligentWebTech\EmailValidation\Controller\Otp;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Session\SessionManagerInterface;
use DiligentWebTech\EmailValidation\Model\OtpSender;
use DiligentWebTech\EmailValidation\Logger\Logger;

class Send extends Action
{
    protected $resultJsonFactory, $session, $otpSender, $logger;

    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        SessionManagerInterface $session,
        OtpSender $otpSender,
        Logger $logger
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->session = $session;
        $this->otpSender = $otpSender;
        $this->logger = $logger;
    }

    public function execute()
    {
        $result = $this->resultJsonFactory->create();
        $email = $this->getRequest()->getParam('email');
        if (!$email) {
            return $result->setData(['success' => false, 'message' => __('Email is required')]);
        }
        $otp = random_int(100000, 999999);

        if ($this->otpSender->sendOtp($email, $otp)) {
            //$this->session->start();
            $this->session->setEmailOtp($otp);
            $this->session->setEmailOtpEmail($email);
            $this->session->setEmailOtpTime(time());
            $this->logger->info("OTP sent to email: " . $email . " with OTP: " . $otp);
            return $result->setData(['success' => true,  'message' => __('OTP sent')]);
        }
        $this->logger->error("OTP send failed for email: " . $email);
        return $result->setData(['success' => false, 'message' => __('Failed to send OTP')]);
    }
}