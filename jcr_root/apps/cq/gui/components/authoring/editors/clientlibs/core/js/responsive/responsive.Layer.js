/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2015 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
;(function ($, ns, channel, window, undefined) {
    "use strict";

    /**
     * Default configuration
     */
    ns.responsive.CONFIG = {
        name:                   "Layouting",
        icon:                   "deviceTablet",
        title:                  Granite.I18n.get("Layout", "title of authoring layer"),
        overlayConstructor:     ns.responsive.Overlay,
        toolbarConstructor:     ns.responsive.Toolbar,
        interactions: {
            onOverlayHover:         ns.responsive.interaction.onOverlayHover.bind(ns.responsive.interaction),
            onOverlayClick:         ns.responsive.interaction.onOverlayClick.bind(ns.responsive.interaction),
            onOutsideOverlayClick:  ns.responsive.interaction.onOutsideOverlayClick.bind(ns.responsive.interaction)
        },
        sidePanel: {
            setUp: function() {
                // Close the sidepanel, and set it empty
                ns.ui.SidePanel.close(true);
                ns.ui.SidePanel.showEmptyContent();
            }
        }
    };

    /**
     * @class Granite.author.responsive.Layer
     * @extends Granite.author.Layer
     * @classdesc The Responsive Layer (or Layouting Layer) allows to position the page content within a responsive grid.
     */
    ns.responsive.Layer = ns.util.extendClass(ns.Layer, {

        /**
         * @memberOf Granite.author.responsive.Layer.prototype
         */
        config: ns.responsive.CONFIG,

        /**
         * @memberOf Granite.author.responsive.Layer.prototype
         */
        isAvailable: function () {
            return ns.pageInfo && ns.pageInfo.responsive && ns.pageInfo.responsive.breakpoints;
        },

        /**
         * @memberOf Granite.author.responsive.Layer.prototype
         */
        setUp: function () {
            ns.ui.dropController.disable();

            this._interactHandler = new ns.ui.Interaction({
                dragOrigin:     '.cq-Overlay--component',
                allowFrom:      '.editor-ResponsiveGrid-overlay-resizeHandle',
                start:          ns.responsive.interaction.onResizeStart.bind(ns.responsive.interaction),
                move:           ns.responsive.interaction.onResizeMove.bind(ns.responsive.interaction),
                end:            ns.responsive.interaction.onResizeEnd.bind(ns.responsive.interaction)
            });

            // Add container for the resize background grid
            $(document).find('#OverlayWrapper').append($('<div/>', {
                'class': 'js-editor-ResponsiveGrid-resizeGrid editor-ResponsiveGrid-resizeGrid'
            }));

            ns.ui.emulator.toggle(true);
        },
        /**
         * @memberOf Granite.author.responsive.Layer.prototype
         */
        tearDown: function () {
            ns.ui.dropController.enable();

            // Remove background grid container
            $('.js-editor-ResponsiveGrid-resizeGrid').remove();

            this._interactHandler.destroy();
        }
    });

}(jQuery, Granite.author, jQuery(document), this));
