{include file="header.tpl"}
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <h2 class="card-header">{str tag=managecontenttemplates section=contenttemplates}</h2>
            <div class="card-body">
                <p class="lead">{str tag=managecontenttemplatesdescription section=contenttemplates}</p>
                <div class="mb-3">
                    <button type="button" class="btn btn-primary" id="addtemplate-btn">
                        <span class="icon icon-plus left" role="presentation" aria-hidden="true"></span>
                        {str tag=addtemplate section=contenttemplates}
                    </button>
                </div>
                <div id="templatelist"></div>
            </div>
        </div>
    </div>
</div>
{include file="footer.tpl"}
