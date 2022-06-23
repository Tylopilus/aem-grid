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

    var overlayClass = 'cq-Overlay',
        dropTargetClass = 'cq-droptarget',
        subDropTargetClass = 'cq-subdroptarget cq-Overlay-subdroptarget';

    /**
     * Overlay to be used in responsive mode
     *
     * @class
     * @alias Granite.author.responsive.Overlay
     * @extends Granite.author.ui.Overlay
     */
    ns.responsive.Overlay = function (editable, container) {
        ns.responsive.Overlay.super_.constructor.call(this, editable, container);
    };

    ns.util.inherits(ns.responsive.Overlay, ns.ui.Overlay);

    ns.responsive.Overlay.prototype.render = function (editable, container) {
        var dom = ns.responsive.Overlay.super_.render.apply(this, arguments);

        var parent = ns.editables.getParent(editable);

        if (parent && ns.responsive.isResponsiveGrid(parent)) {

            // the responsive grid drop zones are not resizable
            if (editable.type !== 'wcm/foundation/components/responsivegrid/new') {
                var handleLeft = $('<div/>', {
                    'class': 'editor-ResponsiveGrid-overlay-resizeHandle editor-ResponsiveGrid-overlay-resizeHandle--left',
                    'data-edge': 'left'
                }), handleRight = $('<div/>', {
                    'class': 'editor-ResponsiveGrid-overlay-resizeHandle editor-ResponsiveGrid-overlay-resizeHandle--right',
                    'data-edge': 'right'
                });
            }

            dom.append(handleLeft).append(handleRight);
            dom.addClass('is-resizable');
        } else {
            if (!ns.responsive.isResponsiveGrid(editable)) {
                dom.addClass('is-disabled');
            }
        }

        return dom;
    };

    ns.responsive.Overlay.prototype.position = function (editable, parent) {
        ns.responsive.Overlay.super_.position.apply(this, arguments);
    };

    ns.responsive.Overlay.prototype.remove = function () {
        ns.responsive.Overlay.super_.remove.apply(this, arguments);
    };

}(jQuery, Granite.author, jQuery(document), this));
