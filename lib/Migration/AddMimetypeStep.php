<?php

namespace OCA\FilesBpm\Migration;

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
	private const MAPPING = [
		'bpmn' => 'application/x-bpmn',
		'dmn' => 'application/x-dmn',
	];

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
		return 'Add mimetypes for BPM';
	}

	/**
	 * @param IOutput $output
	 */
	public function run(IOutput $output): void {
		foreach (self::MAPPING as $extension => $mimetype) {
			$this->addMimetype($mimetype, $extension, $output);
		}

		$this->registerMimetypeMapping($output);
	}

	private function addMimetype(string $mimetype, string $extension, IOutput $output) {
		$existing = $this->mimetypeLoader->exists($mimetype);

		// this will add the mimetype if it didn't exist
		$mimetypeId = $this->mimetypeLoader->getId($mimetype);

		if (!$existing) {
			$output->info('Added mimetype '.$mimetype.' to database');
		}

		$touchedFilecacheRows = $this->mimetypeLoader->updateFilecache($extension, $mimetypeId);

		if ($touchedFilecacheRows > 0) {
			$output->info('Updated '.$touchedFilecacheRows.' filecache rows for mimetype '.$mimetype);
		}
	}

	private function registerMimetypeMapping(IOutput $output) {
		$mimetypeMappingFile = \OC::$configDir . 'mimetypemapping.json';
		$existingMapping = [];

		if (file_exists($mimetypeMappingFile)) {
			$existingMapping = json_decode(file_get_contents($mimetypeMappingFile), true);

			if (json_last_error() !== JSON_ERROR_NONE) {
				$output->warning('Failed to parse ' . $mimetypeMappingFile . ': ' . json_last_error_msg());

				return;
			}
		}

		$dirty = false;
		foreach (self::MAPPING as $extension => $mimetype) {
			if (!array_key_exists($extension, $existingMapping)) {
				$dirty = true;
				$existingMapping[$extension] = [$mimetype];
			}
		}

		if (!$dirty) {
			return;
		}

		$jsonString = json_encode($existingMapping, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

		$size = file_put_contents($mimetypeMappingFile, $jsonString);

		if ($size !== false) {
			$output->info('Custom mimetype mapping was written to config directory');
		} else {
			$output->warning('Could not write custom mimetype mapping');
		}
	}
}
