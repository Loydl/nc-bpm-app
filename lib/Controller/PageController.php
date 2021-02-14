<?php

namespace OCA\FilesBpmn\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

class PageController extends Controller {
	/** @var string */
	private $userId;

	public function __construct(string $appName, IRequest $request, string $userId) {
		parent::__construct($appName, $request);
		$this->userId = $userId;
	}

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index(): Response {
		return new TemplateResponse('filesbpmn', 'index');  // templates/index.php
	}
}
