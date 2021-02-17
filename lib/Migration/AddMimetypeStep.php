<?php

namespace OCA\FilesBpmn\Migration;

use OCP\Files\IMimeTypeDetector;
use OCP\Files\IMimeTypeLoader;
use OCP\Migration\IOutput;
use OCP\Migration\IRepairStep;

class AddMimetypeStep implements IRepairStep {
	public const MIMETYPE = 'application/x-bpmn';
	public const EXTENSION = 'bpmn';

	/** @var IMimeTypeDetector */
	protected $mimetypeDetector;

	/** @var IMimeTypeLoader */
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
	public function run(IOutput $output) {
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
	}
}
