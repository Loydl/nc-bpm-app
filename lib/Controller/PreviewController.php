<?php

namespace OCA\FilesBpm\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class PreviewController extends Controller {
	public function __construct(
		$appName,
		IRequest $request
	) {
		parent::__construct($appName, $request);
	}

	public function check(?string $url) {
		if ($url === null || empty($url)) {
			return new DataResponse(['result' => 'invalid-url']);
		}

		$response = file_get_contents($url . 'status', false);

		if ($response !== null && $response !== false) {
			$data = json_decode($response);

			if ($data !== null && $data->status === 'ok') {
				return new DataResponse(['result' => 'success']);
			}
		}

		return new DataResponse(['result' => 'invalid-url']);
	}
}
