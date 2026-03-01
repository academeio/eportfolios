/**
 * plugin.js
 *
 * Copyright 2013, Daniel Thies
 * Released under LGPL License.
 *
 * Updated for TinyMCE 5, Catalyst IT Limited
 * Updated for TinyMCE 7, Academe Research, Inc
 * LGPL 2019
 */

tinymce.PluginManager.add('mathslate', function(editor, url) {

	// Register the mathslate icon (previously bundled in icons/default/icons.js)
	editor.ui.registry.addIcon('mathslate', '<svg width="25" height="25" viewBox="0 -200 900 900"><path fill-rule="nonzero" d="M571.31 251.31l-22.62-22.62c-6.25-6.25-16.38-6.25-22.63 0L480 274.75l-46.06-46.06c-6.25-6.25-16.38-6.25-22.63 0l-22.62 22.62c-6.25 6.25-6.25 16.38 0 22.63L434.75 320l-46.06 46.06c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 6.25 16.38 6.25 22.63 0L480 365.25l46.06 46.06c6.25 6.25 16.38 6.25 22.63 0l22.62-22.62c6.25-6.25 6.25-16.38 0-22.63L525.25 320l46.06-46.06c6.25-6.25 6.25-16.38 0-22.63zM552 0H307.65c-14.54 0-27.26 9.8-30.95 23.87l-84.79 322.8-58.41-106.1A32.008 32.008 0 0 0 105.47 224H24c-13.25 0-24 10.74-24 24v48c0 13.25 10.75 24 24 24h43.62l88.88 163.73C168.99 503.5 186.3 512 204.94 512c17.27 0 44.44-9 54.28-41.48L357.03 96H552c13.25 0 24-10.75 24-24V24c0-13.26-10.75-24-24-24z"></path></svg>');

	function showDialog() {

		var slateurl = location.protocol == 'https:' ? '/mathslate-s.html' : '/mathslate.html';

		win = editor.windowManager.openUrl({
			title: "Math Editor",
			url: url + slateurl,
			width: 520,
			height: 550,
			buttons: [
				{type: 'custom',
				text: "Insert Inline",
				name: "inline",
				primary: true,
				},
				{type: 'custom',
				text: "Insert Display",
				name: "display",
				primary: false
				},
				{type: 'cancel',
				text: "Cancel",
				name: "cancel",
				primary: false
				}
			],
			onAction: (win, details) => {
				if (details.name === 'inline') {
                    var iframe = document.querySelector('.tox-dialog iframe');
                    var output = iframe ? iframe.contentDocument.querySelector('.mathslate-preview').textContent : '';
					editor.selection.setContent('\\\(' + output + '\\\)');
					win.close();
				}
				if (details.name === 'display') {
                    var iframe = document.querySelector('.tox-dialog iframe');
                    var output = iframe ? iframe.contentDocument.querySelector('.mathslate-preview').textContent : '';
					editor.selection.setContent('\\\[' + output + '\\\]');
					win.close();
				}
				if (details.name === 'cancel') {
					win.close();
				}
			},
		});
	}

	editor.ui.registry.addButton('mathslate', {
		tooltip: 'Insert Math',
		onAction: showDialog,
		icon: 'mathslate'
	});

	editor.ui.registry.addMenuItem('mathslate', {
		text: 'Insert Math',
		onAction: showDialog,
		context: 'insert'
	});
});
