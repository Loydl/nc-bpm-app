<?php

if (!defined('PHPUNIT_RUN')) {
	define('PHPUNIT_RUN', 1);
}

if (!($ncRoot = getenv('NEXTCLOUD_ROOT'))) {
	$ncRoot = __DIR__ . '/../../..';
}

require_once $ncRoot . '/lib/base.php';
require_once __DIR__ . '/../vendor/autoload.php';
