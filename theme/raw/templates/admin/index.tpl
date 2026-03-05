{include file='header.tpl'}

{if $warnings}
<div class="admin-warning alert alert-warning">
<h2>{str tag="warnings" section=admin}</h2>
<ul>
{foreach from=$warnings key=key item=warning}
    <li>{$warning|safe}</li>
{/foreach}
</ul>
</div>
{/if}

{if $upgrades['settings']['toupgradecount']}
<div class="card bg-warning" id="">
    <h2 class="card-header">{str tag="upgrades" section=admin}</h2>
    <div class="card-body">
        <p>{str tag=thefollowingupgradesareready section=admin}</p>
        <table id="upgrades-table" class="table">
            <thead>
            <tr>
                <th>{str tag=Plugin section=admin}</th>
                <th>{str tag=From}</th>
                <th>{str tag=To}</th>
            </tr>
            </thead>
            <tbody>
            {foreach from=$upgrades key=key item=upgrade}
                {if $key != 'settings' && $upgrade->upgrade}
                <tr>
                    <td><strong>{if $upgrade->displayname}{$upgrade->displayname}{else}{$key}{/if}</strong></td>
                    <td>{$upgrade->fromrelease} ({$upgrade->from})</td>
                    <td>{$upgrade->torelease} ({$upgrade->to})</td>
                </tr>
                {/if}
            {/foreach}
            </tbody>
        </table>
        <a class="btn btn-secondary" href="upgrade.php">{str tag=runupgrade section=admin}</a>
    </div>
</div>
{/if}

{if $upgrades['settings']['newinstallcount']}
<div class="card bg-warning" id="runinstall">
    <h2 class="card-header">{str tag="newplugins" section=admin}</h2>
    <div class="card-body">
        <p>{str tag=thefollowingpluginsareready section=admin}</p>
        <table id="upgradestable" class="table">
            <thead>
            <tr>
                <th>{str tag=Plugin section=admin}</th>
                <th>{str tag=From}</th>
                <th>{str tag=To}</th>
            </tr>
            </thead>
            <tbody>
                {foreach from=$upgrades['settings']['newinstalls'] key=key item=upgrade}
                <tr>
                    <td><strong>{if $upgrade->displayname}{$upgrade->displayname}{else}{$key}{/if}</strong></td>
                    <td>{$upgrade->fromrelease}</td>
                    <td>{$upgrade->torelease} ({$upgrade->to})</td>
                </tr>
                {/foreach}
            </tbody>
        </table>
        <a class="btn btn-secondary" href="extensions/plugins.php">
            {str tag=gotoinstallpage section=admin}
            <span class="icon icon-arrow-right right" role="presentation" aria-hidden="true"></span>
        </a>
    </div>
</div>
{/if}
<div class="card-items js-masonry" data-masonry-options='{ "itemSelector": ".card" }'>
    {if $serverhealth}
    <div class="card {if $serverhealth.overall_status == 'critical'}bg-danger{elseif $serverhealth.overall_status == 'warning'}bg-warning{else}bg-success{/if}" id="server-health-card">
        <h2 class="card-header">{str tag=serverhealth section=admin} <span class="icon icon-heartbeat float-end" role="presentation" aria-hidden="true"></span></h2>
        <div class="card-body" id="server-health-body">
            <table class="table table-sm mb-0">
                <tbody>
                    <tr>
                        <td><strong>{str tag=phpversion section=admin}</strong></td>
                        <td>{$serverhealth.php_version}</td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=memorylimit section=admin}</strong></td>
                        <td>{$serverhealth.memory_limit}</td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=loadaverage section=admin}</strong></td>
                        <td>{$serverhealth.load_average}</td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=diskdataroot section=admin}</strong></td>
                        <td>
                            {if $serverhealth.disk_used_percent !== null}
                                <span class="{if $serverhealth.disk_status == 'critical'}text-danger{elseif $serverhealth.disk_status == 'warning'}text-warning{else}text-success{/if}">
                                    {$serverhealth.disk_free} / {$serverhealth.disk_total} ({$serverhealth.disk_used_percent}%)
                                </span>
                            {else}
                                {$serverhealth.disk_free}
                            {/if}
                        </td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=lastcronrun section=admin}</strong></td>
                        <td>
                            <span class="{if $serverhealth.cron_status == 'critical'}text-danger{elseif $serverhealth.cron_status == 'warning'}text-warning{else}text-success{/if}">
                                {$serverhealth.cron_human}
                            </span>
                            {if $serverhealth.cron_stuck_locks > 0}
                                <span class="badge bg-danger">{$serverhealth.cron_stuck_locks} stuck lock(s)</span>
                            {/if}
                        </td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=dbsize section=admin}</strong></td>
                        <td>{$serverhealth.db_size}</td>
                    </tr>
                    <tr>
                        <td><strong>{str tag=missingmodules section=admin}</strong></td>
                        <td>
                            {if $serverhealth.missing_modules > 0}
                                <span class="text-danger">{$serverhealth.missing_modules}</span>
                                <a href="{$WWWROOT}admin/extensions/plugins.php" class="text-small"> (view)</a>
                            {else}
                                <span class="text-success">0</span>
                            {/if}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="card-footer text-small text-muted">
            {str tag=serverhealthrefresh section=admin}
        </div>
    </div>
    <script>
    jQuery(function($) {
        function refreshServerHealth() {
            sendjsonrequest(config['wwwroot'] + 'admin/serverhealth.json.php', {}, 'GET', function(response) {
                var d = response.data;
                var statusClass = 'bg-success';
                if (d.overall_status === 'critical') statusClass = 'bg-danger';
                else if (d.overall_status === 'warning') statusClass = 'bg-warning';

                var card = $('#server-health-card');
                card.removeClass('bg-success bg-warning bg-danger').addClass(statusClass);

                var diskClass = d.disk_status === 'critical' ? 'text-danger' : (d.disk_status === 'warning' ? 'text-warning' : 'text-success');
                var cronClass = d.cron_status === 'critical' ? 'text-danger' : (d.cron_status === 'warning' ? 'text-warning' : 'text-success');

                var diskText = d.disk_used_percent !== null
                    ? '<span class="' + diskClass + '">' + d.disk_free + ' / ' + d.disk_total + ' (' + d.disk_used_percent + '%)</span>'
                    : d.disk_free;

                var cronText = '<span class="' + cronClass + '">' + d.cron_human + '</span>';
                if (d.cron_stuck_locks > 0) {
                    cronText += ' <span class="badge bg-danger">' + d.cron_stuck_locks + ' stuck lock(s)</span>';
                }

                var missingText = d.missing_modules > 0
                    ? '<span class="text-danger">' + d.missing_modules + '</span> <a href="' + config['wwwroot'] + 'admin/extensions/plugins.php" class="text-small"> (view)</a>'
                    : '<span class="text-success">0</span>';

                var rows = card.find('tbody tr');
                rows.eq(0).find('td:last').text(d.php_version);
                rows.eq(1).find('td:last').text(d.memory_limit);
                rows.eq(2).find('td:last').text(d.load_average);
                rows.eq(3).find('td:last').html(diskText);
                rows.eq(4).find('td:last').html(cronText);
                rows.eq(5).find('td:last').text(d.db_size);
                rows.eq(6).find('td:last').html(missingText);
            });
        }
        setInterval(refreshServerHealth, 60000);
    });
    </script>
    {/if}

    {if $register}

        <div class="card bg-success register-site">
            <h2 class="card-header">{str tag=registermaharasite section=admin} <span class="icon icon-star float-end" role="presentation" aria-hidden="true"></span></h2>
            <div class="card-body">
                {if $newregisterpolicy}
                    <strong>{str tag=newregistrationpolicyinfo1 section=admin}</strong>
                {/if}
            {str tag=registeryoursitesummary section=admin args=$WWWROOT}
            {if $firstregistered}
                <p>{str tag=siteisregisteredsince1 section=admin args=$firstregistered}</p>
            {/if}
            {if $sendweeklyupdates}
                <p>{str tag=sendingweeklyupdates1 section=admin}</p>
            {else}
                <p>{str tag=notsendingweeklyupdates section=admin}</p>
            {/if}
            </div>
            <a class="card-footer" href="{$WWWROOT}admin/registersite.php">{str tag=Registration section=admin} <span class="icon icon-arrow-circle-right float-end" role="presentation" aria-hidden="true"></span></a>
        </div>

    {/if}

    {if $sitedata}

        <div class="card bg-info site-stats">
            <h2 class="card-header">{$sitedata.displayname}: {str tag=siteinformation section=admin} <span class="icon icon-info float-end" role="presentation" aria-hidden="true"></span></h2>
            {include file='admin/users/stats.tpl' institutiondata=$sitedata showall='_all' fromindex='1'}
            <a class="card-footer text-small" href="{$WWWROOT}admin/users/statistics.php?type=information&subtype=information">{str tag=viewfullsitestatistics section=admin} <span class="icon icon-arrow-circle-right float-end" role="presentation" aria-hidden="true"></span></a>
        </div>

    {/if}

    <div class="card close-site {if $closed}bg-success {else}bg-danger {/if}">
        {if $closed}
            <h2 class="card-header">{str tag=reopensite section=admin} <span class="icon icon-lock float-end" role="presentation" aria-hidden="true"></span></h2>
            <div class="card-body">
                <p>{str tag=reopensitedetail section=admin}</p>
                {$closeform|safe}
            </div>
        {else}
            <h2 class="card-header">{str tag=closesite section=admin} <span class="icon icon-unlock float-end" role="presentation" aria-hidden="true"></span></h2>
            <div class="card-body">
                <p>{str tag=closesitedetail section=admin}</p>
                {$closeform|safe}
            </div>
        {/if}
    </div>

    <div class="card">
        <h2 class="card-header">{str tag=clearcachesheading section=admin} <span class="icon icon-sync-alt float-end" role="presentation" aria-hidden="true"></span></h2>
        <div class="card-body">
            <p>{str tag=cliclearcachesdescription section=admin}</p>
            {$clearcachesform|safe}
        </div>
    </div>

    <div class="card">
        <h2 class="card-header">{str tag=configsite section=admin} <span class="icon icon-cogs float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/options.php">{str tag=siteoptions section=admin}</a>
                <small> {str tag=siteoptionsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/pages.php">{str tag=staticpages section=admin}</a>
                <small> {str tag=staticpagesdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/privacy.php">{str tag=legal section=admin}</a>
                <small> {str tag=privacytermsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/menu.php">{str tag=menus section=admin}</a>
                <small> {str tag=menusdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/networking.php">{str tag=networking section=admin}</a>
                <small> {str tag=networkingdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/licenses.php">{str tag=sitelicenses section=admin}</a>
                <small> {str tag=sitelicensesdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/views.php">{str tag=Viewscollections1 section=view}</a>
                <small> {str tag=siteviewsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}artefact/blog/index.php?institution=mahara">{str tag=Blogs section=artefact.blog}</a>
                <small> {str tag=siteblogsdesc section=artefact.blog}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/shareviews.php">{str tag=share section=mahara}</a>
                <small> {str tag=sharesitefilesdesc1 section=admin}</small>
            </li>
            {ifconfig key=skins}
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/skins.php">{str tag=siteskinmenu section=skin}</a>
                <small> {str tag=siteskinsdesc section=admin}</small>
            </li>{/ifconfig}
            {ifconfig key=skins}
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/fonts.php">{str tag=sitefonts section=admin}</a>
                <small> {str tag=sitefontsdesc section=admin}</small>
            </li>{/ifconfig}
            <li class="list-group-item">
                <a href="{$WWWROOT}artefact/file/sitefiles.php">{str tag=Files section=group}</a>
                <small> {str tag=sitefilesdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/site/cookieconsent.php">{str tag=cookieconsent section=admin}</a>
                <small>{str tag=cookieconsentdesc section=admin}</small>
            </li>
        </ul>
    </div>
    <div class="card">
        <h2 class="card-header">{str tag=configusers section=admin} <span class="icon icon-user float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/search.php">{str tag=usersearch section=admin}</a>
                <small>{str tag=usersearchdescription1 section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/suspended.php">{str tag=suspendeduserstitle section=admin}</a>
                <small>{str tag=suspendedusersdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/staff.php">{str tag=sitestaff section=admin}</a>
                <small>{str tag=staffusersdesc1 section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/admins.php">{str tag=siteadmins section=admin}</a>
                <small>{str tag=adminusersdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/exportqueue.php">{str tag=exportqueue section=admin}</a>
                <small>{str tag=exportqueuedesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/add.php">{str tag=addaccount section=admin}</a>
                <small>{str tag=adduserdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/uploadcsv.php">{str tag=uploadcsv1 section=admin}</a>
                <small>{str tag=uploadcsvdesc section=admin}</small>
            </li>
        </ul>
    </div>



    <div class="card">
        <h2 class="card-header">{str tag=managegroups section=admin} <span class="icon icon-people-group float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/groups/groups.php">{str tag=administergroups section=admin}</a>
                <small>{str tag=administergroupsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/groups/groupcategories.php">{str tag=groupcategories section=admin}</a>
                <small>{str tag=groupcategoriesdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/groups/archives.php">{str tag=archivedsubmissions section=admin}</a>
                <small>{str tag=archivedsubmissionsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/groups/uploadcsv.php">{str tag=uploadgroupcsv section=admin}</a>
                <small>{str tag=uploadgroupcsvdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/groups/uploadmemberscsv.php">{str tag=uploadgroupmemberscsv section=admin}</a>
                <small>{str tag=uploadgroupmemberscsvdescription section=admin}</small>
            </li>
        </ul>
    </div>


    <div class="card">
        <h2 class="card-header">{str tag=manageinstitutions section=admin} <span class="icon icon-university float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutions.php">{str tag=settings section=mahara}</a>
                <small>{str tag=institutionsettingsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutionpages.php">{str tag=staticpages section=admin}</a>
                <small> {str tag=staticpagesinstdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutionprivacy.php">{str tag=legal section=admin}</a>
                <small> {str tag=institutionprivacytermsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutionusers.php">{str tag=members section=mahara}</a>
                <small>{str tag=institutionmembersdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutionstaff.php">{str tag=staff section=statistics}</a>
                <small>{str tag=institutionstaffdesc1 section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutionadmins.php">{str tag=Admins section=admin}</a>
                <small>{str tag=institutionadminsdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/notifications.php">{str tag=adminnotifications section=admin}</a>
                <small>{str tag=adminnotificationsdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/progressbar.php">{str tag=profilecompleteness section=mahara}</a>
                <small>{str tag=profilecompletiondesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}view/institutionviews.php">{str tag=Viewscollections1 section=view}</a>
                <small>{str tag=institutionviewsdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}artefact/blog/index.php?institution=1">{str tag=Blogs section=artefact.blog}</a>
                <small>{str tag=institutionblogsdesc section=artefact.blog}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}view/institutionshare.php">{str tag=share section=mahara}</a>
                <small>{str tag=shareinstitutionfilesdesc1 section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}artefact/file/institutionfiles.php">{str tag=Files section=group}</a>
                <small>{str tag=institutionfilesdescription section=admin}</small>
            </li>
            {if $institutiontags}
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/institutiontags.php">{str tag=tags section=mahara}</a>
                <small>{str tag=institutiontagsdesc section=admin}</small>
            </li>
            {/if}
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/pendingregistrations.php">{str tag=pendingregistrations section=admin}</a>
                <small>{str tag=pendingregistrationdesc section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/pendingdeletions.php">{str tag=pendingdeletions section=admin}</a>
                <small>{str tag=pendingdeletiondesc section=admin}</small>
            </li>
        </ul>
    </div>

    <div class="card">
        <h2 class="card-header">{str tag=configextensions section=admin} <span class="icon icon-puzzle-piece float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/extensions/plugins.php">{str tag=pluginadmin section=admin}</a>
                <small>{str tag=pluginadmindescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/extensions/filter.php">{str tag=htmlfilters section=admin}</a>
                <small>{str tag=htmlfiltersdescription section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/extensions/iframesites.php">{str tag=allowediframesites section=admin}</a>
                <small>{str tag=iframesitesdescriptionshort section=admin}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/extensions/cleanurls.php">{str tag=cleanurls section=admin}</a>
                <small>{str tag=cleanurlsdescriptionshort section=admin}</small>
            </li>
            {if $framework}
            <li class="list-group-item">
                <a href="{$WWWROOT}module/framework/frameworks.php">{str tag=smartevidence section=collection}</a>
                <small>{str tag=smartevidencedesc section=collection}</small>
            </li>
            {/if}
        </ul>
    </div>

    <div class="card">
        <h2 class="card-header">{str tag=webservice section=auth.webservice} <span class="icon icon-puzzle-piece float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/admin/index.php">{str tag=config section=mahara}</a>
                <small>{str tag=webservicesconfigdescshort section=auth.webservice}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/apptokens.php">{str tag=apptokens section=auth.webservice}</a>
                <small>{str tag=apptokensdesc section=auth.webservice}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/admin/connections.php">{str tag=connections section=auth.webservice}</a>
                <small>{str tag=connectionsdesc section=auth.webservice}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/admin/oauthv1sregister.php">{str tag=externalapps section=auth.webservice}</a>
                <small>{str tag=externalappsdesc section=auth.webservice}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/admin/webservicelogs.php">{str tag=webservicelogsnav section=auth.webservice}</a>
                <small>{str tag=webservicelogsdesc section=auth.webservice}</small>
            </li>
            <li class="list-group-item">
                <a href="{$WWWROOT}webservice/testclient.php">{str tag=testclientnav section=auth.webservice}</a>
                <small>{str tag=testclientdescshort section=auth.webservice}</small>
            </li>
        </ul>
    </div>

    <div class="card">
        <h2 class="card-header">{str tag=reports section=statistics} <span class="icon icon-chart-pie float-end" role="presentation" aria-hidden="true"></span></h2>
        <ul class="list-group">
            <li class="list-group-item">
                <a href="{$WWWROOT}admin/users/statistics.php">{str tag=reports section=statistics}</a>
                <small>{str tag=reportsdesc section=statistics}</small>
            </li>
        </ul>
    </div>

</div>
{include file='footer.tpl'}
