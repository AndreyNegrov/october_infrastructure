/*
 * MediaFinder plugin
 *
 * Data attributes:
 * - data-control="mediafinder" - enables the plugin on an element
 * - data-option="value" - an option with a value
 *
 * JavaScript API:
 * $('a#someElement').mediaFinder({ option: 'value' })
 *
 * Dependencies:
 * - Some other plugin (filename.js)
 */

+function ($) { "use strict";
    var Base = $.oc.foundation.base,
        BaseProto = Base.prototype,
        instanceCounter = 0;

    var MediaFinder = function (element, options) {
        instanceCounter++;
        this.$el = $(element);
        this.options = options || {};
        this.instanceNumber = instanceCounter;

        $.oc.foundation.controlUtils.markDisposable(element);

        Base.call(this);
        this.init();
    }

    MediaFinder.prototype = Object.create(BaseProto);
    MediaFinder.prototype.constructor = MediaFinder;

    MediaFinder.prototype.init = function() {
        if (this.options.isMulti === null) {
            this.options.isMulti = this.$el.hasClass('is-multi');
        }

        if (this.options.isPreview === null) {
            this.options.isPreview = this.$el.hasClass('is-preview');
        }

        if (this.options.isImage === null) {
            this.options.isImage = this.$el.hasClass('is-image');
        }

        if (this.options.isFolder === null) {
            this.options.isFolder = this.$el.hasClass('is-folder');
        }

        if (this.options.isSortable === null) {
            this.options.isSortable = this.$el.hasClass('is-sortable');
        }

        this.previewTemplate = $(this.options.template).html();
        this.$filesContainer = $('.mediafinder-files-container:first', this.$el);
        this.$dataLocker = $('[data-data-locker]', this.$el);
        this.loadExistingFiles();

        this.$el.one('dispose-control', this.proxy(this.dispose));

        // Stop here for preview mode
        if (this.options.isPreview) {
            return;
        }

        this.$el.on('click', '.toolbar-find-button', this.proxy(this.onClickFindButton));
        this.$el.on('click', '.find-remove-button', this.proxy(this.onClickRemoveButton));
        this.$el.on('click', '.toolbar-delete-selected', this.proxy(this.onDeleteSelectedClick));

        this.$el.on('click', 'input[data-record-selector]', this.proxy(this.onClickCheckbox));
        this.$el.on('change', 'input[data-record-selector]', this.proxy(this.onSelectionChanged));

        if (this.options.isSortable) {
            this.bindSortable();
        }

        // External toolbar
        setTimeout(() => {
            this.initToolbarExtensionPoint();
            this.mountExternalToolbarEventBusEvents();
            this.extendExternalToolbar();
        }, 0);
    }

    MediaFinder.prototype.dispose = function() {
        this.$el.off('click', '.toolbar-find-button', this.proxy(this.onClickFindButton));
        this.$el.off('click', '.find-remove-button', this.proxy(this.onClickRemoveButton));
        this.$el.off('click', '.toolbar-delete-selected', this.proxy(this.onDeleteSelectedClick));

        this.$el.off('click', 'input[data-record-selector]', this.proxy(this.onClickCheckbox));
        this.$el.off('change', 'input[data-record-selector]', this.proxy(this.onSelectionChanged));

        this.$el.off('dispose-control', this.proxy(this.dispose));
        this.$el.removeData('oc.mediaFinder');
        this.unmountExternalToolbarEventBusEvents();

        this.sortable = null;
        this.$dataLocker = null;
        this.$filesContainer = null;
        this.$el = null;
        this.toolbarExtensionPoint = null;
        this.externalToolbarEventBusObj = null;

        // In some cases options could contain callbacks,
        // so it's better to clean them up too.
        this.options = null;

        BaseProto.dispose.call(this);
    }

    //
    // External toolbar
    //

    MediaFinder.prototype.initToolbarExtensionPoint = function () {
        if (!this.options.externalToolbarAppState) {
            return;
        }

        const point = $.oc.vueUtils.getToolbarExtensionPoint(
            this.options.externalToolbarAppState,
            this.$el.get(0)
        );

        if (point) {
            this.toolbarExtensionPoint = point.state;
            this.externalToolbarEventBusObj = point.bus;
        }
    }

    MediaFinder.prototype.mountExternalToolbarEventBusEvents = function() {
        if (!this.externalToolbarEventBusObj) {
            return;
        }

        this.externalToolbarEventBusObj.$on('toolbarcmd', this.proxy(this.onToolbarExternalCommand));
        this.externalToolbarEventBusObj.$on('extendapptoolbar', this.proxy(this.extendExternalToolbar));
    }

    MediaFinder.prototype.unmountExternalToolbarEventBusEvents = function() {
        if (!this.externalToolbarEventBusObj) {
            return;
        }

        this.externalToolbarEventBusObj.$off('toolbarcmd', this.proxy(this.onToolbarExternalCommand));
        this.externalToolbarEventBusObj.$off('extendapptoolbar', this.proxy(this.extendExternalToolbar));
    }

    MediaFinder.prototype.onToolbarExternalCommand = function (ev) {
        var cmdPrefix = 'mediafinder-toolbar-' + this.instanceNumber + '-';

        if (ev.command.substring(0, cmdPrefix.length) != cmdPrefix) {
            return;
        }

        var buttonClassName = ev.command.substring(cmdPrefix.length),
            $toolbar = this.$el.find('.mediafinder-control-toolbar'),
            $button = $toolbar.find('[class="'+buttonClassName+'"]');

        $button.get(0).click(ev.ev);
    }

    MediaFinder.prototype.extendExternalToolbar = function () {
        if (!this.$el.is(":visible") || !this.toolbarExtensionPoint) {
            return;
        }

        this.toolbarExtensionPoint.splice(0, this.toolbarExtensionPoint.length);

        this.toolbarExtensionPoint.push({
            type: 'separator'
        });

        var that = this,
            $buttons = this.$el.find('.mediafinder-control-toolbar .backend-toolbar-button');

        $buttons.each(function () {
            var $button = $(this),
                $icon = $button.find('i[class^=icon]');

            that.toolbarExtensionPoint.push(
                {
                    type: 'button',
                    icon: $icon.attr('class'),
                    label: $button.find('.button-label').text(),
                    command: 'mediafinder-toolbar-' + that.instanceNumber + '-' + $button.attr('class'),
                    disabled: $button.attr('disabled') !== undefined
                }
            );
        });
    }

    //
    // Selection
    //

    MediaFinder.prototype.onDeleteSelectedClick = function (ev) {
        var $currentObjects = $('.item-object:has(input[data-record-selector]:checked)', this.$filesContainer);

        $currentObjects.remove();

        this.setValue();
        this.evalIsPopulated();
        this.evalIsMaxReached();
        this.updateDeleteSelectedState();
        this.extendExternalToolbar();

        ev.stopPropagation();
        ev.preventDefault();
    }

    MediaFinder.prototype.onSelectionChanged = function (ev) {
        var $object = $(ev.target).closest('.item-object');

        $object.toggleClass('selected', ev.target.checked);

        this.updateDeleteSelectedState();
        this.extendExternalToolbar();
    }

    MediaFinder.prototype.onClickCheckbox = function(ev) {
        oc.checkboxRangeRegisterClick(ev, '.item-object', 'input[data-record-selector]');
    }

    MediaFinder.prototype.updateDeleteSelectedState = function () {
        var enabled = false,
            selectedCount = this.$el.find('input[data-record-selector]:checked').length;

        if (this.$el.hasClass('is-populated')) {
            enabled = selectedCount > 0;
        }

        var $button = this.$el.find('.toolbar-delete-selected'),
            $counter = $button.find('.button-label > span');

        $button.prop('disabled', !enabled);

        if (enabled) {
            $counter.text('(' + selectedCount + ')');
        }
        else {
            $counter.text('');
        }
    }

    //
    // Loading
    //

    MediaFinder.prototype.loadExistingFiles = function(value) {
        var self = this;

        $('.server-file', this.$filesContainer).each(function () {
            $(this).replaceWith(self.makeFilePreview($(this).data()));
        });
    }

    MediaFinder.prototype.makeFilePreview = function(item) {
        var $preview = $(this.previewTemplate);

        $preview.attr('data-path', item.path);
        $preview.attr('data-folder', this.makeFolderPath(item));
        $('[data-public-url]', $preview).attr('src', item.publicUrl);
        $('[data-thumb-url]', $preview).attr('src', item.thumbUrl);
        $('[data-title]', $preview).text(item.title).attr('title', item.path);

        // Image is the default but can be swapped out for video and audio
        if (['video', 'audio'].includes(item.documentType)) {
            $('[data-document-type]', $preview).each(function() {
                var $el = $(this).get(0);
                if ($el.dataset.documentType !== item.documentType) {
                    $el.remove();
                }
            });
        }
        else {
            $('[data-document-type]', $preview).remove();
        }

        return $preview;
    }

    MediaFinder.prototype.makeFolderPath = function(item) {
        var path = item.path;
        if (path.endsWith(item.title)) {
            path = path.slice(0, item.title.length * -1);
        }

        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path;
    }

    MediaFinder.prototype.getValue = function() {
        var result = [];

        $('> .item-object', this.$filesContainer).each(function() {
            result.push($(this).data('path'));
        });

        return result.length ? result : '';
    }

    MediaFinder.prototype.setValue = function() {
        var self = this,
            currentValue = this.getValue();

        this.$dataLocker.empty();

        // Spin over items and set the input value
        if (currentValue) {
            $.each(this.getValue(), function(k, v) {
                self.addValueToLocker(v);
            });
        }
        // Empty value
        else {
            this.addValueToLocker('');
        }

        // Set value and trigger change event, so that wrapping implementations
        // like mlmediafinder can listen for changes.
        this.$dataLocker.trigger('change');
    }

    MediaFinder.prototype.addValueToLocker = function(val) {
        var inputName = val && this.options.isMulti
            ? this.options.inputName + '[]'
            : this.options.inputName;

        $('<input type="hidden" />')
            .attr('name', inputName)
            .val(val)
            .appendTo(this.$dataLocker);
    }

    MediaFinder.prototype.addItems = function(items) {
        if (!this.options.isMulti) {
            this.$filesContainer.empty();
        }

        // var path, publicUrl;
        for (var i=0, len=items.length; i<len; i++) {
            this.$filesContainer.append(this.makeFilePreview(items[i]));
        }

        this.extendExternalToolbar();
    }

    MediaFinder.prototype.onClickRemoveButton = function(ev) {
        this.$filesContainer.empty();
        this.setValue();
        this.evalIsPopulated();
        this.evalIsMaxReached();
        this.extendExternalToolbar();

        ev.preventDefault();
        ev.stopPropagation();
    }

    MediaFinder.prototype.onClickFindButton = function() {
        var self = this;

        new $.oc.mediaManager.popup({
            alias: 'ocmediamanager',
            mediaFolder: this.getCurrentFolderContext(),
            cropAndInsertButton: true,
            onInsert: function(items) {
                if (!items.length) {
                    alert('Please select image(s) to insert.');
                    return;
                }

                // Single mode
                if (!self.options.isMulti && items.length > 1) {
                    alert('Please select a single item.');
                    return;
                }

                if (!self.maxSelectionAllowed(items.length)) {
                    alert('Too many items selected.');
                    return;
                }

                var isHalted = false;
                items.forEach(function(item) {
                    if (!isHalted && self.options.isFolder && item.itemType !== 'folder') {
                        alert('Please select a folder only.');
                        isHalted = true;
                    }

                    if (!isHalted && !self.options.isFolder && item.itemType === 'folder') {
                        alert('Cannot select a folder. Please select an item instead.');
                        isHalted = true;
                    }
                });

                if (isHalted) {
                    return;
                }

                self.addItems(items);
                self.setValue();
                self.evalIsPopulated();
                self.evalIsMaxReached();

                this.hide();
            }
        });
    }

    MediaFinder.prototype.evalIsPopulated = function() {
        var isPopulated = !!$('>.item-object', this.$filesContainer).length;
        this.$el.toggleClass('is-populated', isPopulated);
        this.extendExternalToolbar();
    }

    MediaFinder.prototype.evalIsMaxReached = function() {
        var isMaxReached = false;

        if (this.options.maxItems !== null) {
            isMaxReached = $('>.item-object', this.$filesContainer).length >= this.options.maxItems;
        }

        this.$el.toggleClass('is-max-reached', isMaxReached);
        this.extendExternalToolbar();
    }

    MediaFinder.prototype.maxSelectionAllowed = function(count) {
        if (this.options.maxItems !== null) {
            var totalCount = $('>.item-object', this.$filesContainer).length + count;

            if (totalCount > this.options.maxItems) {
                return false;
            }
        }

        return true;
    }

    MediaFinder.prototype.getCurrentFolderContext = function() {
        // Cannot determine context from multiple items
        if (!this.options.isMulti) {
            return $('>.item-object:first', this.$filesContainer).data('folder');
        }
    }

    //
    // Sorting
    //

    MediaFinder.prototype.bindSortable = function() {
        this.sortable = Sortable.create(this.$filesContainer.get(0), {
            // forceFallback: true,
            animation: 150,
            draggable: 'div.item-object',
            handle: '.drag-handle',
            onEnd: this.proxy(this.onSortAttachments),

            // Auto scroll plugin
            forceAutoScrollFallback: true,
            scrollSensitivity: 60,
            scrollSpeed: 20
        });
    }

    MediaFinder.prototype.onSortAttachments = function() {
        this.setValue();
    }

    MediaFinder.DEFAULTS = {
        isMulti: null,
        isPreview: null,
        isImage: null,
        isSortable: null,
        isFolder: null,
        maxItems: null,
        template: null,
        inputName: null
    }

    // PLUGIN DEFINITION
    // ============================

    var old = $.fn.mediaFinder;

    $.fn.mediaFinder = function(option) {
        var args = arguments;

        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('oc.mediaFinder');
            var options = $.extend({}, MediaFinder.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.mediaFinder', (data = new MediaFinder(this, options)));
            if (typeof option == 'string') data[option].apply(data, args);
        });
    }

    $.fn.mediaFinder.Constructor = MediaFinder

    $.fn.mediaFinder.noConflict = function() {
        $.fn.mediaFinder = old;
        return this;
    }

    $(document).render(function() {
        $('[data-control="mediafinder"]').mediaFinder();
    });

}(window.jQuery);
