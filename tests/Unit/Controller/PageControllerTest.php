<?php

namespace OCA\FilesBpmn\Tests\Unit\Controller;

use OCA\FilesBpmn\Controller\PageController;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use PHPUnit\Framework\TestCase;

class PageControllerTest extends TestCase {
	/** @var PageController */
	private $controller;

	private $userId = 'john';

	public function setUp(): void {
		/** @var IRequest */
		$request = $this->getMockBuilder(IRequest::class)->getMock();

		$this->controller = new PageController(
			'files_bpmn', $request, $this->userId
		);
	}

	public function testIndex() {
		$result = $this->controller->index();

		$this->assertEquals('index', $result->getTemplateName());
		$this->assertTrue($result instanceof TemplateResponse);
	}
}
