<?php
/**
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Catalyst IT Limited <mahara@catalyst.net.nz>
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2006-2022 Catalyst IT Limited. (C) 2026 Academe Research, Inc.
 *
 */

defined('INTERNAL') || die();

$config = new stdClass();

// See https://wiki.mahara.org/wiki/Developer_Area/Version_Numbering_Policy
// For upgrades on dev branches, increment the version by one. On main, use the date.

$config->version = 2026030200;
$config->series = '22.20';
$config->release = '22.20.1';
$config->minupgradefrom = 2022090903;
$config->minupgraderelease = '22.10.0 (Mahara 22.10.0)';
