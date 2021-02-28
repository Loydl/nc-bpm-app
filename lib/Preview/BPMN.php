<?php

namespace OCA\FilesBpm\Preview;

use OCA\FilesBpm\AppInfo\Application;
use OCP\Files\File;
use OCP\Files\FileInfo;
use OCP\IConfig;
use OCP\IImage;
use OCP\Preview\IProviderV2;
use Psr\Log\LoggerInterface;

class BPMN implements IProviderV2 {
	/** @var IConfig */
	private $config;

	/** @var LoggerInterface */
	private $logger;

	public function __construct(IConfig $config, LoggerInterface $logger) {
		$this->config = $config;
		$this->logger = $logger;
	}

	public function getMimeType(): string {
		return Application::MIMETYPE;
	}

	public function isAvailable(FileInfo $file): bool {
		return $this->getPreviewServerUrl() !== '';
	}

	public function getThumbnail(File $file, int $maxX, int $maxY): ?IImage {
		$url = $this->getPreviewServerUrl();

		if ($url === '') {
			return null;
		}

		try {
			$preview = $this->requestPreview($url, $file->getContent());
		} catch (\Exception $exception) {
			$this->logger->warning('Could not get image from preview server', [ 'exception' => $exception ]);
			return null;
		}

		$image = new \OCP\Image();
		$image->loadFromData($preview);
		$image->fixOrientation();

		if ($image->valid()) {
			$image->scaleDownToFit($maxX, $maxY);

			return $image;
		}

		return null;
	}

	private function requestPreview($url, $content) {
		$context = stream_context_create(['http' => [
			'method' => 'POST',
			'header' => $this->getHeaderString([
				'Content-Type' => Application::MIMETYPE,
				'Accept' => 'image/png',
			]),
			'content' => $content,
			'timeout' => 30,
		]
		]);

		$body = file_get_contents($url, false, $context);

		if ($body === null || $body === false) {
			throw new \Exception('Got invalid response');
		}

		return $body;
	}

	private function getPreviewServerUrl(): string {
		$server = $this->config->getAppValue(Application::APPID, 'preview.server', '');

		return $server !== '' ? $server . 'preview' : '';
	}

	private function getHeaderString($headers) {
		$flattened = [];

		foreach ($headers as $key => $header) {
			if (is_int($key)) {
				$flattened[] = $header;
			} else {
				$flattened[] = $key.': '.$header;
			}
		}

		return implode("\r\n", $flattened) . "\r\n";
	}
}
