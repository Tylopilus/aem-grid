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
(function ($, ns, channel, window, undefined) {
  /**
   * Initial number of columns
   *
   * @type {number}
   */
  var RESPONSIVE_COLUMNS_DEFAULT = 12;

  /**
   * Name of the default breakpoint
   * @type {string}
   */
  var BREAKPOINT_DEFAULT_NAME = 'default';

  /**
   * Initial offset value
   *
   * @type {number}
   */
  var RESPONSIVE_OFFSET_DEFAULT = 0;

  /**
   * Default behavior or explicitly no behavior
   *
   * @type {string}
   */
  var RESPONSIVE_BEHAVIOR_NONE = 'none';

  /**
   * Currently selected breakpoint
   */
  var currentBreakpoint;

  /**
   * Verify if the given value is a finite float number
   *
   * @param val
   * @returns {boolean}
   */
  function isNumeric(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
  }

  /**
   * Ensure a column is not larger than its parent grid
   *
   * @param {Granite.author.Editable} editable
   */
  function adaptResponsiveColumnDimensions(editable) {
    var parent =
      (!getLegacyResponsiveBehaviour(editable) &&
        getClosestResponsiveParent(editable)) ||
      ns.editables.getParent(editable);
    var responsiveCfg = editable.config.responsive;

    if (!ns.responsive.isResponsive(editable)) {
      return;
    }

    for (var bp in responsiveCfg) {
      var columns = parseInt(
        ns.editableHelper.getStyleProperty(parent, 'columns', true) ||
          RESPONSIVE_COLUMNS_DEFAULT
      );
      var width =
        (responsiveCfg[bp] &&
          responsiveCfg[bp].width &&
          parseInt(responsiveCfg[bp].width)) ||
        columns ||
        RESPONSIVE_COLUMNS_DEFAULT;
      var offset =
        (responsiveCfg[bp] &&
          responsiveCfg[bp].offset &&
          parseInt(responsiveCfg[bp].offset)) ||
        RESPONSIVE_OFFSET_DEFAULT;

      // Limit the width and offset to the width of the parent
      if (columns && width + offset > columns) {
        if (width > columns) {
          width = columns;
          offset = 0;
        } else {
          width = columns - offset;
        }
      }

      if (responsiveCfg[bp].width) {
        responsiveCfg[bp].width = width;
      }

      if (responsiveCfg[bp].offset) {
        responsiveCfg[bp].offset = offset;
      }
    }
  }

  function getClosestResponsiveParent(editable) {
    let parent = ns.editables.getParent(editable);
    if (!parent) {
      return;
    }
    if (parent.config && parent.config.responsive) {
      return parent;
    }
    return getClosestResponsiveParent(parent);
  }

  /**
   * Returns the cq:useLegacyResponsiveBehaviour config value of the editable. Defaults to false.
   *
   * @param {Granite.author.Editable} editable - Editable for which to check the legacy responsive behaviour
   * @returns {boolean} Returns true if the Legacy Responsive Behaviour of the editable is ON, false otherwise.
   */
  function getLegacyResponsiveBehaviour(editable) {
    if (
      editable &&
      editable.config &&
      editable.config['cq:useLegacyResponsiveBehaviour'] === true
    ) {
      return true;
    }
    return false;
  }

  /**
   * Returns the list of CSS classes which will decorate a component in a responsive grid
   *
   * @param {Granite.author.Editable} editable        - Editable to be decorated
   * @param {boolean} [asString=true]                 - Should the list be returned as a single concatenated string or as an array of strings
   * @returns {string|string[]}
   */
  function getResponsiveCssClasses(editable, asString) {
    var responsiveCfg = editable.config.responsive;
    var cssClasses = [];
    var parent =
      (!getLegacyResponsiveBehaviour(editable) &&
        getClosestResponsiveParent(editable)) ||
      ns.editables.getParent(editable);
    var parentResponsiveCfg;

    if (parent && parent.config && parent.config.responsive) {
      parentResponsiveCfg = parent.config.responsive;
    }

    // Either it already has a responsive configuration
    // Or it is a column
    if (ns.responsive.isResponsive(editable)) {
      cssClasses.push(ns.responsive.DEFAULT_COLUMN_CSS_CLASS);

      if (responsiveCfg) {
        for (var bp in responsiveCfg) {
          var columnBreakpoint = responsiveCfg[bp];
          var width = columnBreakpoint.width;
          var offset = columnBreakpoint.offset || RESPONSIVE_OFFSET_DEFAULT;
          var behavior = columnBreakpoint.behavior || RESPONSIVE_BEHAVIOR_NONE;

          // As we are not refreshing the parent of a column any longer
          // The class names must be generated on the backend when displaying the page at first
          // and then must be generated on the front end when resizing the content
          // This code is duplicated from com/day/cq/wcm/foundation/model/responsivegrid/ResponsiveColumn.java
          if (parentResponsiveCfg) {
            var gridBreakpoint = parentResponsiveCfg[bp];

            // If there is not enough space to have both the width and the offset
            if (gridBreakpoint && width + offset > gridBreakpoint.width) {
              if (width > gridBreakpoint.width) {
                // The width is bigger than the parent
                // We take the full size
                width = gridBreakpoint.width;
                offset = 0;
              } else if (offset < gridBreakpoint.width) {
                // There is room for the offset and a width
                width = gridBreakpoint.width - offset;
              } else {
                // There is no room for an offset
                offset = 0;
              }
            }
          }

          if (width) {
            cssClasses.push(
              ns.responsive.DEFAULT_COLUMN_CSS_CLASS + '--' + bp + '--' + width
            );
          }

          cssClasses.push(
            ns.responsive.DEFAULT_COLUMN_CSS_CLASS +
              '--offset--' +
              bp +
              '--' +
              offset
          );
          cssClasses.push(
            ns.responsive.DEFAULT_COLUMN_CSS_CLASS + '--' + bp + '--' + behavior
          );
        }
      } else {
        let fallbackDefaultWidth = RESPONSIVE_COLUMNS_DEFAULT;
        if (
          !getLegacyResponsiveBehaviour(editable) &&
          parentResponsiveCfg &&
          parentResponsiveCfg[BREAKPOINT_DEFAULT_NAME]
        ) {
          fallbackDefaultWidth =
            parentResponsiveCfg[BREAKPOINT_DEFAULT_NAME]['width'] ||
            fallbackDefaultWidth;
        }

        // No responsive config set, so use the default values
        cssClasses.push(
          ns.responsive.DEFAULT_COLUMN_CSS_CLASS +
            '--' +
            BREAKPOINT_DEFAULT_NAME +
            '--' +
            fallbackDefaultWidth
        );
      }
    }

    if (!asString) {
      return cssClasses;
    }

    return cssClasses.join(' ');
  }

  /**
   * Sets the class names that the given editable column requires to be on its parent grid
   *
   * @param {Granite.author.Editable} editable    - Editable representing the responsive column
   */
  function setResponsiveParentCssClasses(editable) {
    var parent = ns.editables.getParent(editable);
    var responsiveCfg = editable.config.responsive;
    var gridCssClassPrefix = ns.responsive.DEFAULT_CSS_PREFIX;
    var cssClasses = {};

    if (!parent) {
      return;
    }

    // Either it already has a responsive configuration
    // Or it is a column
    if (responsiveCfg && ns.responsive.isResponsiveGrid(parent)) {
      for (var bp in responsiveCfg) {
        // Set the potentially missing grid inner width/columns from
        // the provided column size or
        // the grid width for the current breakpoint or
        // the grid width for the default breakpoint or
        // the default number of column of a grid
        var columns = ns.editableHelper.getStyleProperty(
          parent,
          'columns',
          true
        );
        var key = gridCssClassPrefix + '--' + bp + '--';
        var parentConfigWidth =
          parent.config &&
          parent.config.responsive &&
          parent.config.responsive[bp] &&
          parent.config.responsive[bp].width;
        var defaultConfigWidth =
          parent.config &&
          parent.config.responsive &&
          parent.config.responsive[BREAKPOINT_DEFAULT_NAME] &&
          parent.config.responsive[BREAKPOINT_DEFAULT_NAME].width;
        var width =
          columns ||
          parentConfigWidth ||
          defaultConfigWidth ||
          RESPONSIVE_COLUMNS_DEFAULT;
        cssClasses[key] = key + width;
      }

      // Update parent class names
      var gridDom = parent.dom[0].querySelector('.' + gridCssClassPrefix);

      if (!gridDom) {
        return;
      }

      // Only add breakpoint class names that are not yet available
      for (var key in cssClasses) {
        if (cssClasses.hasOwnProperty(key)) {
          var found = false;

          for (var i = 0, length = gridDom.classList.length; i < length; i++) {
            if (gridDom.classList[i].indexOf(key) === 0) {
              found = true;
              break;
            }
          }

          if (!found) {
            gridDom.classList.add(cssClasses[key]);
          }
        }
      }
    }
  }

  /**
   * Removes all the classes names corresponding to a responsive column
   *
   * @param element
   */
  function clearResponsiveColumnCssClasses(element) {
    var oldGridClasses = [];
    // Remove the already existing grid class names
    for (var i = 0; i < element.classList.length; i++) {
      var className = element.classList[i];

      if (className.indexOf(ns.responsive.DEFAULT_COLUMN_CSS_CLASS) === 0) {
        oldGridClasses.push(className);
      }
    }

    if (oldGridClasses.length > 0) {
      element.classList.remove.apply(element.classList, oldGridClasses);
    }
  }

  /**
   * Namespace of the Responsive mode
   *
   * <p>Also contains utilities</p>
   *
   * @namespace
   * @alias Granite.author.responsive
   * @type {{}}
   */
  ns.responsive = {
    /**
     * JCR node name for the responsive config
     *
     * @type {String}
     */
    NN_RESPONSIVE: 'cq:responsive',

    /**
     * Css prefix for the responsive grid
     *
     * @type {String}
     */
    DEFAULT_CSS_PREFIX: 'aem-Grid',

    /**
     * Css class of the responsive column elements (children of responsive grid)
     *
     * @type {String}
     */
    DEFAULT_COLUMN_CSS_CLASS: 'aem-GridColumn',

    /**
     * function to test if an editable is a responsive grid
     *
     * @param editable
     * @returns {boolean}
     */
    isResponsiveGrid: function (editable) {
      return editable && editable.config && editable.config.isResponsiveGrid;
    },

    /**
     * function to test if a editable is located in an responsive grid
     *
     * @param editable
     * @returns {boolean}
     */
    isInResponsiveGrid: function (editable) {
      var parent = ns.editables.getParent(editable);

      if (parent && this.isResponsiveGrid(parent)) {
        return true;
      }

      return false;
    },

    /**
     * Is the given Editable a responsive component
     *
     * @param {Granite.author.Editable} editable
     * @returns {boolean}
     */
    isResponsive: function (editable) {
      if (!editable) {
        return false;
      }

      // most obvious case: if the editable has local responsive config
      if (editable.config && editable.config.responsive) {
        return true;
      }

      // if no local config is set but the editable is the child of an editable grid parent
      var parent = ns.editables.getParent(editable);
      if (parent) {
        return parent && ns.responsive.isResponsiveGrid(parent);
      }

      // last resort: if the editable is a structure editable with no editable parent grid
      return (
        editable.dom &&
        editable.dom.hasClass(ns.responsive.DEFAULT_COLUMN_CSS_CLASS)
      );
    },

    /**
     * Refreshes the given editable and its DOM with its responsive column attributes
     *
     * Called by the responsive grid component afterchildinsert property
     *
     * @param {Granite.author.Editable} editable
     */
    refresh: function (editable) {
      if (ns.responsive.isResponsive(editable)) {
        var parent = ns.editables.getParent(editable);

        if (parent && ns.responsive.isResponsiveGrid(parent)) {
          // Mostly to update the responsive properties before creating the overlays
          var columnNode = ns.ContentFrame.getEditableNode(editable.path)[0];

          if (columnNode) {
            ns.responsive.updateDom(editable, columnNode);
            ns.overlayManager.recreate(editable);
          }
        }
      }
    },

    /**
     * Updates the DOM for the given editable with the latest responsive attributes
     *
     * @param {Granite.author.Editable} editable    - Editable representing the responsive column to be updated
     * @param {HTMLElement} newDomElement           - Latest version of the column DOM element
     */
    updateDom: function (editable, newDomElement) {
      adaptResponsiveColumnDimensions(editable);
      var classNames = getResponsiveCssClasses(editable);

      if (classNames && classNames.length > 0) {
        clearResponsiveColumnCssClasses(newDomElement);
        newDomElement.classList.add.apply(newDomElement.classList, classNames);
      }

      setResponsiveParentCssClasses(editable);
    },

    /**
     * Returns the list of CSS classes which will decorate a component in a responsive grid
     *
     * @param {Granite.author.Editable} editable        - Editable to be decorated
     * @returns {string|string[]}
     * @deprecated
     */
    getResponsiveCssClasses: function (editable) {
      Granite.author.util.deprecated();
      return getResponsiveCssClasses(editable).join(' ');
    },

    /**
     * returns a list of hidden children of the responsive grid component
     *
     * @param editable
     * @param breakpoint
     * @returns {Array}
     */
    getHiddenChildren: function (editable, breakpoint) {
      var bp = breakpoint || this.getCurrentBreakpoint(),
        children = ns.editables.getChildren(editable),
        hiddenChildren = [];

      children.forEach(function (child) {
        if (child.config.responsive) {
          var responsiveCfg =
            child.config.responsive[bp] ||
            child.config.responsive[BREAKPOINT_DEFAULT_NAME];

          if (responsiveCfg && responsiveCfg.behavior === 'hide') {
            hiddenChildren.push(child);
          }
        }
      });

      return hiddenChildren;
    },

    /**
     * Returns the selected configuration for a given editable
     * @param {Granite.author.Editable} editable    - Editable from which to extract a responsive configuration
     * @param {string} breakpointName               - Name of the breakpoint
     * @returns {Object}
     */
    getResponsiveConfig: function (editable, breakpointName) {
      return editable.config.responsive &&
        editable.config.responsive[breakpointName]
        ? editable.config.responsive[breakpointName]
        : {};
    },

    /**
     * Returns the currently ACTIVE configuration for an editable for the currently active breakpoint
     * @param editable
     * @returns {Object}
     */
    getCurrentResponsiveConfig: function (editable) {
      return this.getResponsiveConfig(editable, this.getCurrentBreakpoint());
    },

    /**
     * Returns the currently ACTIVE behavior for an editable for the currently active breakpoint
     *
     * @param editable
     * @returns {String}
     */
    getCurrentResponsiveBehavior: function (editable) {
      var bp = this.getCurrentResponsiveConfig(editable);

      return bp.behavior || 'none';
    },

    /**
     * Returns the name of the currently active breakpoint
     * @returns {String}
     */
    getCurrentBreakpoint: function () {
      return currentBreakpoint || 'default';
    },

    /**
     * Sets a breakpoint to be active
     * @param breakpoint name to be activated
     */
    setCurrentBreakpoint: function (breakpoint) {
      currentBreakpoint = breakpoint;
    },

    /**
     * Sets a breakpoint active based on the passed width of the device
     *
     * @param deviceWidth
     */
    setDeviceBreakpoint: function (deviceWidth) {
      this.setCurrentBreakpoint(this.getDeviceBreakpoint(deviceWidth));
    },

    /**
     * gets the breakpoint for a given device width
     *
     * @param deviceWidth
     * @returns {Object} smallest breakpoint for which the deviceWidth is less (not equal) than the width in config
     */
    getDeviceBreakpoint: function (deviceWidth) {
      var cfg = this.getBreakpoints(),
        closestBp;

      for (var bp in cfg) {
        if (
          cfg[bp].width > deviceWidth &&
          (!closestBp || cfg[bp].width <= cfg[closestBp].width)
        ) {
          closestBp = bp;
        }
      }

      return closestBp;
    },

    /**
     * gets a breakpoint config by name
     *
     * @param name
     * @returns {Object}
     */
    getBreakpoint: function (name) {
      var cfg = this.getBreakpoints();

      return cfg[name];
    },

    /**
     * Returns all set breakpoints on the page
     *
     * @returns {Object}
     */
    getBreakpoints: function () {
      if (ns.pageInfo.responsive && ns.pageInfo.responsive.breakpoints) {
        return ns.pageInfo.responsive.breakpoints;
      }

      return {};
    },

    /**
     * @returns {Array.String} ordered list of breakpoint names (by width)
     */
    getOrderedBreakpoints: function () {
      var cfg = this.getBreakpoints(),
        ret = [];

      for (var bp in cfg) {
        ret.push(bp);
      }

      ret.sort(function (a, b) {
        if (cfg[a].width < cfg[b].width) {
          return -1;
        }

        if (cfg[a].width > cfg[b].width) {
          return 1;
        }

        return 0;
      });

      ret.push('default');

      return ret;
    },

    /**
     *
     * @param gridEditable
     * @returns {number} amount of grid cells for the current breakpoint
     */
    getGridWidth: function (gridEditable) {
      var col = ns.editableHelper.getStyleProperty(gridEditable, 'columns');
      if (isNumeric(col)) {
        return col;
      }

      let parent = getClosestResponsiveParent(gridEditable);
      col = getGridWidthFromResponsiveConfig.call(this, gridEditable, parent);
      return col || RESPONSIVE_COLUMNS_DEFAULT;

      function getGridWidthFromResponsiveConfig(gridEditable, parent) {
        let col;
        if (gridEditable.config.responsive) {
          col = getCurrentBreakpointOrDefaultFrom.call(this, gridEditable);
        } else if (
          !getLegacyResponsiveBehaviour(gridEditable) &&
          parent &&
          parent.config &&
          parent.config.responsive
        ) {
          col = getCurrentBreakpointOrDefaultFrom.call(this, parent);
        }
        return col;
      }

      function getCurrentBreakpointOrDefaultFrom(editable) {
        let col;
        if (editable.config.responsive[this.getCurrentBreakpoint()]) {
          col = editable.config.responsive[this.getCurrentBreakpoint()].width;
        } else if (editable.config.responsive['default']) {
          col = editable.config.responsive['default'].width;
        }
        return col || RESPONSIVE_COLUMNS_DEFAULT;
      }
    },
  };
})(jQuery, Granite.author, jQuery(document), this);
