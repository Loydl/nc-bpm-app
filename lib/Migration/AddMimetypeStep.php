<?php

namespace OCA\FilesBpmn\Migration;

use OCP\Files\IMimeTypeDetector;
use OCP\Files\IMimeTypeLoader;
use OCP\Migration\IOutput;
use OCP\Migration\IRepairStep;

interface ITrueMimeTypeLoader extends IMimeTypeLoader {
	/**
	 * Update filecache mimetype based on file extension
	 *
	 * @param string $ext file extension
	 * @param int $mimeTypeId
	 * @return int number of changed rows
	 */
	public function updateFilecache($ext, $mimeTypeId);
}

class AddMimetypeStep implements IRepairStep {
	public const MIMETYPE = 'application/x-bpmn';
	public const EXTENSION = 'bpmn';

	/** @var IMimeTypeDetector */
	protected $mimetypeDetector;

	/** @var ITrueMimeTypeLoader */
	protected $mimetypeLoader;

	public function __construct(
		IMimeTypeDetector $mimetypeDetector,
		IMimeTypeLoader $mimetypeLoader
	  ) {
		$this->mimetypeDetector = $mimetypeDetector;
		$this->mimetypeLoader = $mimetypeLoader;
	}

	/**
	 * Returns the step's name
	 */
	public function getName() {
		return 'Add bpmn mimetype';
	}

	/**
	 * @param IOutput $output
	 */
	public function run(IOutput $output): void {
		$existing = $this->mimetypeLoader->exists(self::MIMETYPE);

		// this will add the mimetype if it didn't exist
		$mimetypeId = $this->mimetypeLoader->getId(self::MIMETYPE);

		if (!$existing) {
			$output->info('Added mimetype bpmn to database');
		}

		$touchedFilecacheRows = $this->mimetypeLoader->updateFilecache(self::EXTENSION, $mimetypeId);

		if ($touchedFilecacheRows > 0) {
			$output->info('Updated '.$touchedFilecacheRows.' filecache rows');
		}

		$this->registerMimetypeMapping($output);
	}

	private function registerMimetypeMapping(IOutput $output) {
		$mimetypeMappingFile = \OC::$configDir . 'mimetypemapping.json';
		$customMapping = [
			'bpmn' => ['application/x-bpmn']
		];

		if (file_exists($mimetypeMappingFile)) {
			$existingMapping = json_decode(file_get_contents($mimetypeMappingFile), true);

			if (json_last_error() !== JSON_ERROR_NONE) {
				$output->warning('Failed to parse ' . $mimetypeMappingFile . ': ' . json_last_error_msg());

				return;
			}

			if (array_key_exists('bpmn', $existingMapping)) {
				return;
			}

			$customMapping = array_merge($existingMapping, $customMapping);
		}

		$jsonString = json_encode($customMapping, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

		$size = file_put_contents($mimetypeMappingFile, $jsonString);

		if ($size !== false) {
			$output->info('Custom mimetype mapping was written to config directory');
		} else {
			$output->warning('Could not write custom mimetype mapping');
		}
	}
}
