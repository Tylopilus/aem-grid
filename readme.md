# AEM Grid that makes use of css's grid system

This module overwrites the default classes which are provided by the base core components to leverage a grid system which is based off of css's grid system.
This change allows for proper gutter padding and alignment of content without the need of floats.

## Get started

This package exposes in total three exports:

- a javascript default export from 'aem-grid'
- a minified css output from 'aem-grid/css'
- a scss output from 'aem-grid/scss'

If your project is scaffoled with the 'aem archetype', you can use the following code to add the grid to your project:

```javascript
// main.ts
import AemGrid from 'aem-grid';
AemGrid();
```

```scss
// main.scss
@import 'aem-grid/scss';
@include aem-grid(
  12,
  30px
); // first param is column count, second is gutter width
```
