<?php

declare(strict_types=1);

use OCP\Util;

Util::addScript(OCA\ShareLinkViewTracker\AppInfo\Application::APP_ID, OCA\ShareLinkViewTracker\AppInfo\Application::APP_ID . '-main');
Util::addStyle(OCA\ShareLinkViewTracker\AppInfo\Application::APP_ID, OCA\ShareLinkViewTracker\AppInfo\Application::APP_ID . '-main');

?>

<div id="sharelinkviewtracker"></div>
