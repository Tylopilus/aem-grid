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

    var selectedGrid = null;

    // data for current resize action
    var resizeProperties = {};

    /**
     * Returns the spacing related to the current resize event
     *
     * @param {number} selectedGridColumns  - Total number of grid columns
     * @param {number} spacing              - spacing present on left or right side of editable
     * @param {number} columns              - Number of columns that correspond to the width to be applied to the editable
     */
    function getSpacing (selectedGridColumns, spacing, columns) {
        // Positive values only
        return Math.max(parseInt(selectedGridColumns) - spacing - columns, 0);
    }

    /**
     * Returns the number columns already occupied by sibling {@link Granite.author.Editable}s on the current line
     *
     * A line is composed of any preceding siblings that are visible
     * A line may prematurely end if a component is set to start a new line (line break)
     *
     * @param {Granite.author.Editable} editable    - The editable that corresponds to the component to be resized
     * @param {number} gridColumns                  - Number of columns provided by the responsive grid container
     * @param {string} currentBreakpoint            - Name of the currently active breakpoint
     * @returns {number}
     */
    function getCurrentLineOccupiedColumns (editable, gridColumns, currentBreakpoint) {
        var parent = ns.editables.getParent(editable);
        if (!parent) {
            return 0;
        }
        const getInt = (config, prop) => (!!config[prop] ? parseInt(config[prop]) : 0)
        const size = config => getInt(config, "width") + getInt(config, "offset");

        const siblingEditables = ns.editables.getChildren(parent);
        const editableIndex = siblingEditables.findIndex(sibling => editable.path === sibling.path);

        return siblingEditables
          .slice(0, editableIndex)
          .reduce((prevSize, current) => {
              const config = current.config
                && current.config.responsive
                && current.config.responsive[currentBreakpoint];

              if (!config) { //  no configuration => full available width
                  return gridColumns;
              } else if ("hide" === config.behavior) { // ignore hidden
                  return prevSize;
              }

              const editableSize = size(config);
              if (("newline" === config.behavior) || (prevSize + editableSize > gridColumns)) { // newline OR overflow => reset
                  return editableSize;
              } else {
                  return prevSize + editableSize
              }
          }, 0);
    }

    /**
     * Returns the residual number of columns
     *
     * @param {number} gridColumns          - Number of columns provided by the responsive grid container
     * @param {number} occupiedColumns      - Number of columns already occupied on the line by {Granite.author.Editable} siblings
     * @param {number} framedColumns        - Number of columns that corresponds to the portion of the component on the right of where the left handle has been dropped
     * @returns {number}
     */
    function getResidualColumns (gridColumns, occupiedColumns, framedColumns) {
        // Positive values only
        return Math.max(gridColumns - occupiedColumns - framedColumns, 0);
    }

    /**
     * The framed columns fit into the remaining columns of the current line
     *
     * @param {number} occupiedColumns      - Number of columns already occupied on the line by {Granite.author.Editable} siblings
     * @param {number} framedColumns        - Number of columns that corresponds to the portion of the component on the right of where the left handle has been dropped
     * @param {number} gridColumns          - Number of columns provided by the responsive grid container
     * @param {number} columns               - Current column width of the component
     * @returns {boolean}
     */
    function fitInLine (occupiedColumns, framedColumns, gridColumns, columns) {
        return (occupiedColumns + framedColumns <= gridColumns || gridColumns - occupiedColumns >= columns);
    }

    /**
     * Deduct and apply the right width and offset based on the available space provided by the previous siblings of the given editable
     *
     * @param {Granite.author.Editable} selectedEditable        - Editable on which to apply dimensions
     * @param {{}} resizeProperties                             - Resize properties of the module
     * @param {number} columns                                  - Number of columns corresponding to the width to be applied to the editable
     */
    function applyResponsiveConfigFromSiblings (selectedEditable, resizeProperties, columns) {
        if (!selectedEditable) {
            return null;
        }

        var parent = ns.editables.getParent(selectedEditable);

        // Left spacing to be applied on the editable
        var leftSpacing = getSpacing(resizeProperties.selectedGridColumns, resizeProperties.spacing, columns);

        if (!parent) {
            // If the parent is not accessible get the offset instantly from the state of the module
            return leftSpacing;
        }

        var gridColumns = parseInt(resizeProperties.selectedGridColumns);
        var currentBreakpoint = ns.responsive.getCurrentBreakpoint();

        // Sum the available line space from the previous editable siblings
        var occupiedColumns = getCurrentLineOccupiedColumns(selectedEditable, gridColumns, currentBreakpoint);

        // Number of columns that corresponds to the portion of the component on the right of where the left handle has been dropped
        var framedColumns = gridColumns - leftSpacing;

        // If the editable is already sharing the current line space with the previous elements
        // If the size of the component can fit in the remaining available space
        if (fitInLine(occupiedColumns, framedColumns, gridColumns, columns)) {
            // Add the residual offset considering the available space on the line
            return getResidualColumns(gridColumns, occupiedColumns, framedColumns);
        }
        // Only the offset must be impacted
        return leftSpacing;
    }

    function handleResizeLeft (selectedEditable, resizeProperties, column) {
        var behavior;
        var breakpoint = ns.responsive.getCurrentBreakpoint();

        if (selectedEditable.config.responsive && selectedEditable.config.responsive[breakpoint]) {
            behavior = selectedEditable.config.responsive[breakpoint].behavior;
        }

        if ("newline" === behavior) {
            return getSpacing(resizeProperties.selectedGridColumns, resizeProperties.spacing, column);
        }

        return applyResponsiveConfigFromSiblings(selectedEditable, resizeProperties, column);
    }

    /**
     * interaction object which handles the direct user interaction with the editable
     *
     * @type {Object}
     */
    ns.responsive.interaction = {

        /**
         * indicates if an editable is currently resized
         * @type {boolean}
         */
        isResizing: false,

        isBlocked: false,

        /**
         * sets an editable as selected. Only single selection is supported
         *
         * @param editable
         */
        setSelected: function (editable) {
            var selectedEditable =  ns.selection.getAllSelected()[0];

            if (selectedEditable) {
                ns.selection.deselect(selectedEditable);
            }

            ns.selection.select(editable);

            this.setSelectedGrid(editable);
        },

        setSelectedGrid: function (editable) {
            selectedGrid = editable ? ns.editables.getParent(editable) : null;
        },

        /**
         * removes the current selection
         */
        removeSelection: function () {
            ns.selection.deselectAll();
            selectedGrid = null;
        },

        /**
         * adds the background grid for resizing
         *
         * @param gridEditable
         */
        addGridLines: function (gridEditable) {
            var rect = gridEditable.overlay.dom[0].getBoundingClientRect(),
                overlayWrapperRect = ns.OverlayWrapper.$el[0].getBoundingClientRect(),
                left = (rect.left - overlayWrapperRect.left),
                col = ns.responsive.getGridWidth(gridEditable),
                cellWidth = rect.width / col,
                con = $('.js-editor-ResponsiveGrid-resizeGrid');

            con.empty();

            for (var i=0; i<col; i++) {
                $('<div/>', {
                    'class': 'editor-ResponsiveGrid-resizeGrid-column'
                }).css({
                    'left': left + i * cellWidth,
                    'width': cellWidth
                }).appendTo(con);
            }
        },

        /**
         * removes the background grid for resizing
         */
        removeGridLines: function () {
            $('.js-editor-ResponsiveGrid-resizeGrid').empty();
        },

        /**
         * Calculates the closest snap line
         *
         * @param x
         * @param y
         * @returns {{x: *, y: *, range: number}}
         */
        getSnapLine: function (x, y) {
            if (!resizeProperties.gridCellWidth) {
                return {
                    x: x,
                    y: y
                }
            }
            var currentCol = Math.round((x - resizeProperties.gridRect.left) / resizeProperties.gridCellWidth);

            return {
                x: resizeProperties.gridRect.left + currentCol * resizeProperties.gridCellWidth,
                y: y,
                range: resizeProperties.gridCellWidth / 4
            };
        },

        /**
         *
         * @param event
         */
        onResizeStart: function (event) {
            var target = event.target;
            this.isResizing = true;

            // it is a sub nested grid
            resizeProperties.selectedGridColumns = ns.responsive.getGridWidth(selectedGrid);

            var gridRect = selectedGrid.overlay.dom[0].getBoundingClientRect();
            var componentRec = target.getBoundingClientRect();
            resizeProperties.componentRect = {};
            resizeProperties.componentRect.left = componentRec.left - gridRect.left;
            resizeProperties.componentRect.top = componentRec.top - gridRect.top;
            resizeProperties.componentRect.width = componentRec.width;
            resizeProperties.componentRect.height = componentRec.height;
            resizeProperties.gridRect = gridRect;

            resizeProperties.handle = $(event.originalTarget).attr('data-edge');

            resizeProperties.gridCellWidth = gridRect.width / resizeProperties.selectedGridColumns; // 1 cell in px

            resizeProperties.initialCells = Math.round(resizeProperties.componentRect.width / resizeProperties.gridCellWidth);
            resizeProperties.spacing = Math.round(getSpacing(gridRect.width, 0, (componentRec.right - gridRect.left)) / resizeProperties.gridCellWidth);

            if (resizeProperties.handle === 'left') {
                resizeProperties.restrict = {
                    left: [0, resizeProperties.componentRect.left + resizeProperties.componentRect.width - resizeProperties.gridCellWidth],
                    width: [resizeProperties.gridCellWidth, gridRect.width]
                };

                resizeProperties.startX = componentRec.left;

            } else if (resizeProperties.handle === 'right') {
                resizeProperties.restrict = {
                    left: [0, gridRect.width],
                    width: [resizeProperties.gridCellWidth, gridRect.width]
                };

                resizeProperties.startX = componentRec.left + componentRec.width;
            }

            this.addGridLines(selectedGrid);
        },

        /**
         *
         * @param event
         */
        onResizeMove: function (event) {
            var snapline = this.getSnapLine(event.clientX, event.clientY),
                target = event.target, deltaX, targetLeft, targetWidth;

            if ((event.clientX > (snapline.x - snapline.range)) &&
                (event.clientX < (snapline.x + snapline.range))) {
                deltaX = snapline.x - resizeProperties.startX;
            } else {
                deltaX = event.clientX - resizeProperties.startX;
            }

            if (resizeProperties.handle === 'left') {
                targetLeft = resizeProperties.componentRect.left + deltaX;

                if (targetLeft >= resizeProperties.restrict.left[0]) {
                    targetWidth = resizeProperties.componentRect.width - deltaX;
                } else {
                    targetWidth = resizeProperties.componentRect.left + resizeProperties.componentRect.width;
                }
            } else {
                // resizeProperties.handle === 'right'
                targetLeft = resizeProperties.componentRect.left;
                targetWidth = resizeProperties.componentRect.width + deltaX;
            }

            // restrictions
            if (targetLeft < resizeProperties.restrict.left[0]) {
                targetLeft = resizeProperties.restrict.left[0];
            }

            if (targetLeft > resizeProperties.restrict.left[1]) {
                targetLeft = resizeProperties.restrict.left[1];
            }

            if (targetWidth < resizeProperties.restrict.width[0]) {
                targetWidth = resizeProperties.restrict.width[0];
            }

            if (targetWidth > resizeProperties.restrict.width[1]) {
                targetWidth = resizeProperties.restrict.width[1];
            }

            target.style.left = targetLeft + 'px';
            target.style.width = targetWidth + 'px';
        },

        onOverlayHover: function (event) {
            if (this.isResizing || this.isBlocked) {
                return;
            }

            // we stop propagation to avoid having the containers activated
            event.stopImmediatePropagation();

            event.editable.overlay.setHover(event.originalEvent.type === 'mouseover');
        },

        onOverlayClick: function (event) {
            if (this.isBlocked) {
                return;
            }

            var e = event.editable,
                parent = ns.editables.getParent(e);

            // instead of the responsive grid placeholder, the container will be selected
            if (e.type === 'wcm/foundation/components/responsivegrid/new') {
                if (parent) {
                    e = parent;
                }
            }

            if (ns.responsive.isResponsiveGrid(e) || ns.responsive.isResponsiveGrid(parent)) {
                ns.responsive.interaction.setSelected(e);

                ns.EditorFrame.editableToolbar.open(e);
            } else {
                this.onOutsideOverlayClick();
            }
        },

        onOutsideOverlayClick: function () {
            if (this.isBlocked) {
                return;
            }

            ns.responsive.interaction.removeSelection();
            ns.EditorFrame.editableToolbar.close();
        },

        /**
         *
         * @param event
         */
        onResizeEnd: function (event) {
            var self = this;
            var selectedEditable =  ns.selection.getAllSelected()[0];
            // it can happen that no editable is selected
            if (selectedEditable) {
                var editableWidth = parseInt(selectedEditable.overlay.dom.width());

                var resizeConfig = {};

                // Right handle resize
                resizeConfig.width = Math.round(editableWidth / resizeProperties.gridCellWidth);

                if (resizeProperties.handle === 'right' && selectedGrid.overlay.dom[0]) {
                    var gridRect = selectedGrid.overlay.dom[0].getBoundingClientRect();
                    var target = event.target;
                    var componentRec = target.getBoundingClientRect();
                    resizeProperties.spacing = Math.round(getSpacing(gridRect.width, 0, (componentRec.right - gridRect.left)) / resizeProperties.gridCellWidth);
                }

                // Left Offset Resizing
                //resizeConfig.offset = handleResizeLeft(selectedEditable, resizeProperties, resizeConfig.width);
                //resizeConfig.colstart = getSpacing(resizeProperties.selectedGridColumns, resizeProperties.spacing, resizeConfig.width);
                resizeConfig.offset = getSpacing(resizeProperties.selectedGridColumns, resizeProperties.spacing, resizeConfig.width);
                console.warn('abcdef');

                ns.EditorFrame.editableToolbar.close();
                // hide the overlay until the server round trip and refresh is done
                ns.responsive.persistence.setBreakpointConfig(selectedEditable, ns.responsive.getCurrentBreakpoint(), resizeConfig)
                    .then(function () {
                        return ns.responsive.EditableActions.REFRESH.execute(selectedEditable);
                    })
                    .then(function (newEditable) {
                        console.log({newEditable});
                        self.removeSelection();
                        self.removeGridLines();
                        ns.selection.select(newEditable);
                        selectedGrid = ns.editables.getParent(newEditable);
                        // Close the current toolbar and dissociate it from
                        // the obsolete reference of the editable
                        ns.EditorFrame.editableToolbar.open(newEditable);
                    });

                resizeProperties = {};
                this.isResizing = false;
            }
        },

        startUnhideMode: function (editable) {
            this.isBlocked = true;
            ns.responsive.unhide.open(editable);
        },

        stopUnhideMode: function () {
            this.isBlocked = false;
            ns.responsive.unhide.close();
        },
        _private: {
            getCurrentLineOccupiedColumns
        }
    };

}(jQuery, Granite.author, jQuery(document), this));
