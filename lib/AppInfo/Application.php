<?php

namespace OCA\FilesBpmn\AppInfo;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Files_Sharing\Event\BeforeTemplateRenderedEvent;
use OCA\FilesBpmn\Listener\LoadAdditionalScriptsListener;
use OCA\FilesBpmn\Preview\BPMN;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\IPreview;

class Application extends App implements IBootstrap {
	public const APPID = 'files_bpmn';

	public const MIMETYPE = 'application/x-bpmn';

	/**
	 * @param array $params
	 */
	public function __construct(array $params = []) {
		parent::__construct(self::APPID, $params);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadAdditionalScriptsListener::class);
		$context->registerEventListener(BeforeTemplateRenderedEvent::class, LoadAdditionalScriptsListener::class);
	}

	public function boot(IBootContext $context): void {
		$context->injectFn(function (IPreview $previewManager, BPMN $bpmn) {
			$previewManager->registerProvider('/application\/x-bpmn/', function () use ($bpmn) {
				return $bpmn;
			});
		});
	}
}
