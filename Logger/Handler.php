<?php
namespace DiligentWebTech\EmailValidation\Logger;

use Magento\Framework\Logger\Handler\Base;
use Monolog\Logger as MonologLogger;

class Handler extends Base
{
    protected $fileName = '/var/log/email_validation.log';
    protected $loggerType = MonologLogger::DEBUG;
}
