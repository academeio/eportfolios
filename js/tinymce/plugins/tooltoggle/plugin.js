/**
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Catalyst IT Limited <mahara@catalyst.net.nz>
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  For copyright information on Mahara, please see the README file distributed with this software.
 * @copyright  Academe Research, Inc
 *
 */

/*global tinymce:true */

tinymce.PluginManager.add('tooltoggle', function(editor) {
    var tooltoggleState = false;
    var firstrow;

    editor.ui.registry.addToggleButton('toolbar_toggle', {
        icon: 'chevron-up',
        tooltip: get_string('toggletoolbarson'),
        onAction: function(api) {
            firstrow.siblings().toggleClass('d-none');
            firstrow.find('button').first().toggleClass('flipicon');
            tooltoggleState = !tooltoggleState;
            api.setActive(tooltoggleState);
        },
        onSetup: function(api) {
            firstrow = jQuery(editor.editorContainer).find('.tox-toolbar-overlord').children().first();
            firstrow.siblings().addClass('d-none');
            firstrow.find('button').first().addClass('flipicon');
        }
    });
});
