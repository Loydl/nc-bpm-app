<?php

namespace OCA\FilesBpmn\Tests\Integration;

use OCP\App\IAppManager;
use OCP\AppFramework\App;
use PHPUnit\Framework\TestCase;

/**
 * This test shows how to make a small Integration Test. Query your class
 * directly from the container, only pass in mocks if needed and run your tests
 * against the database
 */
class AppTest extends TestCase {
	private $container;

	public function setUp(): void {
		parent::setUp();
		$app = new App('files_bpmn');
		$this->container = $app->getContainer();
	}

	public function testAppInstalled() {
		/** @var IAppManager */
		$appManager = $this->container->query(IAppManager::class);
		$appManager->enableApp('files_bpmn');

		$this->assertTrue($appManager->isInstalled('files_bpmn'));
	}
}
