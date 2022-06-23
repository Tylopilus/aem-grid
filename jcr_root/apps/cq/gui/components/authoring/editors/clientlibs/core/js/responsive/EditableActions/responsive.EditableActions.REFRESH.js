/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
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
;(function ($, ns, channel, window) {
    "use strict";

    /**
     * Returns a DOM tree which is a composition of the actual DOM of the template currently displayed, the Structure and potentially the Initial aspects
     *
     * @param {Granite.author.Editable} columnEditable      - Editable representing the column
     * @param {string} columnDomStr                         - the html of the column as a String
     * @returns {*}
     */
    function mergeResponsiveDOM (columnEditable, columnDomStr) {
        if (!columnEditable || !columnDomStr) {
            return;
        }

        var columnDom;

        if (columnDomStr) {
            columnDom = ns.util.htmlToNode(columnDomStr);
        }

        if (!columnDom) {
            return;
        }

        var columnComponent = ns.components.find({resourceType: columnEditable.type});

        // Override the column element from the structure DOM with the element from the initial DOM
        var initialColumnConfig = columnDom.querySelector('cq[data-path="' + columnEditable.path + '"]');
        columnEditable.updateConfig(ns.configParser(initialColumnConfig.dataset.config));

        return ns.editableHelper.updateDom(columnComponent[0], columnDom, columnEditable);
    }

    /**
     * Updates the DOM of the layout mode of the editor
     *
     * When we resize a portion of template DOM in layout mode, we request the specific resource HTML from the server for one or the other content tree - Structure and Page.
     *
     * Here we recompose the DOM tree with what already exists and what we fetched from the server.
     *
     * <i>Frontend re-composition of the DOM to avoid refreshing the whole page all the time</i>
     *
     * @param {Granite.author.Editable} columnEditable      - Editable representing the column
     * @param {string} [newDomStr]                          - the html of the column as a String
     * @returns {*}
     */
    function updateResponsiveDOM (columnEditable, newDomStr) {
        var columnDomStr = mergeResponsiveDOM(columnEditable, newDomStr);

        if (!columnDomStr) {
            return $.Deferred().reject().promise();
        }

        // Replace DOM (first delete the old one)
        return ns.ContentFrame.executeCommand(columnEditable.path, 'replace', columnDomStr)
            .then(function () {
                var newDom = ns.ContentFrame.getEditableNode(columnEditable.path);
                // Find + create editables (and config)
                var newEditables = ns.ContentFrame.getEditables(newDom);

                // Remove "editable" from the "newEditables"
                var newChildren = newEditables.filter(function (newEditable) {
                    return newEditable.path !== columnEditable.path;
                });

                // Update DOM property, and recreate the overlay (will automatically destroy children overlays)
                columnEditable.dom = newDom;

                // Update config property
                columnEditable.updateConfig(ns.configParser(ns.ContentFrame.getEditableConfigNode(columnEditable.path).data('config')));

                // Unstore current children,
                // and store new children
                ns.editables.remove(ns.editables.getChildren(columnEditable));
                // neighbor means parent here
                ns.editables.add(newChildren, {
                    editableNeighbor: columnEditable
                });

                // Recreate overlay (recursive)
                ns.overlayManager.recreate(columnEditable);

                return columnEditable;
            });
    }

    /**
     * Refreshes the given column and grid originating from both the Structure of the template and content of the page
     *
     * @param {Granite.author.responsive.EditableActions}   editableAction          - Editable action calling the current function
     * @param {Granite.author.Editable}                     editable                - Editable representing the column to be refreshed
     * @param {{}}                                          [config]                - Configuration object to be sent with the request for the components HTML
     * @returns {$.Promise}
     */
    function processRefresh (editableAction, editable, config) {
        console.log({config});
        return ns.persistence.readParagraph(editable, config)
            .then(editableAction._postExecute(editable));
    }

    /**
     * Represents the REFRESH action that could be performed on an {@link Granite.author.Editable}
     *
     * @memberOf Granite.author.responsive.EditableActions
     * @type Granite.author.ui.EditableAction
     * @alias REFRESH
     */
    ns.responsive.EditableActions.REFRESH = new ns.ui.EditableAction({
        /**
         * Refreshes the given editable considered as a column of a responsive grid
         *
         * @memberOf Granite.author.responsive.EditableActions.REFRESH.prototype
         * @param {Granite.author.Editable} editable
         * @param {Object} [config]                         - Configuration object that describes how the editable will be read from the server
         * @returns {$.Promise}                             - Will be either resolved or rejected depending on the success of the operation
         */
        execute: function doRefresh(editable, config) {
            var self = this;

            // First reload the page info as it contains the responsive data,
            // then refresh the database and editable.
            // Finally, resolves the promise and pass the new editable
            return ns.loadPageInfo()
                .then(function () {
                    return ns.editableHelper.overlayCompleteRefresh(processRefresh(self, editable, config))
                });

        },

        /**
         * After we fetch of the JSON structure of the content, we send a command to the {@link Granite.author.ContentFrame} for the data to be replaced.
         *
         * @memberOf Granite.author.responsive.EditableActions.REFRESH.prototype
         * @param {Granite.author.Editable} editable                - Editable representing the component
         * @returns {$.Promise}
         * @private
         */
        _postExecuteJSON: function (editable) {
            // Get the model of the parent
            // as the parent can contain data about the current editable
            var targetEditable = ns.editables.getParent(editable);

            if (!targetEditable) {
                targetEditable = editable;
            }

            return ns.persistence.readParagraph(targetEditable, {})
                .then(function (data) {
                    data = {
                        key: targetEditable.getNodeName(),
                        value: data
                    };

                    return ns.ContentFrame.executeCommand(targetEditable.path, 'replace', data)
                        .then(function () {
                            // Reload the entire edit context, the editables and re-creates the overlays
                            return ns.ContentFrame.reloadEditable(editable);
                        });
                });
        },

        /**
         * After we fetch the HTML content, we send a command to the {@link Granite.author.ContentFrame} for the content to be replaced. We then update all the references.
         *
         * @memberOf Granite.author.responsive.EditableActions.REFRESH.prototype
         * @param {Granite.author.Editable} editable                - Editable representing the component
         * @param {string} path                                     - Path to the content
         * @param {*} data                                          - Raw data
         * @private
         */
        _postExecuteHTML: function (editable, path, data) {
            return updateResponsiveDOM(editable, data)
                .then(function (newEditable) {
                    return newEditable;
                });
        }
    });

}(jQuery, Granite.author, jQuery(document), this));

