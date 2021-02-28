<?php

namespace OCA\FilesBpm\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Admin implements ISettings {

	/** @var string */
	private $appName;

	/** @var IConfig */
	private $config;

	/**
	 * Admin constructor.
	 *
	 * @param IConfig $config
	 */
	public function __construct(string $appName, IConfig $config) {
		$this->appName = $appName;
		$this->config = $config;
	}

	/**
	 * @return TemplateResponse
	 */
	public function getForm() {
		$parameters = [
			'preview.server' => $this->config->getAppValue($this->appName, 'preview.server'),
		];

		return new TemplateResponse($this->appName, 'admin', $parameters);
	}

	/**
	 * @return string the section ID, e.g. 'sharing'
	 */
	public function getSection() {
		return 'additional';
	}

	/**
	 * @return int whether the form should be rather on the top or bottom of
	 * the admin section. The forms are arranged in ascending order of the
	 * priority values. It is required to return a value between 0 and 100.
	 */
	public function getPriority() {
		return 50;
	}
}
