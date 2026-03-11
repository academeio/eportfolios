<?php
$cfg = new stdClass();

// Database connection — pointing to Docker MariaDB container
$cfg->dbtype   = 'mysql';
$cfg->dbhost   = 'db';
$cfg->dbport   = 3306;
$cfg->dbname   = 'eportfolios_dev';
$cfg->dbuser   = 'eportfolios';
$cfg->dbpass   = 'eportfolios_dev_pw';

// Data directory inside container
$cfg->dataroot = '/var/www/maharadata';

// URL
$cfg->wwwroot = 'http://localhost:8091/';

// Password salt (dev only)
$cfg->passwordsaltmain = 'dev_eportfolios_testing_salt_2026';

// URL secret for cron and upgrades
$cfg->urlsecret = 'devsecret';

// Non-production mode for development
$cfg->productionmode = false;

// Show errors during development
$cfg->perftofoot = true;
