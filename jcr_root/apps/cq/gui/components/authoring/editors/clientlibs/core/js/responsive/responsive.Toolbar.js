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

    /**
     * Select the editable and open the toolbar
     *
     * @param {Granite.author.Editable} editable
     */
    function selectEditable (editable) {
        ns.EditorFrame.editableToolbar.close();
        ns.responsive.interaction.removeSelection();
        ns.responsive.interaction.removeGridLines();
        ns.selection.select(editable);
        ns.responsive.interaction.setSelectedGrid(ns.editables.getParent(editable));
        // Close the current toolbar and dissociate it from
        // the obsolete reference of the editable
        ns.EditorFrame.editableToolbar.open(editable);
    }

    /**
     *
     * actions for the responsive mode,
     * it will add a subset of the default edit mode
     */
    var actions = {
        'UNHIDE': new ns.ui.ToolbarAction({
            icon: 'viewOff',
            text: Granite.I18n.get('Show hidden components'),
            execute: function (editable, param, target) {
                ns.responsive.interaction.startUnhideMode(editable);
            },
            condition: function (editable) {
                if (ns.responsive.isResponsiveGrid(editable)) {
                    if (!ns.responsive.getHiddenChildren(editable).length) {
                        return false;
                    }

                    return true;
                }

                return false;
            },
            render: function (dom, editable) {
                var countElem = $('<span/>', {
                    'text': ns.responsive.getHiddenChildren(editable).length,
                    'class': 'cq-EditableToolbar-text cq-EditableToolbar-text--right'
                });

                dom.append(countElem);

                return dom;
            }
        }),
        'RESET': new ns.ui.ToolbarAction({
            icon: 'revert',
            text: Granite.I18n.get('Revert breakpoint layout'),
            execute: function (editable, param, target) {
                ns.responsive.persistence.resetBreakpointConfig(editable)
                    .then(function () {
                        ns.responsive.EditableActions.REFRESH.execute(editable)
                            .then(selectEditable);
                    });
            },
            condition: function (editable) {
                if (ns.responsive.isResponsiveGrid(editable)) {
                    return true;
                }

                return false;
            }
        }),
        'NEWLINE': new ns.ui.ToolbarAction({
            icon: 'layersBackward',
            text: Granite.I18n.get('Float to new line'),
            execute: function (editable, param, target) {
                var behavior = ns.responsive.getCurrentResponsiveConfig(editable).behavior || ns.responsive.getResponsiveConfig(editable, 'default').behavior;
                var newBehavior = behavior !== 'newline' ? 'newline' : 'none';

                ns.responsive.persistence.setBreakpointConfig(editable, ns.responsive.getCurrentBreakpoint(), {
                    behavior: newBehavior
                })
                    .then(function () {
                        ns.responsive.EditableActions.REFRESH.execute(editable)
                            .then(selectEditable);
                    });
            },
            condition: ns.responsive.isInResponsiveGrid.bind(ns.responsive),
            render: function (dom, editable) {
                var behavior = ns.responsive.getCurrentResponsiveConfig(editable).behavior || ns.responsive.getResponsiveConfig(editable, 'default').behavior;

                if (behavior === 'newline') {
                    dom.addClass('is-active');
                }

                return dom;
            }

        }),
        'HIDE': new ns.ui.ToolbarAction({
            icon: 'viewOff',
            text: Granite.I18n.get('Hide component'),
            execute: function (editable, param, target) {
                ns.responsive.persistence.setBreakpointConfig(editable, ns.responsive.getCurrentBreakpoint(), {
                    behavior: 'hide'
                })
                    .then(function () {
                        ns.responsive.EditableActions.REFRESH.execute(editable);
                    });
            },
            condition: ns.responsive.isInResponsiveGrid.bind(ns.responsive)
        }),
        'CLOSE': new ns.ui.ToolbarAction({
            icon: 'close',
            text: Granite.I18n.get('Close'),
            index: 101,
            execute: function (editable, param, target) {
                channel.trigger($.Event("cq-interaction-focus.toolbar-reset", { editable: editable }));
            },
            condition: function (editable) {
                return ns.responsive.CONFIG.name !== ns.layerManager.getCurrentLayerName();
            },
            render: function (dom) {
                return dom.addClass("cq-EditableToolbar-button--modeSwitcher");
            }
        })
    };

    /**
     * Toolbar to be used in the responsive layer
     *
     * @class
     * @alias Granite.author.responsive.Toolbar
     */
    ns.responsive.Toolbar = function () {
        ns.responsive.Toolbar.super_.constructor.apply(this, arguments);

        var actionsList = {};

        // add actions from edit toolbar
        ['PARENT'].forEach(function(e) {
            actionsList[e] = $.extend(true, {}, ns.edit.ToolbarActions[e]);
        });

        for (var ac in actions) {
            actionsList[ac] = actions[ac];
        }

        // set the default actions
        return ns.responsive.Toolbar.super_.init.call(this, {
            actions: actionsList
        });
    };

    ns.util.inherits(ns.responsive.Toolbar, ns.ui.Toolbar);

    ns.responsive.Toolbar.prototype.destroy = function () {
        ns.responsive.Toolbar.super_.destroy.apply(this, arguments);
    };


    ns.responsive.Toolbar.prototype.appendButton = function (editable, name, action) {
        ns.responsive.Toolbar.super_.appendButton.apply(this, arguments);
    };

    ns.responsive.Toolbar.prototype.render = function (editable) {
        return ns.responsive.Toolbar.super_.render.apply(this, arguments);
    };

    ns.responsive.Toolbar.prototype.handleEvent = function (event) {
        ns.responsive.Toolbar.super_.handleEvent.apply(this, arguments);
    };

}(jQuery, Granite.author, jQuery(document), this));
