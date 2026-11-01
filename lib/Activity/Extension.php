<?php

declare(strict_types=1);

namespace OCA\ShareLinkViewTracker\Activity;

class Extension {
	public const APP_NAME = 'sharelinkviewtracker';
	public const TYPE_PUBLIC_LINK_VIEWS = 'public_link_views';

	public const SUBJECT_PUBLIC_SHARED_FILE_VIEWED = 'public_shared_file_viewed';
	public const SUBJECT_PUBLIC_SHARED_FOLDER_VIEWED = 'public_shared_folder_viewed';
}
