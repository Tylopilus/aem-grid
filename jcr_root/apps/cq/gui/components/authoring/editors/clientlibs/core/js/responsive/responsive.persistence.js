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
     * Persistence handling for responsive related saves
     * @type {Object}
     */
    ns.responsive.persistence = {

        /**
         * creates a new responsive configuration an editable
         * @param editable
         */
        createResponsiveConfig: function (editable) {
            var responsiveNode = new ns.persistence.PostRequest();

            // we create a cq:responsive node
            return responsiveNode.setURL(editable.path + '/' + ns.responsive.NN_RESPONSIVE)
                .send();
        },

        /**
         * sets the configuration a breakpoint
         *
         * @param editable
         * @param breakpoint
         * @param cfg
         * @returns {$.Promise}
         */
        setBreakpointConfig: function (editable, breakpoint, cfg) {
            var responsivegridEditable = ns.editables.getParent(editable),
                properties = {};

            properties[ns.responsive.NN_RESPONSIVE] = {};
            properties[ns.responsive.NN_RESPONSIVE][breakpoint] = cfg;

            function updateFunction() {
                var responsiveNode = new ns.persistence.PostRequest(),
                    url = editable.path + '/' + ns.responsive.NN_RESPONSIVE + '/' + breakpoint;

                // we create a cq:responsive node
                return responsiveNode
                    .setURL(url)
                    .setParams(cfg)
                    .send()
                    .then(function () {
                            editable.afterEdit();
                            responsivegridEditable && responsivegridEditable.afterChildEdit(editable);
                        }
                    );
            }

            // explicitly has to return false to abort the operation
            if (editable.beforeEdit(updateFunction, properties) === false ||
                (responsivegridEditable && (responsivegridEditable.beforeChildEdit(updateFunction, properties, editable) === false))) {
                return $.Deferred().reject().promise();
            } else {
                return updateFunction()
            }
        },

        /**
         * refreshes the parent grid of the given editable
         *
         * @param editable
         * @deprecated Since 6.3
         */
        refreshGrid: function (editable, config) {
            Granite.author.util.deprecated('Use Granite.author.responsive.EditableActions.REFRESH.execute instead');
            return ns.responsive.EditableActions.REFRESH.execute(editable, config);
        },

        /**
         * Persists the given width into the persistence layer
         *
         * @param editable
         * @param width
         */
        setWidth: function (editable, width) {
            var curBreakpoint = ns.responsive.getCurrentBreakpoint();

            this.setBreakpointConfig(editable, curBreakpoint, {
                width: width
            });
        },

        /**
         * Resets the breakpoint configuration
         *
         * @param editable
         * @param breakpoint or null to use the current breakpoint
         */
        resetBreakpointConfig: function (editable, breakpoint) {
            var pr = new ns.persistence.PostRequest(),
                bp = breakpoint || ns.responsive.getCurrentBreakpoint(),
                toReset = [];

            if (bp) {
                var children = ns.editables.getChildren(editable);

                children.forEach(function (child) {
                    if (child.config.responsive && child.config.responsive[bp]) {
                        toReset.push(child.path + '/' + ns.responsive.NN_RESPONSIVE + '/' + bp);
                    }
                });
            }

            if (toReset.length) {
                return pr.setURL(editable.path)
                    .setParam(':operation', 'delete')
                    .setParam(':applyTo', toReset)
                    .send();
            }

            return $.Deferred().resolve().promise();
        },

        /**
         * Makes the direct child components hidden again
         *
         * @param editable
         * @param breakpoint or null to use the current breakpoint
         */
        showHiddenChildren: function (editable, breakpoint) {
            var pr = new ns.persistence.PostRequest(),
                bp = breakpoint || ns.responsive.getCurrentBreakpoint(),
                doPost = false;

            if (bp) {
                var children = ns.responsive.getHiddenChildren(editable, bp);

                children.forEach(function (child) {
                    var breakpointPath = child.path.substring(editable.path.length + 1) + '/' + ns.responsive.NN_RESPONSIVE + '/' + bp;
                    var path = breakpointPath + '/behavior';

                    // Create the missing breakpoint
                    if (child.config.responsive && !child.config.responsive[bp]) {
                        pr.setParam(breakpointPath + '/jcr:primaryType', 'nt:unstructured');
                    }

                    if (child.config.responsive) {
                        doPost = true;
                        pr.setParam(path, 'none');
                    }
                });
            }

            if (doPost) {
                return pr.setURL(editable.path)
                    .send()
                    .then(function () {
                        ns.edit.EditableActions.REFRESH.execute(editable);
                    });
            }

            return $.Deferred().resolve().promise();
        }
    };

}(jQuery, Granite.author, jQuery(document), this));
