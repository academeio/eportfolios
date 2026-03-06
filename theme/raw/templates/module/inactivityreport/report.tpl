{include file='header.tpl'}

{if $USER->get('admin') && $institutions}
<div class="card mb-3">
    <div class="card-body">
        <form method="get" action="{$WWWROOT}module/inactivityreport/report.php" class="form-inline">
            <label for="institution" class="me-2">{str tag=filterinstitution section=module.inactivityreport}:</label>
            <select name="institution" id="institution" class="form-select form-select-sm d-inline-block w-auto me-2">
                <option value="all"{if $institution_filter == 'all'} selected{/if}>{str tag=allinstitutions section=module.inactivityreport}</option>
                {foreach from=$institutions item=inst}
                <option value="{$inst->name}"{if $institution_filter == $inst->name} selected{/if}>{$inst->displayname}</option>
                {/foreach}
            </select>
            <button type="submit" class="btn btn-secondary btn-sm">{str tag=filter section=mahara}</button>
        </form>
    </div>
</div>
{/if}

{if $reports}
<div class="card">
    <h2 class="card-header">{str tag=reporthistory section=module.inactivityreport} <span class="text-small text-muted">({$count})</span></h2>
    <div class="table-responsive">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>{str tag=reportdate section=module.inactivityreport}</th>
                    <th>{str tag=institution section=module.inactivityreport}</th>
                    <th>{str tag=inactiveresidents section=module.inactivityreport}</th>
                    <th>{str tag=generated section=module.inactivityreport}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {foreach from=$reports item=report}
                <tr>
                    <td>{$report->report_date|strtotime|format_date:'strftimedate'}</td>
                    <td>{$report->institution_displayname}</td>
                    <td>
                        {if $report->resident_count > 0}
                            <span class="text-danger">{$report->resident_count}</span>
                        {else}
                            <span class="text-success">0</span>
                        {/if}
                    </td>
                    <td>{$report->ctime|strtotime|format_date:'strftimedatetime'}</td>
                    <td>
                        {if $report->resident_count > 0}
                        <a href="{$WWWROOT}module/inactivityreport/report.php?download=1&id={$report->id}" class="btn btn-sm btn-secondary">
                            <span class="icon icon-download" role="presentation" aria-hidden="true"></span>
                            {str tag=download section=module.inactivityreport}
                        </a>
                        {/if}
                    </td>
                </tr>
                {/foreach}
            </tbody>
        </table>
    </div>
</div>
{$pagination|safe}
{else}
<div class="alert alert-info">
    {str tag=noreports section=module.inactivityreport}
</div>
{/if}

{include file='footer.tpl'}
