/*
 * Balloon selector control.
 *
 * Data attributes:
 * - data-control="balloon-selector" - enables the plugin
 *
 */
+function ($) { "use strict";

    var BalloonSelector = function (element, options) {

        this.$el = $(element);
        this.$field = $('input', this.$el);

        this.options = options || {};
        this.allowEmpty = 'selectorAllowEmpty' in this.$el.get(0).dataset;

        var self = this;
        $('li', this.$el).click(function(){
            if (self.$el.hasClass('control-disabled')) {
                return;
            }

            if (self.allowEmpty && $(this).hasClass('active')) {
                $(this).removeClass('active');
                self.$field
                    .val('')
                    .trigger('change');
                return;
            }

            $('li', self.$el).removeClass('active');
            $(this).addClass('active');
            self.$field
                .val($(this).data('value'))
                .trigger('change');
        });

        oc.Events.on(this.$el.get(0), 'trigger:empty', function() {
            $('li', self.$el).removeClass('active');
            self.$field.val('').trigger('change');
        });

        oc.Events.on(this.$el.get(0), 'trigger:fill', function(ev) {
            var fillValue = ev.detail.fillValue;
            $('li', self.$el).removeClass('active');
            $('li[data-value="'+fillValue+'"]', self.$el).addClass('active');
            self.$field.val(fillValue).trigger('change');
        });

        oc.Events.on(this.$el.get(0), 'trigger:disable', function(ev) {
            var status = ev.detail.status;
            self.$field.prop('disabled', status);
        });
    }

    BalloonSelector.DEFAULTS = {}

    // BALLOON SELECTOR PLUGIN DEFINITION
    // ===================================

    var old = $.fn.balloonSelector;

    $.fn.balloonSelector = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data  = $this.data('oc.balloon-selector');
            var options = $.extend({}, BalloonSelector.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.balloon-selector', (data = new BalloonSelector(this, options)));
        });
    }

    $.fn.balloonSelector.Constructor = BalloonSelector;

    // BALLOON SELECTOR NO CONFLICT
    // ===================================

    $.fn.balloonSelector.noConflict = function () {
        $.fn.balloonSelector = old;
        return this;
    }

    // BALLOON SELECTOR DATA-API
    // ===================================

    $(document).on('render', function(){
        $('div[data-control=balloon-selector]').balloonSelector();
    });

}(window.jQuery);
