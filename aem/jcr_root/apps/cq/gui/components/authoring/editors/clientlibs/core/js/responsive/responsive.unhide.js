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

    var actions = {
        actions: {
            'AMOUNT': {
                icon: 'viewOff',
                text: Granite.I18n.get('Show hidden components'),
                handler: function (editable, param, target) {
                    ns.responsive.interaction.stopUnhideMode();
                },
                render: function (dom, editable) {
                    var countElem = $('<span/>', {
                        'text': ns.responsive.getHiddenChildren(editable).length,
                        'class': 'cq-EditableToolbar-text cq-EditableToolbar-text--right'
                    });

                    dom.append(countElem);

                    dom.addClass('cq-EditableToolbar-button')
                        .css({
                                 'background-color': '#326ec8',
                                 'border-radius': '0'
                             });

                    return dom;
                }
            },
            'UNHIDE': {
                text: Granite.I18n.get('Restore all'),
                handler: function (editable, param, target) {
                    ns.responsive.persistence.showHiddenChildren(editable)
                        .then(function () {
                            ns.responsive.interaction.stopUnhideMode();
                        });
                }
            }
        }
    };

    /**
     * Unhide for the ui elements to show hidden components again
     * @ignore
     */
    ns.responsive.unhide = {

        currentEditable: null,
        currentToolbar: null,

        /**
         * opens the unhiding UI
         * @param editable
         */
        open: function (editable) {
            var self = this;
            this.currentEditable = editable;
            var hiddenComponent = ns.responsive.getHiddenChildren(this.currentEditable);

            // show hidden temporary
            ns.ContentFrame.executeCommand(this.currentEditable.path, 'toggleClass', {
                className: 'aem-GridShowHidden',
                condition: true
            });

            ns.EditorFrame.editableToolbar.destroy();
            this.currentToolbar = new ns.responsive.unhide.Toolbar(actions);

            hiddenComponent.forEach(function (child) {
                child.overlay.dom.addClass('editor-ResponsiveGrid-overlayHiddenComponent');

                var button = $('<button is="coral-button" variant="minimal" icon="viewedMarkAs" iconsize="S" data-path="' + child.path + '"/>');

                button.addClass("editor-ResponsiveGrid-unHideButton").appendTo(child.overlay.dom).on("click", self.onShowComponent);
            });

            ns.overlayManager.reposition();

            setTimeout(function () {
                self.currentToolbar.render(self.currentEditable).position(self.currentEditable);
                self.currentEditable.overlay.setSelected(true);
            }, 50);

            channel.on('cq-overlay-outside-click.cq-responsive-layer-unhide', this.onOutsideOverlayClick.bind(this))
                .on('cq-overlay-click.cq-responsive-layer-unhide', this.onOutsideOverlayClick.bind(this));
        },

        /**
         * closes the unhiding UI
         */
        close: function () {
            channel.off('cq-overlay-outside-click.cq-responsive-layer-unhide')
                .off('cq-overlay-click.cq-responsive-layer-unhide');

            if (this.currentEditable) {
                ns.ContentFrame.executeCommand(this.currentEditable.path, 'toggleClass', {
                    className: 'aem-GridShowHidden',
                    condition: false
                });

                ns.edit.EditableActions.REFRESH.execute(this.currentEditable);
            }

            if (this.currentToolbar) {
                this.currentToolbar.close();
                this.currentToolbar.destroy();
                ns.EditorFrame.editableToolbar = new ns.responsive.Toolbar(ns.responsive.CONFIG);
            }

            this.currentToolbar = null;
            this.currentEditable = null;

        },

        /**
         * handles click of showing a single component
         * @param event
         */
        onShowComponent: function (event) {
            var path = $(event.currentTarget).data('path'),
                editable = ns.editables.find(path)[0];

            if (editable) {
                ns.responsive.persistence.setBreakpointConfig(editable, ns.responsive.getCurrentBreakpoint(), {
                    behavior: 'none'
                })
                    .then(function () {
                        ns.responsive.interaction.stopUnhideMode();
                    });
            }
        },

        onOutsideOverlayClick: function (event) {
            var elem = event.originalEvent.currentTarget;

            // test if the actual target is not inside the current selection
            while (elem.parentNode && elem.parentNode !== document) {
                if (elem === this.currentEditable.overlay.dom[0]) {
                    return; // found
                }

                elem = elem.parentNode;
            }

            ns.responsive.interaction.stopUnhideMode();
        }

    };

    /**
     * Custom toolbar for the unhiding UI
     *
     * @class
     * @alias Granite.author.responsive.unhide.Toolbar
     * @ignore
     */
    ns.responsive.unhide.Toolbar = function () {
        ns.responsive.unhide.Toolbar.super_.constructor.apply(this, arguments);
    };

    ns.util.inherits(ns.responsive.unhide.Toolbar, ns.ui.Toolbar);

    ns.responsive.unhide.Toolbar.prototype.init = function () {
        // set the default actions
        return ns.responsive.Toolbar.super_.init.call(this, actions);
    };


}(jQuery, Granite.author, jQuery(document), this));
