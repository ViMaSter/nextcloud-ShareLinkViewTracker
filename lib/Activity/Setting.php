<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\Activity;

use OCP\Activity\ActivitySettings;
use OCP\IL10N;

class Setting extends ActivitySettings {
	public function __construct(private IL10N $l) {
	}

	public function getIdentifier(): string {
		return Extension::TYPE_PUBLIC_LINK_VIEWS;
	}

	public function getName(): string {
		return $this->l->t('A public shared file or folder was <strong>viewed</strong>');
	}

	public function getGroupIdentifier(): string {
		return Extension::APP_NAME;
	}

	public function getGroupName(): string {
		return $this->l->t('Share Link View Tracker');
	}

	public function getPriority(): int {
		return 50;
	}

	public function canChangeMail(): bool {
		return false;
	}

	public function isDefaultEnabledMail(): bool {
		return false;
	}

	public function canChangeNotification(): bool {
		return true;
	}

	public function isDefaultEnabledNotification(): bool {
		return true;
	}
}
