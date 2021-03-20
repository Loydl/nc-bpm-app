<?php

namespace OCA\FilesBpm\Listener;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Files_Sharing\Event\BeforeTemplateRenderedEvent;
use OCA\FilesBpm\AppInfo\Application;
use OCP\AppFramework\Services\IInitialState;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

class LoadAdditionalScriptsListener implements IEventListener {
	/** @var IInitialState */
	private $initialState;

	public function __construct(IInitialState $initialState) {
		$this->initialState = $initialState;
	}

	public function handle(Event $event): void {
		if (!($event instanceof LoadAdditionalScriptsEvent) &&
			!($event instanceof BeforeTemplateRenderedEvent)) {
			return;
		}

		if ($event instanceof BeforeTemplateRenderedEvent) {
			/** @var BeforeTemplateRenderedEvent $event */
			$share = $event->getShare();

			$this->initialState->provideInitialState('share', [
				'permissions' => $share->getPermissions(),
				'nodeType' => $share->getNodeType(),
				'nodeId' => $share->getNodeId(),
			]);
		}

		\OCP\Util::addScript(Application::APPID, 'filelist');
	}
}
