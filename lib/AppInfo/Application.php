<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\AppInfo;

use OCA\Files_Sharing\Event\ShareLinkAccessedEvent;
use OCA\ShareLinkViewTracker\Listener\PublicShareAccessListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
	public const APP_ID = 'sharelinkviewtracker';

	/** @psalm-suppress PossiblyUnusedMethod */
	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(ShareLinkAccessedEvent::class, PublicShareAccessListener::class);
	}

	public function boot(IBootContext $context): void {
	}
}
