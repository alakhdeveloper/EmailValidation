<?php
namespace DiligentWebTech\EmailValidation\Model;

use Magento\Framework\Mail\Template\TransportBuilder;
use Magento\Framework\Translate\Inline\StateInterface;
use Magento\Store\Model\StoreManagerInterface;

class OtpSender
{
    protected $transportBuilder, $inlineTranslation, $storeManager;

    public function __construct(
        TransportBuilder $transportBuilder,
        StateInterface $inlineTranslation,
        StoreManagerInterface $storeManager
    ) {
        $this->transportBuilder = $transportBuilder;
        $this->inlineTranslation = $inlineTranslation;
        $this->storeManager = $storeManager;
    }

    public function sendOtp($email, $otp)
    {
        try {
            $this->inlineTranslation->suspend();
            $store = $this->storeManager->getStore();

            $transport = $this->transportBuilder
                ->setTemplateIdentifier('email_otp_template')
                ->setTemplateOptions(['area' => 'frontend', 'store' => $store->getId()])
                ->setTemplateVars(['otp' => $otp])
                ->setFrom('general')
                ->addTo($email)
                ->getTransport();

            $transport->sendMessage();
            $this->inlineTranslation->resume();
            return true;
        } catch (\Exception $e) {
            $this->inlineTranslation->resume();
            return false;
        }
    }
}