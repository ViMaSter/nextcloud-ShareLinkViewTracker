<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\Activity;

use OCP\Activity\Exceptions\UnknownActivityException;
use OCP\Activity\IEvent;
use OCP\Activity\IManager;
use OCP\Activity\IProvider;
use OCP\IURLGenerator;
use OCP\L10N\IFactory;

class Provider implements IProvider {
	public function __construct(
		private IFactory $languageFactory,
		private IURLGenerator $url,
		private IManager $activityManager,
	) {
	}

	public function parse($language, IEvent $event, ?IEvent $previousEvent = null): IEvent {
		if ($event->getApp() !== Extension::APP_NAME) {
			throw new UnknownActivityException();
		}

		$l = $this->languageFactory->get(Extension::APP_NAME, $language);
		$params = $event->getSubjectParameters();
		$ip = $params[1] ?? '';

		$icon = $this->activityManager->getRequirePNG()
			? $this->url->getAbsoluteURL($this->url->imagePath('core', 'actions/shared.png'))
			: $this->url->getAbsoluteURL($this->url->imagePath('core', 'actions/shared.svg'));

		$event->setIcon($icon);

		switch ($event->getSubject()) {
			case Extension::SUBJECT_PUBLIC_SHARED_FILE_VIEWED:
			case Extension::SUBJECT_PUBLIC_SHARED_FOLDER_VIEWED:
				$event->setRichSubject($l->t('Viewed by {ip}'), [
					'ip' => ['type' => 'highlight', 'id' => $ip, 'name' => $ip],
				]);
				break;
			default:
				throw new UnknownActivityException();
		}

		return $event;
	}
}
