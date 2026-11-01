<?php

declare(strict_types=1);

// Psalm stubs for the files_sharing app classes, which are not part of nextcloud/ocp.
// Signatures mirror nextcloud/server stable31 to stable35.

namespace OCA\Files_Sharing\Event {
	use OCP\EventDispatcher\Event;
	use OCP\Share\IShare;

	class ShareLinkAccessedEvent extends Event {
		public function __construct(
			private IShare $share,
			private string $step = '',
			private int $errorCode = 200,
			private string $errorMessage = '',
		) {
			parent::__construct();
		}

		public function getShare(): IShare {
			return $this->share;
		}

		public function getStep(): string {
			return $this->step;
		}

		public function getErrorCode(): int {
			return $this->errorCode;
		}

		public function getErrorMessage(): string {
			return $this->errorMessage;
		}
	}
}

namespace OCA\Files_Sharing\Controller {
	use OCP\AppFramework\AuthPublicShareController;

	abstract class ShareController extends AuthPublicShareController {
		public const SHARE_ACCESS = 'access';
		public const SHARE_AUTH = 'auth';
		public const SHARE_DOWNLOAD = 'download';
	}
}
