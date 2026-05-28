<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\Listener;

use OCA\Files_Sharing\Event\ShareLinkAccessedEvent;
use OCA\Files_Sharing\Controller\ShareController;
use OCA\ShareLinkViewTracker\Activity\Extension;
use OCP\Activity\IManager as IActivityManager;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IRequest;

/** @template-implements IEventListener<ShareLinkAccessedEvent> */
class PublicShareAccessListener implements IEventListener {
	public function __construct(
		private IRequest $request,
		private IActivityManager $activityManager,
	) {
	}

	public function handle(Event $event): void {
		if (!($event instanceof ShareLinkAccessedEvent)) {
			return;
		}

		if ($event->getErrorCode() !== 200) {
			return;
		}

		// Only track page views, not downloads or password authentication
		if ($event->getStep() !== ShareController::SHARE_ACCESS) {
			return;
		}

		$share = $event->getShare();
		$ip = $this->request->getRemoteAddress();

		$eventObject = $this->activityManager->generateEvent();
		$eventObject->setApp(Extension::APP_NAME)
			->setType(Extension::TYPE_PUBLIC_LINK_VIEWS)
			->setAffectedUser($share->getShareOwner())
			->setObject('files', $share->getNodeId(), $share->getTarget());

		if ($share->getNodeType() === 'folder') {
			$eventObject->setSubject(Extension::SUBJECT_PUBLIC_SHARED_FOLDER_VIEWED, [$share->getNode()->getName(), $ip]);
		} else {
			$eventObject->setSubject(Extension::SUBJECT_PUBLIC_SHARED_FILE_VIEWED, [$share->getNode()->getName(), $ip]);
		}

		$this->activityManager->publish($eventObject);
	}
}
