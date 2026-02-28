                    </div><!-- end main-column -->

                </div><!-- mainmiddle -->

            </main>

            {if $SIDEBARS && $SIDEBLOCKS.right}
            <div class="col-xl-3 sidebar">
                    {include file="sidebar.tpl" blocks=$SIDEBLOCKS.right}
            </div>
            {/if}

            {if $SIDEBARS && $SIDEBLOCKS.left}
            <div class="col-xl-3 order-lg-1 sidebar">
                            {include file="sidebar.tpl" blocks=$SIDEBLOCKS.left}
            </div>
            {/if}

        </div><!-- row -->

    </div><!-- container -->

<footer class="{if $editing == true}editcontent {/if}footer">
    <div class="footer-inner container">
        <div id="powered-by" class="float-start mahara-logo">
            <a href="https://eportfolios.in">
                <img src="{theme_image_url filename='powered_by_eportfolios'}?v={$CACHEVERSION}" alt="Powered by ePortfolios" class="mahara-footer-logo">
            </a>
        </div>
        <!-- This site is powered by ePortfolios, an open-source
        ePortfolio & Competency Platform. See https://eportfolios.in
        for more details. -->
        <ul class="nav nav-pills footer-nav float-start">
        {foreach from=$FOOTERMENU item=item name=footermenu}
            <li>
                {if $item.fullurl}
                {$item.fullurl|safe}
                {else}
                <a href="{$item.url}" class="nav-link">{$item.title}</a>
                {/if}
            </li>
        {/foreach}
        </ul>
        <div class="metadata float-end mahara-version" id="version">
            {mahara_version}
        </div>

        <div class="metadata fullwidth site-performace">
            <!-- there is a div id="performance-info" wrapping this -->
            {mahara_performance_info}
        </div>
    </div>
</footer><!-- footer-wrap -->
{if $ADDITIONALHTMLFOOTER}{$ADDITIONALHTMLFOOTER|safe}{/if}
</body>
</html>
