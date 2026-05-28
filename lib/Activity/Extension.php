<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\Activity;

use OCP\Activity\IExtension;
use OCP\L10N\IFactory;

class Extension implements IExtension {
	public const APP_NAME = 'sharelinkviewtracker';
	public const TYPE_PUBLIC_LINK_VIEWS = 'public_link_views';

	public const SUBJECT_PUBLIC_SHARED_FILE_VIEWED = 'public_shared_file_viewed';
	public const SUBJECT_PUBLIC_SHARED_FOLDER_VIEWED = 'public_shared_folder_viewed';

	public function __construct(private IFactory $languageFactory) {
	}

	/**
	 * @return array<string, string>
	 */
	public function getNotificationTypes($languageCode) {
		$l = $this->languageFactory->get(self::APP_NAME, $languageCode);

		return [
			self::TYPE_PUBLIC_LINK_VIEWS => (string) $l->t('A public shared file or folder was <strong>viewed</strong>'),
		];
	}

	/**
	 * @return array<int, string>|false
	 */
	public function getDefaultTypes($method) {
		if ($method === self::METHOD_STREAM) {
			return [self::TYPE_PUBLIC_LINK_VIEWS];
		}

		return false;
	}

	public function getTypeIcon($type) {
		if ($type === self::TYPE_PUBLIC_LINK_VIEWS) {
			return 'icon-visible';
		}

		return false;
	}

	public function translate($app, $text, $params, $stripPath, $highlightParams, $languageCode) {
		if ($app !== self::APP_NAME) {
			return false;
		}

		$l = $this->languageFactory->get(self::APP_NAME, $languageCode);
		switch ($text) {
			case self::SUBJECT_PUBLIC_SHARED_FILE_VIEWED:
				return (string) $l->t('Public shared file %1$s was viewed', $params);
			case self::SUBJECT_PUBLIC_SHARED_FOLDER_VIEWED:
				return (string) $l->t('Public shared folder %1$s was viewed', $params);
		}

		return false;
	}

	public function getSpecialParameterList($app, $text) {
		return false;
	}

	public function getGroupParameter($activity) {
		return false;
	}

	public function getNavigation() {
		return false;
	}

	public function isFilterValid($filterValue) {
		return $filterValue === self::TYPE_PUBLIC_LINK_VIEWS;
	}

	public function filterNotificationTypes($types, $filter) {
		if ($filter === self::TYPE_PUBLIC_LINK_VIEWS) {
			return [self::TYPE_PUBLIC_LINK_VIEWS];
		}

		return false;
	}

	public function getQueryForFilter($filter) {
		if ($filter !== self::TYPE_PUBLIC_LINK_VIEWS) {
			return false;
		}

		return ['`app` = ? AND `type` = ?', [self::APP_NAME, self::TYPE_PUBLIC_LINK_VIEWS]];
	}
}
