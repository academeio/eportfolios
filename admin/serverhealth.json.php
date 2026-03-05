<?php
/**
 *
 * @package    eportfolios
 * @subpackage admin
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

define('INTERNAL', 1);
define('ADMIN', 1);
define('JSON', 1);

require(dirname(dirname(__FILE__)) . '/init.php');
require_once(get_config('libroot') . 'serverhealth.php');

$health = get_server_health();
json_reply(false, array('data' => $health));
