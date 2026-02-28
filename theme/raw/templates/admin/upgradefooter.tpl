                    </div>
                </div>
    </div>
</div>
<footer class="footer upgrade-footer">
    <div id="footer-wrap" class="footer-inner container clearfix">
        <div id="powered-by" class="mahara-logo">
            <a href="https://eportfolios.in">
                <img src="{theme_image_url filename='powered_by_eportfolios'}?v={$CACHEVERSION}" border="0" alt="Powered by ePortfolios" class="mahara-footer-logo">
            </a>
        </div>
        <div id="release" class="release-info">
            <a href="https://eportfolios.in">ePortfolios</a>
            {if $releaseargs}
                {str section=admin tag=release args=$releaseargs}
            {/if}, {str tag='copyright' section='admin'}
        </div>
    </div>
</footer>
</body>
</html>
